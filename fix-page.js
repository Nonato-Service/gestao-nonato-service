const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'app', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add Fragment to React import
content = content.replace(
  /import React, \{ useState, useEffect, useCallback, useMemo, useRef \} from 'react'/,
  "import React, { useState, useEffect, useCallback, useMemo, useRef, Fragment } from 'react'"
);

// 2. Wrap familias-grupos panel in Fragment (avoid parser bug with <div after = ()
const open = "const familiasGruposPanelContent = (\n          <div className=\"familias-grupos-panel\"";
const openFixed = "const familiasGruposPanelContent = (\n          <Fragment>\n          <div className=\"familias-grupos-panel\"";
if (content.includes(open) && !content.includes(openFixed)) {
  content = content.replace(open, openFixed);
}

// 3. Close Fragment before ); const renderFamiliasGrupos
const close = ")}\n          </div>\n        );\n        const renderFamiliasGrupos = () => familiasGruposPanelContent;";
const closeFixed = ")}\n          </div>\n          </Fragment>\n        );\n        const renderFamiliasGrupos = () => familiasGruposPanelContent;";
if (content.includes(close)) {
  content = content.replace(close, closeFixed);
}

// 4. Babel: ?? -> || for addGrupo line
content = content.replace(
  /safeT\?\.addGrupo \?\? safeT\?\.add \|\| 'Adicionar grupo'/g,
  "safeT?.addGrupo || safeT?.add || 'Adicionar grupo'"
);

// 5. Babel: })() )} -> }) )} (fix closing)
content = content.replace(/}\)\s*\(\)\s*\)\s*}/g, '}) )}');

fs.writeFileSync(filePath, content);
console.log('Fix applied.');
