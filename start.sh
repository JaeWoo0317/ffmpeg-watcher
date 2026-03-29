#!/bin/bash
cd "$(dirname "$0")"

echo "FFmpeg Watcher 시작 중..."
echo ""

# 브라우저 자동 열기 (2초 후)
(sleep 2 && open "http://localhost:4001" 2>/dev/null || xdg-open "http://localhost:4001" 2>/dev/null) &

node server.js
