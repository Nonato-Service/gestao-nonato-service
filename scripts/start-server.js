#!/usr/bin/env node
// Script para iniciar o Next.js usando a porta correta (Railway usa PORT, local usa 3000)
// -H 0.0.0.0: necessário para aceitar conexões externas no Railway
const { spawn } = require('child_process');
const path = require('path');

const port = process.env.PORT || 3000;
const nextBin = path.join(__dirname, '..', 'node_modules', 'next', 'dist', 'bin', 'next');

const child = spawn('node', [nextBin, 'start', '-H', '0.0.0.0', '-p', String(port)], {
  stdio: 'inherit',
  cwd: path.join(__dirname, '..'),
});

child.on('exit', (code) => {
  process.exit(code || 0);
});
