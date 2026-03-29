#!/bin/bash
cd "$(dirname "$0")"

echo "========================================"
echo "  FFmpeg Watcher 설치 (Mac)"
echo "========================================"
echo ""

# Node.js 확인
if ! command -v node &> /dev/null; then
    echo "[오류] Node.js가 설치되어 있지 않습니다."
    echo "  brew install node  또는  https://nodejs.org/ 에서 설치하세요."
    echo ""
    read -n 1 -s -r -p "아무 키나 누르면 창이 닫힙니다..."
    osascript -e 'tell application "Terminal" to close front window' &
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
        echo "  그 후 다시 setup.command를 실행하세요."
        echo ""
        echo "5초 후 창이 자동으로 닫힙니다..."
        sleep 5
        osascript -e 'tell application "Terminal" to close front window' &
        exit 1
    fi
fi
echo "[✓] FFmpeg $(ffmpeg -version 2>&1 | head -1 | awk '{print $3}') 확인"

# 패키지 설치
echo ""
echo "패키지 설치 중..."
npm install

echo ""
echo "========================================"
echo "  설치 완료!"
echo "  실행: start.command를 더블클릭하세요"
echo "========================================"
echo ""
echo "3초 후 창이 자동으로 닫힙니다..."
sleep 3
osascript -e 'tell application "Terminal" to close front window' &
