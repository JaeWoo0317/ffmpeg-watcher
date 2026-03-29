# 📁 FFmpeg Watcher

**영상 파일을 폴더에 넣으면 자동으로 변환해주는 프로그램입니다.**

폴더를 감시하고 있다가, 새 영상 파일이 들어오면 내가 정해둔 설정으로 자동 변환해줘요.
설정은 브라우저에서 쉽게 할 수 있어요!

---

## 🖥️ 이 프로그램이 하는 일

```
📂 감시 폴더에 영상 파일 넣기
        ↓
🤖 자동으로 변환 시작
        ↓
📂 출력 폴더에 변환된 파일 저장
        ↓
📂 원본 파일은 done 폴더로 이동
```

---

## 📖 설치 가이드 (운영체제를 선택하세요)

<table>
<tr>
<td align="center" width="50%">

### 🪟 Windows 사용자

👉 **[Windows 설치 가이드 보기](docs/WINDOWS.md)**

`setup.bat` 더블클릭으로 간단 설치

</td>
<td align="center" width="50%">

### 🍎 Mac 사용자

👉 **[Mac 설치 가이드 보기](docs/MAC.md)**

`setup.command` 더블클릭으로 간단 설치

</td>
</tr>
</table>

---

## 📋 지원 파일 형식

| 종류 | 지원 형식 |
|------|-----------|
| 영상 입력 | `.mp4` `.mkv` `.avi` `.mov` `.wmv` `.flv` `.webm` `.m4v` `.ts` |
| 자막 | `.srt` `.ass` `.ssa` |
| 워터마크 | `.png` `.jpg` |

---

## ⚠️ 주의사항

이 프로그램은 **ffmpeg-videomaker** 프로젝트와 같은 폴더에 있어야 합니다.

```
📂 ryu_ws/
├── 📂 ffmpeg-watcher/   ← 이 프로그램
└── 📂 videomaker/       ← 이것도 필요해요!
```

👉 videomaker: [https://github.com/JaeWoo0317/ffmpeg-videomaker](https://github.com/JaeWoo0317/ffmpeg-videomaker)

---

## 🏗️ 프로젝트 구조

```
ffmpeg-watcher/
├── server.js            ← 서버 (건드리지 마세요)
├── package.json         ← 패키지 정보 (건드리지 마세요)
├── watcher.config.json  ← 내 설정이 저장되는 파일 (자동 생성)
├── public/
│   └── index.html       ← 브라우저 설정 화면
├── docs/
│   ├── WINDOWS.md       ← Windows 설치 가이드
│   └── MAC.md           ← Mac 설치 가이드
├── setup.bat            ← Windows 설치 스크립트
├── start.bat            ← Windows 실행 스크립트
├── setup.command        ← Mac 설치 스크립트
└── start.command        ← Mac 실행 스크립트
```
