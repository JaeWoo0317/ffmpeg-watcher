#!/bin/bash
cd "$(dirname "$0")"

echo "FFmpeg Watcher 시작 중..."
echo "브라우저에서 설정: http://localhost:4001"
echo "종료하려면 Ctrl+C를 누르세요."
echo ""

# 브라우저 자동 열기 (2초 후)
(sleep 2 && open "http://localhost:4001") &

node server.js

# 서버 종료 후 자동으로 창 닫기
echo ""
echo "서버가 종료되었습니다. 3초 후 창이 자동으로 닫힙니다..."
sleep 3
osascript -e 'tell application "Terminal" to close front window' &
