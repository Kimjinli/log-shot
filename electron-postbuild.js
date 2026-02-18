/**
 * Electron Post-Build Script
 * Standalone 빌드 후 필요한 파일들을 올바른 위치로 복사
 */
const fs = require('fs-extra');
const path = require('path');

async function postBuild() {
  console.log('[Post-Build] Starting post-build process...');

  const rootDir = __dirname;
  const standaloneDir = path.join(rootDir, '.next', 'standalone');
  const nextStaticSource = path.join(rootDir, '.next', 'static');
  const nextStaticDest = path.join(standaloneDir, '.next', 'static');
  const publicSource = path.join(rootDir, 'public');
  const publicDest = path.join(standaloneDir, 'public');
  const dataSource = path.join(rootDir, 'data');
  const dataDest = path.join(standaloneDir, 'data');

  try {
    // .next/static 복사
    if (await fs.pathExists(nextStaticSource)) {
      console.log('[Post-Build] Copying .next/static...');
      await fs.copy(nextStaticSource, nextStaticDest, { overwrite: true });
      console.log('[Post-Build] ✓ Copied .next/static');
    } else {
      console.warn('[Post-Build] ⚠ .next/static not found');
    }

    // public 폴더 복사
    if (await fs.pathExists(publicSource)) {
      console.log('[Post-Build] Copying public folder...');
      await fs.copy(publicSource, publicDest, { overwrite: true });
      console.log('[Post-Build] ✓ Copied public folder');
    } else {
      console.warn('[Post-Build] ⚠ public folder not found');
    }

    // data 폴더 복사 (SQLite DB)
    if (await fs.pathExists(dataSource)) {
      console.log('[Post-Build] Copying data folder...');
      await fs.copy(dataSource, dataDest, { overwrite: true });
      console.log('[Post-Build] ✓ Copied data folder');
    } else {
      console.log('[Post-Build] ℹ data folder not found (will be created at runtime)');
    }

    console.log('[Post-Build] ✓ Post-build process completed successfully');
  } catch (error) {
    console.error('[Post-Build] ✗ Post-build process failed:', error);
    process.exit(1);
  }
}

postBuild();
