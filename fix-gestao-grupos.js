const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'app', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');

const startMarker = `            {/* Conteúdo Principal */}
            <div style={{ 
              padding: '30px', 
              backgroundColor: '#1a1a1a', 
              borderRadius: '12px', 
              border: '2px solid rgba(0, 255, 0, 0.3)'
            }}>
              {!showGrupoChecklistForm && !showManutencaoForm ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                    <h2 style={{ color: '#00ff00', margin: 0, fontSize: '24px' }}>
                      {safeT?.gruposChecklist || 'Grupos para Checklist'}
                    </h2>
                    <button`;

const endMarker = `
      case 'checklist-hub':`;

const replacement = `            {/* Conteúdo Principal - Nota de advertência */}
            <div style={{ 
              padding: '30px', 
              backgroundColor: '#1a1a1a', 
              borderRadius: '12px', 
              border: '2px solid rgba(0, 255, 0, 0.3)'
            }}>
              <div
                style={{
                  padding: '28px 36px',
                  backgroundColor: 'rgba(180, 0, 0, 0.3)',
                  border: '2px solid rgba(255, 80, 80, 0.6)',
                  borderRadius: '12px',
                  color: '#ffffff',
                  fontSize: '18px',
                  fontWeight: 600,
                  textAlign: 'center',
                  lineHeight: 1.5
                }}
              >
                {safeT?.avisoAvalConformidade || 'Somente o gestor ou responsável pelo projeto poderá avaliar e dar o aval de conformidade.'}
              </div>
            </div>
          </div>
        )
` + endMarker;

const idx = content.indexOf(startMarker);
if (idx === -1) {
  console.error('Start marker not found');
  process.exit(1);
}

const idxEnd = content.indexOf(endMarker, idx);
if (idxEnd === -1) {
  console.error('End marker not found');
  process.exit(1);
}

const newContent = content.slice(0, idx) + replacement + content.slice(idxEnd + endMarker.length);
fs.writeFileSync(filePath, newContent, 'utf8');
console.log('Replace done.');
