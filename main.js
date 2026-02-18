/**
 * Electron Main Process - Log-Shot
 */
const { app, BrowserWindow, Menu, shell } = require("electron");
const path = require("path");
const { fork } = require("child_process");
const fs = require("fs");

let mainWindow;
let nextServer;
const isDev = !app.isPackaged;
const port = 3000;

// 1. Next.js 서버 실행 함수
function startNextServer() {
  return new Promise((resolve) => {
    console.log("[Electron] Starting Next.js server...");

    let standaloneServerPath;
    let standaloneCwd;

    if (app.isPackaged) {
      // 패키징된 경우: app.asar.unpacked 폴더에서 참조 (asarUnpack 설정 필수)
      const unpackedPath = __dirname.replace("app.asar", "app.asar.unpacked");
      standaloneServerPath = path.join(
        unpackedPath,
        ".next",
        "standalone",
        "server.js",
      );
      standaloneCwd = path.join(unpackedPath, ".next", "standalone");
    } else {
      // 개발 모드
      standaloneServerPath = path.join(
        __dirname,
        ".next",
        "standalone",
        "server.js",
      );
      standaloneCwd = path.join(__dirname, ".next", "standalone");
    }

    if (!fs.existsSync(standaloneServerPath)) {
      console.error(
        "[Electron] Standalone server not found at:",
        standaloneServerPath,
      );
      return resolve(); // 에러가 나도 로딩 시도 로직으로 넘김
    }

    // 서버 실행
    nextServer = fork(standaloneServerPath, [], {
      cwd: standaloneCwd,
      env: {
        ...process.env,
        NODE_ENV: "production",
        PORT: port.toString(),
        HOSTNAME: "127.0.0.1",
      },
      stdio: ["ignore", "pipe", "pipe", "ipc"],
      windowsHide: true, // 윈도우에서 검은 cmd 창 방지
    });

    nextServer.stdout.on("data", (data) => {
      const output = data.toString();
      console.log(`[Next.js] ${output}`);
      // 서버 준비 완료 메시지 감지
      if (output.includes("Ready") || output.includes("listening")) {
        resolve();
      }
    });

    nextServer.stderr.on("data", (data) => {
      console.error(`[Next.js Error] ${data.toString()}`);
    });

    // 10초 타임아웃
    setTimeout(resolve, 10000);
  });
}

// 2. 브라우저 창 생성 및 로드 함수
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    backgroundColor: "#1a1a1a", // 검은 화면 대신 초기 배경색
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    autoHideMenuBar: true,
  });

  const startUrl = isDev ? `http://localhost:3000` : `http://127.0.0.1:${port}`;

  // [중요] 서버가 뜰 때까지 무한 재시도 (검은 화면 방지 핵심)
  const loadPage = () => {
    mainWindow.loadURL(startUrl).catch(() => {
      console.log("[Electron] Server not ready, retrying in 1s...");
      setTimeout(loadPage, 1000);
    });
  };

  loadPage();

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
    if (isDev) mainWindow.webContents.openDevTools();
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// 3. 앱 라이프사이클 관리
app.whenReady().then(async () => {
  if (!isDev) {
    try {
      await startNextServer();
    } catch (e) {
      console.error("Server Start Error:", e);
    }
  }
  createWindow();
});

// 프로세스 종료 시 서버 강제 종료 (포트 점유 방지)
const killServer = () => {
  if (nextServer) {
    nextServer.kill("SIGTERM");
    nextServer = null;
  }
};

app.on("window-all-closed", () => {
  killServer();
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", killServer);
