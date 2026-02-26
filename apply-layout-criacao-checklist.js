/**
 * Script para repor o layout da "Criação de Checklist por Grupos":
 * imagem 200px, número/nome à direita da imagem, botão "Adicionar serviços" à direita.
 *
 * Execute quando o app/page.tsx voltar ao layout antigo (140px):
 *   node apply-layout-criacao-checklist.js
 *
 * Depois: apague a pasta .next e rode npm run dev (ou reinicie o servidor).
 */

const fs = require('fs');
const path = require('path');

const pagePath = path.join(__dirname, 'app', 'page.tsx');

const OLD = `                              {/* Cabeçalho do grupo: foto bem visível + número/nome + Adicionar serviços ao lado */}
                              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px', padding: '20px', backgroundColor: '#2a2a2a', borderBottom: '2px solid rgba(0, 255, 0, 0.2)' }}>
                                <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                                  <div style={{ width: '140px', height: '140px', borderRadius: '10px', overflow: 'hidden', border: '2px solid rgba(0, 255, 0, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1a1a1a', color: '#00ff00', fontSize: '42px', fontWeight: 700, boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
                                    {gr.imagem ? (
                                      <img src={gr.imagem} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                      <span>{(gr.numeroGrupo || gr.nomeGrupo || '?').charAt(0).toUpperCase()}</span>
                                    )}
                                  </div>
                                  <div style={{ textAlign: 'center' }}>
                                    {gr.numeroGrupo && <div style={{ fontSize: '12px', color: '#00ff00', fontWeight: 600 }}>{gr.numeroGrupo}</div>}
                                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff', maxWidth: '140px', wordBreak: 'break-word' }}>{gr.nomeGrupo || '—'}</div>
                                  </div>
                                </div>
                                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '8px' }}>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (criacaoChecklistGrupoIdAddingItem === gr.id) cancelForm()
                                      else {
                                        setCriacaoChecklistGrupoIdAddingItem(gr.id)
                                        setCriacaoChecklistEditingItemId(null)
                                        setCriacaoChecklistItemForm({ tipo: 'Manutenção', descricaoTrabalho: '', necessitaPecas: false, codigoPeca: '', pecasManuais: [] })
                                      }
                                    }}
                                    style={{ alignSelf: 'flex-start', padding: '10px 18px', fontSize: '13px', fontWeight: 600, borderRadius: '8px', border: '2px solid rgba(0, 255, 0, 0.5)', backgroundColor: criacaoChecklistGrupoIdAddingItem === gr.id ? 'rgba(0, 255, 0, 0.25)' : 'rgba(0, 255, 0, 0.12)', color: '#00ff00', cursor: 'pointer', whiteSpace: 'nowrap' }}
                                  >
                                    {(safeT as any)?.adicionarServicos || 'Adicionar serviços'}
                                  </button>
                                  {gr.trabalhosASeremExecutados && <div style={{ fontSize: '12px', color: '#aaa', marginTop: '4px' }}>{gr.trabalhosASeremExecutados}</div>}
                                </div>
                              </div>
                              <div style={{ padding: '16px', backgroundColor: '#1a1a1a' }}>
                                {/* Serviços em colunas — cada serviço uma coluna para levar a informação para outro lado */}`;

const NEW = `                              {/* Cabeçalho: imagem 200px | número/nome à direita | Adicionar serviços à direita */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '24px', padding: '20px', backgroundColor: '#2a2a2a', borderBottom: '2px solid rgba(0, 255, 0, 0.2)' }}>
                                <div style={{ flexShrink: 0, width: '200px', height: '200px', borderRadius: '10px', overflow: 'hidden', border: '2px solid rgba(0, 255, 0, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1a1a1a', color: '#00ff00', fontSize: '56px', fontWeight: 700, boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
                                  {gr.imagem ? (
                                    <img src={gr.imagem} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                  ) : (
                                    <span>{(gr.numeroGrupo || gr.nomeGrupo || '?').charAt(0).toUpperCase()}</span>
                                  )}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: 0 }}>
                                  {gr.numeroGrupo && <div style={{ fontSize: '14px', color: '#00ff00', fontWeight: 600 }}>{gr.numeroGrupo}</div>}
                                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#fff', maxWidth: '280px', wordBreak: 'break-word' }}>{gr.nomeGrupo || '—'}</div>
                                  {gr.trabalhosASeremExecutados && <div style={{ fontSize: '12px', color: '#aaa', marginTop: '2px' }}>{gr.trabalhosASeremExecutados}</div>}
                                </div>
                                <div style={{ marginLeft: 'auto', flexShrink: 0 }}>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (criacaoChecklistGrupoIdAddingItem === gr.id) cancelForm()
                                      else {
                                        setCriacaoChecklistGrupoIdAddingItem(gr.id)
                                        setCriacaoChecklistEditingItemId(null)
                                        setCriacaoChecklistItemForm({ tipo: 'Manutenção', descricaoTrabalho: '', necessitaPecas: false, codigoPeca: '', pecasManuais: [] })
                                      }
                                    }}
                                    style={{ padding: '10px 18px', fontSize: '13px', fontWeight: 600, borderRadius: '8px', border: '2px solid rgba(0, 255, 0, 0.5)', backgroundColor: criacaoChecklistGrupoIdAddingItem === gr.id ? 'rgba(0, 255, 0, 0.25)' : 'rgba(0, 255, 0, 0.12)', color: '#00ff00', cursor: 'pointer', whiteSpace: 'nowrap' }}
                                  >
                                    {(safeT as any)?.adicionarServicos || 'Adicionar serviços'}
                                  </button>
                                </div>
                              </div>
                              <div style={{ padding: '16px', backgroundColor: '#1a1a1a' }}>
                                {/* Serviços em colunas — cada serviço uma coluna para levar a informação para outro lado */}`;

let content = fs.readFileSync(pagePath, 'utf8');

if (content.includes("width: '200px', height: '200px'") && content.includes('Cabeçalho: imagem 200px')) {
  console.log('OK: O layout já está aplicado (200px). Nada a fazer.');
  process.exit(0);
}

if (!content.includes(OLD)) {
  console.log('AVISO: Bloco antigo (140px) não encontrado. O ficheiro pode ter sido alterado.');
  process.exit(1);
}

content = content.replace(OLD, NEW);
fs.writeFileSync(pagePath, content, 'utf8');
console.log('Layout aplicado com sucesso (imagem 200px, número/nome à direita, botão à direita).');
console.log('Próximo passo: apague a pasta .next e rode npm run dev (ou reinicie o servidor).');
