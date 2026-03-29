#!/bin/bash
cd "$(dirname "$0")"

echo "========================================"
echo "  FFmpeg Watcher 설치"
echo "========================================"
echo ""

# 실행 권한 부여 (Mac)
chmod +x setup.command start.command 2>/dev/null

# Node.js 확인
if ! command -v node &> /dev/null; then
    echo "[오류] Node.js가 설치되어 있지 않습니다."
    echo "  brew install node  또는  https://nodejs.org/ 에서 설치하세요."
    exit 1
fi
echo "[✓] Node.js $(node -v) 확인"

# FFmpeg 확인
if ! command -v ffmpeg &> /dev/null; then
    echo "[!] FFmpeg이 설치되어 있지 않습니다. 설치를 시도합니다..."
    if command -v brew &> /dev/null; then
        brew install ffmpeg
    else
        echo "[오류] Homebrew가 없습니다. 먼저 Homebrew를 설치하세요:"
        echo '  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"'
        exit 1
    fi
fi
echo "[✓] FFmpeg 확인"

# 패키지 설치
echo ""
echo "패키지 설치 중..."
npm install

echo ""
echo "========================================"
echo "  설치 완료!"
echo "  실행: node server.js  또는  start.command 더블클릭"
echo "========================================"
