/**
 * Copia css/style.css completo do app de referência para esta pasta (portável).
 * Caminho do original: biblioteca-tecnica-site/config-origem-copia.json
 * Na raiz do repo: npm run biblio:css-portavel
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, '..');
const cfgPath = path.join(__dirname, 'config-origem-copia.json');
const examplePath = path.join(__dirname, 'config-origem-copia.example.json');

if (!fs.existsSync(cfgPath)) {
  console.error('Falta:', cfgPath);
  console.error('Copie', path.basename(examplePath), '→', path.basename(cfgPath));
  console.error('e defina "raizProjetoOriginal" (pasta que contém css/style.css). Qualquer nome de pasta serve.');
  process.exit(1);
}

let cfg;
try {
  cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
} catch (e) {
  console.error('JSON inválido em', cfgPath);
  process.exit(1);
}

const raiz = typeof cfg.raizProjetoOriginal === 'string' ? cfg.raizProjetoOriginal.trim() : '';
if (!raiz) {
  console.error('Defina "raizProjetoOriginal" em', cfgPath);
  process.exit(1);
}

const srcDir = path.isAbsolute(raiz) ? path.normalize(raiz) : path.resolve(repoRoot, raiz);
const src = path.join(srcDir, 'css', 'style.css');
const dst = path.join(__dirname, 'css', 'style.css');

if (!fs.existsSync(src)) {
  console.error('Origem inexistente:', src);
  console.error('Verifique raizProjetoOriginal em', cfgPath);
  process.exit(1);
}
fs.mkdirSync(path.dirname(dst), { recursive: true });
fs.copyFileSync(src, dst);
console.log('OK', fs.statSync(dst).size, 'bytes ->', dst);
