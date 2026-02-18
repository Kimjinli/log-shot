# Electron 배포 가이드

Log-Shot을 Electron 데스크톱 애플리케이션으로 배포하는 방법입니다.

## 목차

- [개요](#개요)
- [설치](#설치)
- [개발 모드](#개발-모드)
- [프로덕션 빌드](#프로덕션-빌드)
- [배포](#배포)
- [문제 해결](#문제-해결)

## 개요

Electron을 사용하면 Log-Shot을 Windows, macOS, Linux용 네이티브 데스크톱 애플리케이션으로 배포할 수 있습니다.

### 장점

- ✅ 완전한 오프라인 지원
- ✅ 로컬 파일 시스템 사용 (Vercel Blob 불필요)
- ✅ SQLite 데이터베이스 사용 (PostgreSQL 불필요)
- ✅ 네이티브 앱처럼 설치 가능
- ✅ 자동 업데이트 지원 가능

### 단점

- ❌ 앱 크기가 큼 (약 150-200MB)
- ❌ 각 플랫폼별로 별도 빌드 필요
- ❌ 서버 기능 제한 (Next.js API Routes는 로컬에서만 실행)

## 설치

### 1. 의존성 설치

```bash
npm install
```

Electron 관련 패키지가 자동으로 설치됩니다:
- `electron`: Electron 프레임워크
- `electron-builder`: 앱 패키징 도구
- `concurrently`: 동시 프로세스 실행
- `wait-on`: 서버 대기 유틸리티

### 2. 데이터베이스 초기화

```bash
npm run db:generate:local
npm run db:migrate:local
npm run db:seed
```

## 개발 모드

### 방법 1: 개발 서버 + Electron (권장)

```bash
npm run electron:dev
```

이 명령어는 다음을 수행합니다:
1. Next.js 개발 서버 시작 (`localhost:3000`)
2. 서버가 준비될 때까지 대기
3. Electron 앱 실행

**장점**: Hot Reload 지원, 빠른 개발

### 방법 2: Electron만 실행

```bash
# 터미널 1
npm run dev

# 터미널 2 (서버가 시작된 후)
npm run electron
```

## 프로덕션 빌드

### 1. 웹 앱 빌드

```bash
npm run build:web
```

Next.js 앱을 프로덕션 모드로 빌드합니다.

### 2. Electron 앱 빌드

#### 모든 플랫폼 (현재 OS)

```bash
npm run electron:build
```

#### Windows 전용

```bash
npm run electron:build:win
```

출력:
- `dist-electron/Log-Shot Setup 0.1.0.exe` - 설치 프로그램
- `dist-electron/Log-Shot 0.1.0.exe` - Portable 실행 파일

#### macOS 전용

```bash
npm run electron:build:mac
```

출력:
- `dist-electron/Log-Shot-0.1.0.dmg` - DMG 설치 이미지
- `dist-electron/Log-Shot-0.1.0-mac.zip` - ZIP 아카이브

#### Linux 전용

```bash
npm run electron:build:linux
```

출력:
- `dist-electron/Log-Shot-0.1.0.AppImage` - AppImage 실행 파일
- `dist-electron/log-shot_0.1.0_amd64.deb` - Debian 패키지

### 3. 빌드 결과 확인

```bash
ls -lh dist-electron/
```

## 배포

### 자동 빌드 및 배포

```bash
npm run deploy:electron
```

이 명령어는 다음을 수행합니다:
1. Next.js 앱 빌드
2. Electron 앱 빌드
3. `dist-electron/` 폴더에 배포 파일 생성

### 수동 배포

1. **빌드 파일 생성**
   ```bash
   npm run electron:build
   ```

2. **배포 파일 확인**
   ```bash
   cd dist-electron
   ls -lh
   ```

3. **파일 배포**
   - GitHub Releases에 업로드
   - 웹사이트에서 다운로드 제공
   - 소프트웨어 스토어에 등록

## 설정 커스터마이징

### electron-builder.json

앱 아이콘, 이름, 패키징 옵션을 변경할 수 있습니다:

```json
{
  "appId": "com.logshot.app",
  "productName": "Log-Shot",
  "directories": {
    "output": "dist-electron"
  },
  "win": {
    "target": ["nsis", "portable"],
    "icon": "public/icon.ico"
  },
  "mac": {
    "target": ["dmg", "zip"],
    "icon": "public/icon.icns"
  },
  "linux": {
    "target": ["AppImage", "deb"],
    "icon": "public/icon.png"
  }
}
```

### main.js

Electron 메인 프로세스 설정을 변경할 수 있습니다:

```javascript
const mainWindow = new BrowserWindow({
  width: 1200,       // 초기 창 너비
  height: 800,       // 초기 창 높이
  minWidth: 800,     // 최소 너비
  minHeight: 600,    // 최소 높이
  icon: path.join(__dirname, 'public', 'icon.png'),
  // ...
});
```

## 아이콘 추가하기

Electron 앱은 플랫폼별 아이콘이 필요합니다:

### Windows (.ico)

```bash
# 256x256 PNG 이미지 준비
# https://convertio.co 등에서 .ico로 변환
# public/icon.ico에 저장
```

### macOS (.icns)

```bash
# 1024x1024 PNG 이미지 준비
# https://cloudconvert.com 등에서 .icns로 변환
# public/icon.icns에 저장
```

### Linux (.png)

```bash
# 512x512 PNG 이미지
# public/icon.png에 저장
```

## 자동 업데이트 설정 (선택사항)

### 1. electron-updater 설치

```bash
npm install electron-updater --save
```

### 2. main.js 수정

```javascript
const { autoUpdater } = require('electron-updater');

app.whenReady().then(() => {
  // 자동 업데이트 확인
  autoUpdater.checkForUpdatesAndNotify();

  createWindow();
});
```

### 3. electron-builder.json에 publish 설정 추가

```json
{
  "publish": {
    "provider": "github",
    "owner": "yourusername",
    "repo": "log-shot"
  }
}
```

### 4. GitHub Releases에 자동 배포

```bash
# GitHub Personal Access Token 설정
export GH_TOKEN="your-github-token"

# 빌드 및 배포
npm run electron:build
```

## 환경 변수

Electron 앱에서 사용 가능한 환경 변수:

```bash
# .env 파일
DATABASE_PATH=./data/sqlite.db
PORT=3000
NODE_ENV=production
```

## 문제 해결

### 1. "electron not found" 오류

```bash
npm install electron --save-dev
```

### 2. 빌드 시 "sharp" 오류

```bash
npm rebuild sharp
```

### 3. Windows에서 서명 오류

```bash
# electron-builder.json에 추가
{
  "win": {
    "certificateFile": null,
    "certificatePassword": null
  }
}
```

또는 코드 서명 인증서 구매 및 설정

### 4. macOS에서 "App is damaged" 오류

macOS는 서명되지 않은 앱을 차단합니다. 개발용으로 실행하려면:

```bash
xattr -cr /Applications/Log-Shot.app
```

프로덕션 배포를 위해서는 Apple Developer 계정으로 앱 서명 필요

### 5. Linux에서 AppImage가 실행되지 않음

실행 권한 추가:

```bash
chmod +x Log-Shot-0.1.0.AppImage
./Log-Shot-0.1.0.AppImage
```

### 6. "Cannot find module 'next'" 오류

Next.js가 빌드에 포함되지 않은 경우:

```bash
npm run build:web
```

### 7. 데이터베이스 파일을 찾을 수 없음

Electron 앱은 `app.getPath('userData')`에 데이터를 저장합니다:

- **Windows**: `C:\Users\USERNAME\AppData\Roaming\Log-Shot`
- **macOS**: `~/Library/Application Support/Log-Shot`
- **Linux**: `~/.config/Log-Shot`

## 배포 체크리스트

프로덕션 배포 전 확인사항:

- [ ] package.json의 version 업데이트
- [ ] 앱 아이콘 추가 (.ico, .icns, .png)
- [ ] electron-builder.json 설정 확인
- [ ] 데이터베이스 마이그레이션 파일 포함
- [ ] .env 파일 제거 (민감한 정보)
- [ ] 라이선스 파일 추가
- [ ] 코드 서명 인증서 설정 (선택사항)
- [ ] 자동 업데이트 설정 (선택사항)
- [ ] 앱 테스트 (각 플랫폼)

## 성능 최적화

### 앱 크기 줄이기

1. **불필요한 의존성 제거**
   ```bash
   npm prune --production
   ```

2. **Next.js 출력 최적화**
   ```javascript
   // next.config.mjs
   export default {
     output: 'standalone',
     compress: true,
   };
   ```

3. **Electron 패키징 최적화**
   ```json
   {
     "files": [
       "main.js",
       ".next/**/*",
       "public/**/*",
       "!**/*.map"
     ]
   }
   ```

### 시작 속도 개선

1. **지연 로딩 사용**
   ```javascript
   // main.js
   mainWindow.loadURL(startUrl);
   mainWindow.show(); // 로딩 완료 후 표시
   ```

2. **캐싱 활성화**
   ```javascript
   webPreferences: {
     enableRemoteModule: false,
     nodeIntegration: false,
     contextIsolation: true,
     // 캐시 활성화
     partition: 'persist:main'
   }
   ```

## 참고 자료

- [Electron 공식 문서](https://www.electronjs.org/docs/latest)
- [electron-builder 문서](https://www.electron.build)
- [Next.js + Electron 가이드](https://github.com/vercel/next.js/tree/canary/examples/with-electron)
- [electron-updater 문서](https://www.electron.build/auto-update)

## 배포 플랫폼

### GitHub Releases (권장)

1. GitHub 저장소 생성
2. electron-builder.json에 publish 설정
3. GitHub Actions로 자동 빌드

### Microsoft Store (Windows)

1. [Windows Dev Center](https://partner.microsoft.com) 계정 생성
2. electron-builder의 appx 타겟 사용

### Mac App Store (macOS)

1. Apple Developer 계정 필요 ($99/년)
2. electron-builder의 mas 타겟 사용

### Snap Store (Linux)

1. [Snapcraft](https://snapcraft.io) 계정 생성
2. electron-builder의 snap 타겟 사용

## 라이선스

앱 배포 시 오픈소스 라이선스 준수 확인:
- Electron (MIT)
- Next.js (MIT)
- 기타 사용된 라이브러리들

## 지원

문제가 발생하면 [GitHub Issues](../../issues)에 등록해주세요.
