# Log-Shot 데이터베이스 및 파일 초기화 가이드

## 🔄 전체 초기화 (DB + 업로드 파일)

### Windows (PowerShell/CMD)

```powershell
# 1. 개발 서버 중지 (Ctrl+C)

# 2. 데이터베이스 파일 삭제
del /q data\*.db
del /q data\*.db-shm
del /q data\*.db-wal

# 3. 업로드된 파일 삭제
del /q public\uploads\*
del /q public\thumbnails\*

# 4. 데이터베이스 재생성
npm run db:push
# 또는
npx drizzle-kit push

# 5. (선택사항) 샘플 데이터 추가
npm run db:seed

# 6. 개발 서버 재시작
npm run dev
```

### Linux/Mac (Bash)

```bash
# 1. 개발 서버 중지 (Ctrl+C)

# 2. 데이터베이스 파일 삭제
rm -f data/*.db data/*.db-shm data/*.db-wal

# 3. 업로드된 파일 삭제
rm -rf public/uploads/*
rm -rf public/thumbnails/*

# 4. 디렉토리가 없으면 생성
mkdir -p public/uploads
mkdir -p public/thumbnails

# 5. 데이터베이스 재생성
npm run db:push

# 6. (선택사항) 샘플 데이터 추가
npm run db:seed

# 7. 개발 서버 재시작
npm run dev
```

---

## 📁 부분 초기화

### 1. 데이터베이스만 초기화

```bash
# 데이터베이스 파일 삭제
rm -f data/*.db*

# 재생성
npx drizzle-kit push
```

### 2. 업로드 파일만 초기화

```bash
# 업로드된 이미지 삭제
rm -rf public/uploads/*
rm -rf public/thumbnails/*
```

### 3. 특정 프로젝트의 사진만 삭제

데이터베이스에 직접 접근이 필요합니다:

```bash
# SQLite CLI 실행
sqlite3 data/local.db

# 프로젝트 ID 확인
SELECT * FROM projects;

# 특정 프로젝트의 사진 소프트 삭제
UPDATE photos SET is_deleted = 1 WHERE project_id = 'PROJECT_ID';

# 종료
.exit
```

---

## 🛠️ 자동화 스크립트

### reset-db.sh (Linux/Mac)

```bash
#!/bin/bash

echo "🔄 Log-Shot 데이터베이스 초기화 시작..."

# 1. 파일 삭제
rm -f data/*.db data/*.db-shm data/*.db-wal
rm -rf public/uploads/*
rm -rf public/thumbnails/*

# 2. 디렉토리 생성
mkdir -p data
mkdir -p public/uploads
mkdir -p public/thumbnails

# 3. 데이터베이스 재생성
npx drizzle-kit push

echo "✅ 초기화 완료!"
echo "📝 개발 서버를 재시작하세요: npm run dev"
```

### reset-db.bat (Windows)

```batch
@echo off
echo 🔄 Log-Shot 데이터베이스 초기화 시작...

REM 1. 파일 삭제
del /q data\*.db 2>nul
del /q data\*.db-shm 2>nul
del /q data\*.db-wal 2>nul
del /q public\uploads\* 2>nul
del /q public\thumbnails\* 2>nul

REM 2. 디렉토리 생성 (없으면)
if not exist "data" mkdir data
if not exist "public\uploads" mkdir public\uploads
if not exist "public\thumbnails" mkdir public\thumbnails

REM 3. 데이터베이스 재생성
call npx drizzle-kit push

echo ✅ 초기화 완료!
echo 📝 개발 서버를 재시작하세요: npm run dev
pause
```

---

## ⚠️ 주의사항

1. **백업**: 초기화 전에 중요한 데이터는 백업하세요
2. **서버 중지**: 초기화하기 전에 반드시 개발 서버를 중지하세요
3. **권한**: Linux/Mac에서는 스크립트 실행 권한이 필요합니다:
   ```bash
   chmod +x reset-db.sh
   ./reset-db.sh
   ```

---

## 🔍 문제 해결

### "Permission denied" 오류

```bash
# Windows: 관리자 권한으로 CMD/PowerShell 실행
# Linux/Mac: sudo 사용
sudo rm -rf data/*.db*
```

### 데이터베이스 파일이 삭제되지 않음

```bash
# 프로세스가 파일을 사용 중일 수 있음
# 1. 개발 서버 강제 종료
taskkill /F /IM node.exe  # Windows
killall node              # Linux/Mac

# 2. 다시 삭제 시도
```

### 디렉토리가 자동으로 생성되지 않음

```bash
# 수동으로 디렉토리 생성
mkdir -p data
mkdir -p public/uploads
mkdir -p public/thumbnails
```

---

## 📊 데이터 확인

### SQLite CLI로 데이터 확인

```bash
# SQLite CLI 실행
sqlite3 data/local.db

# 테이블 목록 확인
.tables

# 사진 개수 확인
SELECT COUNT(*) FROM photos WHERE is_deleted = 0;

# 프로젝트 목록 확인
SELECT * FROM projects;

# 종료
.exit
```

---

## 🚀 빠른 초기화 (One-liner)

```bash
# Linux/Mac
rm -rf data/*.db* public/uploads/* public/thumbnails/* && npx drizzle-kit push && echo "✅ Done!"

# Windows (PowerShell)
Remove-Item data\*.db*,public\uploads\*,public\thumbnails\* -Force; npx drizzle-kit push; Write-Host "✅ Done!"
```
