const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const chokidar = require('chokidar');
const path = require('path');
const fs = require('fs');
const os = require('os');

const { convertVideo, checkGpuSupport } = require('../videomaker/server/ffmpeg.js');

const CONFIG_FILE = path.join(__dirname, 'watcher.config.json');
const PUBLIC_DIR = path.join(__dirname, 'public');
const VIDEOMAKER_ASSET_DIR = path.join(__dirname, '../videomaker/server/assets');
const PORT = 4001;

const VIDEO_EXTS = new Set(['.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv', '.webm', '.m4v', '.ts']);

const DEFAULT_CONFIG = {
  watchFolder: path.join(os.homedir(), 'Videos', 'input').replace(/\\/g, '/'),
  outputFolder: path.join(os.homedir(), 'Videos', 'output').replace(/\\/g, '/'),
  settings: {
    codec: 'h264',
    container: 'mp4',
    profile: 'high',
    scaleFilter: 'bilinear',
    resolution: 'original',
    customWidth: '',
    customHeight: '',
    keepAspectRatio: true,
    fps: '',
    bitrateMode: 'crf',
    crf: 23,
    videoBitrate: 5000,
    preset: 'medium',
    maxFileSizeMB: '',
    gpuAccel: 'auto',
    gpuEncoder: '',
    parallelEncode: false,
    parallelSegments: '',
    deinterlace: false,
    noiseReduction: false,
    noiseStrength: 5,
    audioCodec: 'aac',
    audioBitrate: 192,
    audioChannels: 'stereo',
    audioSampleRate: 48000,
    trimStart: '',
    trimEnd: '',
    cropEnabled: false,
    cropWidth: '',
    cropHeight: '',
    cropX: '',
    cropY: '',
    subtitleLocalPath: '',
    subtitleFontSize: 24,
    subtitlePosition: 'bottom',
    watermarkLocalPath: '',
    watermarkPosition: 'bottom-right',
    watermarkOpacity: 0.7,
  },
};

function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    }
  } catch {}
  return JSON.parse(JSON.stringify(DEFAULT_CONFIG));
}

function saveConfig(config) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf8');
}

if (!fs.existsSync(CONFIG_FILE)) {
  saveConfig(DEFAULT_CONFIG);
}

// subtitle/watermark 로컬 경로를 ffmpeg.js가 기대하는 형식으로 변환
function prepareSettings(settings) {
  const s = { ...settings };

  if (s.subtitleLocalPath && fs.existsSync(s.subtitleLocalPath)) {
    fs.mkdirSync(VIDEOMAKER_ASSET_DIR, { recursive: true });
    const basename = path.basename(s.subtitleLocalPath);
    fs.copyFileSync(s.subtitleLocalPath, path.join(VIDEOMAKER_ASSET_DIR, basename));
    s.subtitleFile = { serverFilename: basename };
  }

  if (s.watermarkLocalPath && fs.existsSync(s.watermarkLocalPath)) {
    fs.mkdirSync(VIDEOMAKER_ASSET_DIR, { recursive: true });
    const basename = path.basename(s.watermarkLocalPath);
    fs.copyFileSync(s.watermarkLocalPath, path.join(VIDEOMAKER_ASSET_DIR, basename));
    s.watermarkFile = { serverFilename: basename };
  }

  // GPU 자동 감지 처리
  if (s.gpuAccel === 'auto' && gpuInfo && gpuInfo.available) {
    s.gpuEncoder = gpuInfo.recommended;
  } else if (s.gpuAccel === 'cpu') {
    s.gpuEncoder = '';
  }

  return s;
}

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());
app.use(express.static(PUBLIC_DIR));

app.get('/api/config', (req, res) => res.json(loadConfig()));

app.post('/api/config', (req, res) => {
  const config = req.body;
  saveConfig(config);
  restartWatcher(config);
  res.json({ ok: true });
});

app.get('/api/gpu-info', (req, res) => res.json(gpuInfo || {}));

// ------- Watcher -------

const processing = new Set();
let watcher = null;
let gpuInfo = null;

function log(msg, type = 'info') {
  const line = `[${new Date().toLocaleTimeString()}] ${msg}`;
  console.log(line);
  io.emit('log', { msg: line, type });
}

async function processFile(filePath, config) {
  const name = path.basename(filePath);
  if (processing.has(filePath)) return;
  processing.add(filePath);

  log(`감지됨: ${name}`);

  const { outputFolder, settings } = config;
  const container = settings.container || 'mp4';
  const extMap = { mp4: '.mp4', mkv: '.mkv', webm: '.webm', mov: '.mov', avi: '.avi' };
  const ext = extMap[container] || '.mp4';
  const baseName = path.basename(filePath, path.extname(filePath));
  const outputPath = path.join(outputFolder, baseName + ext);

  fs.mkdirSync(outputFolder, { recursive: true });

  const prepared = prepareSettings(settings);

  try {
    await convertVideo(filePath, outputPath, prepared, (progress) => {
      io.emit('progress', { file: name, progress });
      process.stdout.write(`\r[${name}] ${progress}%   `);
    });
    console.log('');

    const doneDir = path.join(path.dirname(filePath), 'done');
    fs.mkdirSync(doneDir, { recursive: true });
    fs.renameSync(filePath, path.join(doneDir, name));

    log(`완료: ${name} → ${path.basename(outputPath)}`, 'success');
    io.emit('done', { file: name, output: path.basename(outputPath) });
  } catch (err) {
    console.log('');
    log(`오류: ${name} — ${err.message}`, 'error');
    io.emit('error', { file: name, error: err.message });
  } finally {
    processing.delete(filePath);
  }
}

function startWatcher(config) {
  const { watchFolder } = config;
  fs.mkdirSync(watchFolder, { recursive: true });
  fs.mkdirSync(path.join(watchFolder, 'done'), { recursive: true });

  watcher = chokidar.watch(watchFolder, {
    ignored: (p) => {
      const rel = path.relative(watchFolder, p);
      if (rel.startsWith('done')) return true;
      const ext = path.extname(p).toLowerCase();
      return ext !== '' && !VIDEO_EXTS.has(ext);
    },
    ignoreInitial: true,
    awaitWriteFinish: { stabilityThreshold: 2000, pollInterval: 500 },
    depth: 0,
  });

  watcher.on('add', (filePath) => {
    const freshConfig = loadConfig();
    processFile(filePath, freshConfig);
  });

  log(`감시 시작: ${watchFolder}`);
}

function restartWatcher(config) {
  if (watcher) {
    watcher.close().then(() => {
      watcher = null;
      startWatcher(config);
      log('설정이 저장됐습니다. 감시 폴더를 재시작했습니다.');
    });
  } else {
    startWatcher(config);
  }
}

// ------- Auto-shutdown -------

let connectedClients = 0;
let hasConnected = false;
let shutdownTimer = null;

io.on('connection', (socket) => {
  connectedClients++;
  hasConnected = true;
  if (shutdownTimer) { clearTimeout(shutdownTimer); shutdownTimer = null; }

  socket.on('disconnect', () => {
    connectedClients--;
    if (hasConnected && connectedClients === 0) {
      shutdownTimer = setTimeout(() => process.exit(0), 5000);
    }
  });
});

// ------- Start -------

server.listen(PORT, async () => {
  console.log(`FFmpeg Watcher 실행 중: http://localhost:${PORT}`);
  gpuInfo = await checkGpuSupport();
  if (gpuInfo && gpuInfo.available) log(`GPU 가속 감지됨: ${gpuInfo.recommended}`);
  else log('GPU 가속 없음 — CPU 인코딩 사용 (libx264)');

  const config = loadConfig();
  startWatcher(config);
});
