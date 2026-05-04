/* One-shot: copia style.css completo da Bíblia para esta pasta (portável). Node no PATH. */
const fs = require('fs');
const path = require('path');
const src = path.join(__dirname, '..', '..', 'biblia-nonato-service', 'css', 'style.css');
const dst = path.join(__dirname, 'css', 'style.css');
if (!fs.existsSync(src)) {
  console.error('Origem inexistente:', src);
  process.exit(1);
}
fs.mkdirSync(path.dirname(dst), { recursive: true });
fs.copyFileSync(src, dst);
console.log('OK', fs.statSync(dst).size, 'bytes ->', dst);
