#!/usr/bin/env node
// Inicia Next.js em produção na PORT (Railway) ou 3000 (local), em 0.0.0.0.
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const appRoot = path.join(__dirname, '..');
const port = process.env.PORT || 3000;
const nextBin = path.join(appRoot, 'node_modules', 'next', 'dist', 'bin', 'next');
const standaloneCandidates = [
  path.join(appRoot, 'server.js'),
  path.join(appRoot, '.next', 'standalone', 'server.js'),
];
const standaloneServer = standaloneCandidates.find((p) => fs.existsSync(p));
const standaloneCwd = standaloneServer
  ? standaloneServer.includes(`${path.sep}.next${path.sep}standalone${path.sep}`)
    ? path.join(appRoot, '.next', 'standalone')
    : appRoot
  : appRoot;
const dataDir =
  process.env.RAILWAY_VOLUME_MOUNT_PATH ||
  process.env.DATA_DIR ||
  path.join(appRoot, 'data');

console.log('[start-server] NODE_ENV:', process.env.NODE_ENV || 'production');
console.log('[start-server] PORT:', port);

/** Railway costuma ter NODE_OPTIONS=384 (build) — insuficiente em runtime ao carregar ~94 JSON. */
function resolveRuntimeNodeOptions(raw) {
  const MIN_RUNTIME_MB = 512;
  const TARGET_RUNTIME_MB = 768;
  const source = (raw || '').trim();
  const match = source.match(/--max-old-space-size=(\d+)/);
  const currentMb = match ? parseInt(match[1], 10) : 0;

  if (currentMb > 0 && currentMb < MIN_RUNTIME_MB) {
    return source.replace(/--max-old-space-size=\d+/, `--max-old-space-size=${TARGET_RUNTIME_MB}`);
  }
  if (!currentMb) {
    return source
      ? `${source} --max-old-space-size=${TARGET_RUNTIME_MB}`
      : `--max-old-space-size=${TARGET_RUNTIME_MB}`;
  }
  return source;
}

const runtimeNodeOptions = resolveRuntimeNodeOptions(process.env.NODE_OPTIONS);
if (runtimeNodeOptions !== (process.env.NODE_OPTIONS || '').trim()) {
  console.log(
    '[start-server] NODE_OPTIONS runtime:',
    runtimeNodeOptions,
    `(Railway/build: ${process.env.NODE_OPTIONS || '(default)'})`
  );
} else {
  console.log('[start-server] NODE_OPTIONS:', runtimeNodeOptions || '(default)');
}

try {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  // Libertar órfãos .tmp / .bak e .txt gémeos de stock/biblioteca (ENOSPC no Railway).
  let freed = 0;
  let deleted = 0;
  const walkDirs = [dataDir];
  try {
    for (const ent of fs.readdirSync(dataDir, { withFileTypes: true })) {
      if (ent.isDirectory()) walkDirs.push(path.join(dataDir, ent.name));
    }
  } catch (_) {
    /* ignorar */
  }
  const jsonSotKeys = [
    'nonato-pecas-stock',
    'nonato-categorias-pecas-stock',
    'nonato-subcategorias-pecas-stock',
    'nonato-pecas-biblioteca',
    'nonato-pecas-biblioteca-lite',
  ];
  for (const dir of walkDirs) {
    let names = [];
    try {
      names = fs.readdirSync(dir);
    } catch (_) {
      continue;
    }
    for (const name of names) {
      const full = path.join(dir, name);
      let st;
      try {
        st = fs.statSync(full);
      } catch (_) {
        continue;
      }
      if (!st.isFile()) continue;
      const isTmp = name.includes('.tmp-') || /\.tmp$/i.test(name);
      const isBak = name.endsWith('.bak');
      let dropTxt = false;
      for (const key of jsonSotKeys) {
        if (name === `${key}.txt`) {
          const jsonSide = path.join(dir, `${key}.json`);
          if (fs.existsSync(jsonSide)) {
            try {
              if (fs.statSync(jsonSide).size > 2) dropTxt = true;
            } catch (_) {
              /* ignorar */
            }
          }
          break;
        }
      }
      if (!isTmp && !isBak && !dropTxt) continue;
      try {
        freed += st.size;
        fs.unlinkSync(full);
        deleted += 1;
      } catch (_) {
        /* ignorar */
      }
    }
  }
  if (deleted > 0) {
    console.log(
      `[start-server] Cleanup disco: ${deleted} ficheiro(s), ~${(freed / (1024 * 1024)).toFixed(1)} MB`
    );
  }
  const files = fs.readdirSync(dataDir).filter((f) => f.endsWith('.json') || f.endsWith('.txt'));
  console.log('[start-server] DATA_DIR:', dataDir);
  console.log('[start-server] Ficheiros de dados:', files.length);
  if (files.length < 3) {
    console.warn(
      '[start-server] AVISO: poucos ficheiros em DATA_DIR — configure volume Railway e DATA_DIR (ex.: /data ou /app/data).'
    );
  }
} catch (e) {
  console.warn('[start-server] Não foi possível verificar DATA_DIR:', e);
}

const useStandalone = Boolean(standaloneServer);
if (useStandalone) {
  console.log('[start-server] Modo: standalone (menos memória)', standaloneServer);
} else if (!fs.existsSync(nextBin)) {
  console.error('[start-server] Next.js não encontrado. Execute npm ci && npm run build.');
  process.exit(1);
} else {
  console.log('[start-server] Modo: next start');
}

const childEnv = {
  ...process.env,
  NODE_ENV: process.env.NODE_ENV || 'production',
  NODE_OPTIONS: runtimeNodeOptions,
  PORT: String(port),
  HOSTNAME: '0.0.0.0',
};

const child = useStandalone
  ? spawn(process.execPath, [standaloneServer], {
      stdio: 'inherit',
      cwd: standaloneCwd,
      env: childEnv,
    })
  : spawn(process.execPath, [nextBin, 'start', '-H', '0.0.0.0', '-p', String(port)], {
      stdio: 'inherit',
      cwd: appRoot,
      env: childEnv,
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
