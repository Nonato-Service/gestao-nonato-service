const fs = require('fs')
const path = require('path')

const file = path.join(__dirname, '..', 'app', 'page.tsx')
let c = fs.readFileSync(file, 'utf8')

const startMarker = "      case 'ordem-preparacao':"
const endMarker = "      case 'formularios-checklist-tecnicos':"

const start = c.indexOf(startMarker)
const end = c.indexOf(endMarker, start)
if (start < 0 || end < 0) {
  console.error('Block not found', start, end)
  process.exit(1)
}

let block = c.slice(start, end)

block = block.replace(
  /<div style=\{\{ padding: '30px', maxWidth: '1600px', margin: '0 auto' \}\}>/,
  '<div className="op-pro">'
)

block = block.replace(
  /            \{\/\* Cabeçalho Profissional \*\/\}[\s\S]*?            \{\/\* Formulário \*\/\}/,
  `            <section className="op-pro__hero">
              <div className="op-pro__hero-top">
                <div className="op-pro__hero-brand">
                  <span className="op-pro__hero-icon" aria-hidden>OP</span>
                  <div>
                    <p className="op-pro__eyebrow">{safeT?.checklistHubStep2 || 'Gestão do checklist'}</p>
                    <h1 className="op-pro__title">{safeT?.opTitle || 'Ordem de Preparação'}</h1>
                    <p className="op-pro__lead">
                      {safeT?.ordemPreparacaoDesc || safeT?.checklistDesc || 'Gerenciamento de ordens de preparação'}
                    </p>
                  </div>
                </div>
                <div className="op-pro__hero-actions">
                  <LogoComponent size="small" />
                  <button
                    type="button"
                    className="op-pro__btn op-pro__btn--secondary"
                    onClick={voltarPaginaInicial}
                    title={safeT?.paginaInicial || 'Página Inicial'}
                  >
                    Home
                  </button>
                </div>
              </div>
              <div className="op-pro__kpis op-pro__kpis--3">
                <div className="op-pro__kpi">
                  <span>{safeT?.opSavedOrders || 'Ordens salvas'}</span>
                  <strong>{ordensPreparacaoSalvas.length}</strong>
                </div>
                <div className="op-pro__kpi">
                  <span>{safeT?.opCode || 'Código SME_UP'}</span>
                  <strong className="op-pro__kpi-text">{ordemPreparacaoForm.codiceSmeUp || '—'}</strong>
                </div>
                <div className="op-pro__kpi">
                  <span>{safeT?.opTestRun || 'Test Run'}</span>
                  <strong>{ordemPreparacaoForm.testRun ? (safeT?.sim || 'Sim') : (safeT?.nao || 'Não')}</strong>
                </div>
              </div>
            </section>

            {/* Formulário */}`
)

block = block.replace(
  /<div style=\{\{ backgroundColor: '#141414', padding: '30px', borderRadius: '12px', border: '1px solid rgba\(0, 200, 83, 0\.2\)' \}\}>/,
  '<div className="op-pro__panel op-pro__panel--form">'
)

block = block.replace(
  /<div style=\{\{ display: 'grid', gridTemplateColumns: 'repeat\(auto-fit, minmax\(200px, 1fr\)\)', gap: '20px', marginBottom: '30px' \}\}>/g,
  '<div className="op-pro__form-grid">'
)

block = block.replace(
  /<div style=\{\{ display: 'grid', gridTemplateColumns: 'repeat\(auto-fit, minmax\(300px, 1fr\)\)', gap: '30px' \}\}>/g,
  '<div className="op-pro__sections-grid">'
)

block = block.replace(
  /<div style=\{\{ padding: '15px', border: '1px solid #333', borderRadius: '8px', gridColumn: '1 \/ -1' \}\}>/g,
  '<div className="op-pro__section op-pro__section--full">'
)

block = block.replace(
  /<div style=\{\{ padding: '15px', border: '1px solid #333', borderRadius: '8px', gridColumn: 'span 2' \}\}>/g,
  '<div className="op-pro__section op-pro__section--wide">'
)

block = block.replace(
  /<div style=\{\{ padding: '15px', border: '1px solid #333', borderRadius: '8px' \}\}>/g,
  '<div className="op-pro__section">'
)

block = block.replace(
  /<h3 style=\{\{ color: '#66b3ff', marginBottom: '15px', fontSize: '16px' \}\}>/g,
  '<h3 className="op-pro__section-title">'
)

block = block.replace(
  /<label style=\{\{ display: 'block', color: '#ccc', marginBottom: '5px', fontSize: '12px' \}\}>/g,
  '<label className="op-pro__label">'
)

block = block.replace(
  /style=\{\{ width: '100%', padding: '8px', backgroundColor: '#1e1e1e', border: '1px solid #444', color: '#fff', borderRadius: '4px' \}\}/g,
  'className="op-pro__input"'
)

block = block.replace(
  /style=\{\{ width: '100%', marginTop: '10px', padding: '6px', backgroundColor: '#1e1e1e', border: '1px solid #444', color: '#fff', borderRadius: '4px' \}\}/g,
  'className="op-pro__input op-pro__input--sm"'
)

block = block.replace(
  /style=\{\{ padding: '6px', backgroundColor: '#1e1e1e', border: '1px solid #444', color: '#fff', borderRadius: '4px' \}\}/g,
  'className="op-pro__input op-pro__input--sm"'
)

block = block.replace(
  /style=\{\{ \n                        width: '100%', \n                        padding: '8px', \n                        backgroundColor: '#1e1e1e', \n                        border: '1px solid #444', \n                        color: '#fff', \n                        borderRadius: '4px',\n                        paddingRight: ordemPreparacaoForm\.tecnicoResponsabile \? '30px' : '8px'\n                      \}\}/g,
  `className={\`op-pro__input op-pro__input--tech\${ordemPreparacaoForm.tecnicoResponsabile ? ' has-clear' : ''}\`}`
)

block = block.replace(
  /<div style=\{\{ marginTop: '40px', backgroundColor: '#141414', padding: '30px', borderRadius: '12px', border: '1px solid rgba\(0, 200, 83, 0\.2\)' \}\}>/,
  '<div className="op-pro__panel op-pro__panel--list">'
)

block = block.replace(
  /<h3 style=\{\{ color: '#00c853', marginBottom: '20px' \}\}>/,
  '<h3 className="op-pro__panel-title">'
)

block = block.replace(
  /style=\{\{ width: '100%', padding: '10px', marginBottom: '20px', backgroundColor: '#1e1e1e', border: '1px solid #444', color: '#fff', borderRadius: '4px' \}\}/,
  'className="op-pro__search"'
)

block = block.replace(
  /<p style=\{\{ color: '#909090', textAlign: 'center' \}\}>/,
  '<p className="op-pro__empty-hint">'
)

block = block.replace(
  /<div style=\{\{ display: 'flex', flexDirection: 'column', gap: '10px' \}\}>/,
  '<div className="op-pro__order-list">'
)

block = block.replace(
  /<div key=\{ordem\.id\} style=\{\{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', backgroundColor: '#1e1e1e', borderRadius: '8px', border: '1px solid #333' \}\}>/g,
  '<div key={ordem.id} className="op-pro__order-card">'
)

block = block.replace(
  /<div style=\{\{ marginTop: '30px', display: 'flex', gap: '15px', justifyContent: 'flex-end', flexWrap: 'wrap' \}\}>/,
  '<div className="op-pro__actions">'
)

block = block.replace(
  /<button\n                  onClick=\{handleSaveOrdemPreparacao\}\n                  style=\{\{\n                    padding: '12px 25px',\n                    backgroundColor: '#007bff',\n                    color: 'white',\n                    border: 'none',\n                    borderRadius: '6px',\n                    cursor: 'pointer',\n                    fontWeight: 'bold',\n                    fontSize: '16px'\n                  \}\}\n                >/,
  `<button\n                  type="button"\n                  className="op-pro__btn op-pro__btn--primary"\n                  onClick={handleSaveOrdemPreparacao}\n                >`
)

block = block.replace(
  /<button\n                  onClick=\{\(\) => handlePrintOrdemPreparacao\(\)\}\n                  style=\{\{\n                    padding: '12px 25px',\n                    backgroundColor: '#28a745',\n                    color: 'white',\n                    border: 'none',\n                    borderRadius: '6px',\n                    cursor: 'pointer',\n                    fontWeight: 'bold',\n                    fontSize: '16px'\n                  \}\}\n                >/,
  `<button\n                  type="button"\n                  className="op-pro__btn op-pro__btn--success"\n                  onClick={() => handlePrintOrdemPreparacao()}\n                >`
)

block = block.replace(
  /<button\n                  onClick=\{handleGerarFormularioChecklist\}\n                  style=\{\{\n                    padding: '12px 25px',\n                    backgroundColor: '#ff6b00',\n                    color: 'white',\n                    border: 'none',\n                    borderRadius: '6px',\n                    cursor: 'pointer',\n                    fontWeight: 'bold',\n                    fontSize: '16px'\n                  \}\}\n                >/,
  `<button\n                  type="button"\n                  className="op-pro__btn op-pro__btn--accent"\n                  onClick={handleGerarFormularioChecklist}\n                >`
)

block = block.replace(
  /<button \n                            onClick=\{\(\) => handlePrintOrdemPreparacao\(ordem\)\} \n                            title=\{safeT\?\.opPrint \|\| 'Imprimir'\}\n                            style=\{\{ cursor: 'pointer', background: 'rgba\(40, 167, 69, 0\.2\)', border: '1px solid rgba\(40, 167, 69, 0\.5\)', borderRadius: '4px', padding: '8px 12px', color: '#28a745' \}\}\n                          >/g,
  `<button\n                            type="button"\n                            className="op-pro__act op-pro__act--success"\n                            onClick={() => handlePrintOrdemPreparacao(ordem)}\n                            title={safeT?.opPrint || 'Imprimir'}\n                          >`
)

block = block.replace(
  /<button \n                            onClick=\{\(\) => handleEditOrdemPreparacao\(ordem\)\} \n                            title=\{safeT\?\.edit \|\| 'Editar'\}\n                            style=\{\{ cursor: 'pointer', background: 'rgba\(0, 100, 255, 0\.2\)', border: '1px solid rgba\(0, 100, 255, 0\.5\)', borderRadius: '4px', padding: '8px 12px', color: '#66b3ff' \}\}\n                          >/g,
  `<button\n                            type="button"\n                            className="op-pro__act"\n                            onClick={() => handleEditOrdemPreparacao(ordem)}\n                            title={safeT?.edit || 'Editar'}\n                          >`
)

block = block.replace(
  /<button \n                            onClick=\{\(e\) => handleDeleteOrdemPreparacao\(ordem\.id, e\)\} \n                            title=\{safeT\?\.delete \|\| 'Excluir'\}\n                            style=\{\{ cursor: 'pointer', background: 'rgba\(255, 0, 0, 0\.2\)', border: '1px solid rgba\(255, 0, 0, 0\.5\)', borderRadius: '4px', padding: '8px 12px', color: '#ff6666' \}\}\n                          >/g,
  `<button\n                            type="button"\n                            className="op-pro__act op-pro__act--danger"\n                            onClick={(e) => handleDeleteOrdemPreparacao(ordem.id, e)}\n                            title={safeT?.delete || 'Excluir'}\n                          >`
)

block = block.replace(
  /<div style=\{\{\n                        position: 'absolute',\n                        top: '100%',\n                        left: 0,\n                        right: 0,\n                        backgroundColor: '#1e1e1e',\n                        border: '1px solid #444',\n                        borderRadius: '4px',\n                        maxHeight: '200px',\n                        overflowY: 'auto',\n                        zIndex: 1000,\n                        marginTop: '4px',\n                        boxShadow: '0 4px 8px rgba\(0, 0, 0, 0\.3\)'\n                      \}\}>/,
  '<div className="op-pro__dropdown">'
)

block = block.replace(
  /<div style=\{\{\n                        position: 'absolute',\n                        top: '100%',\n                        left: 0,\n                        right: 0,\n                        backgroundColor: '#1e1e1e',\n                        border: '1px solid #444',\n                        borderRadius: '4px',\n                        padding: '10px',\n                        zIndex: 1000,\n                        marginTop: '4px',\n                        color: '#909090',\n                        textAlign: 'center'\n                      \}\}>/,
  '<div className="op-pro__dropdown op-pro__dropdown--empty">'
)

block = block.replace(
  /style=\{\{\n                              padding: '10px',\n                              cursor: 'pointer',\n                              borderBottom: '1px solid #333',\n                              color: '#fff',\n                              transition: 'background-color 0\.2s'\n                            \}\}\n                            onMouseEnter=\{\(e\) => \{\n                              e\.currentTarget\.style\.backgroundColor = '#3a3a3a'\n                            \}\}\n                            onMouseLeave=\{\(e\) => \{\n                              e\.currentTarget\.style\.backgroundColor = 'transparent'\n                            \}\}/g,
  'className="op-pro__dropdown-item"'
)

block = block.replace(
  /<div style=\{\{ display: 'flex', alignItems: 'center', marginTop: '20px' \}\}>/,
  '<div className="op-pro__toggle-row">'
)

block = block.replace(
  /<label style=\{\{ display: 'flex', alignItems: 'center', cursor: 'pointer' \}\}>/g,
  '<label className="op-pro__check">'
)

block = block.replace(
  /<label style=\{\{ color: '#ccc', fontSize: '12px' \}\}>/g,
  '<label className="op-pro__label op-pro__label--inline">'
)

block = block.replace(
  /<label style=\{\{ color: '#00c853', fontWeight: 'bold' \}\}>/,
  '<label className="op-pro__toggle-label">'
)

block = block.replace(
  /style=\{\{ width: '100%', padding: '10px', backgroundColor: '#1e1e1e', border: '1px solid #444', color: '#fff', borderRadius: '4px', resize: 'vertical' \}\}/g,
  'className="op-pro__textarea"'
)

block = block.replace(
  /<div>\n                          <div style=\{\{ color: '#00c853', fontWeight: 'bold', fontSize: '16px' \}\}>/g,
  `<div className="op-pro__order-meta">\n                          <div className="op-pro__order-code">`
)

block = block.replace(
  /<div style=\{\{ color: '#ccc', fontSize: '14px' \}\}>/g,
  '<div className="op-pro__order-sub">'
)

block = block.replace(
  /<div style=\{\{ color: '#909090', fontSize: '12px' \}\}>/g,
  '<div className="op-pro__order-date">'
)

block = block.replace(
  /<div style=\{\{ display: 'flex', gap: '10px' \}\}>/g,
  '<div className="op-pro__order-actions">'
)

c = c.slice(0, start) + block + c.slice(end)
fs.writeFileSync(file, c)
console.log('Ordem de Preparacao modernized')
