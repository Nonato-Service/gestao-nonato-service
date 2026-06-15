#!/usr/bin/env node
// Inicia Next.js em produção na PORT (Railway) ou 3000 (local), em 0.0.0.0.
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const port = process.env.PORT || 3000;
const nextBin = path.join(__dirname, '..', 'node_modules', 'next', 'dist', 'bin', 'next');
const dataDir =
  process.env.RAILWAY_VOLUME_MOUNT_PATH ||
  process.env.DATA_DIR ||
  path.join(__dirname, '..', 'data');

try {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  const files = fs.readdirSync(dataDir).filter((f) => f.endsWith('.json') || f.endsWith('.txt'));
  console.log('[start-server] DATA_DIR:', dataDir);
  console.log('[start-server] Ficheiros de dados:', files.length);
  if (files.length < 3) {
    console.warn(
      '[start-server] AVISO: poucos ficheiros em DATA_DIR — configure volume Railway (/app/data) e DATA_DIR=/app/data para não perder cadastros após deploy.'
    );
  }
} catch (e) {
  console.warn('[start-server] Não foi possível verificar DATA_DIR:', e);
}

if (!fs.existsSync(nextBin)) {
  console.error('[start-server] Next.js não encontrado em:', nextBin);
  console.error('[start-server] Execute npm ci && npm run build no contentor.');
  process.exit(1);
}

const child = spawn(process.execPath, [nextBin, 'start', '-H', '0.0.0.0', '-p', String(port)], {
  stdio: 'inherit',
  cwd: path.join(__dirname, '..'),
  env: { ...process.env, NODE_ENV: process.env.NODE_ENV || 'production' },
});

function forwardSignal(sig) {
  if (child.exitCode === null && child.signalCode === null) {
    child.kill(sig);
  }
}

process.on('SIGTERM', () => forwardSignal('SIGTERM'));
process.on('SIGINT', () => forwardSignal('SIGINT'));

child.on('error', (err) => {
  console.error('[start-server] Falha ao iniciar Next:', err);
  process.exit(1);
});

child.on('exit', (code, signal) => {
  if (signal === 'SIGTERM' || signal === 'SIGINT') {
    process.exit(0);
  }
  if (signal) {
    process.exit(1);
  }
  process.exit(code ?? 0);
});
