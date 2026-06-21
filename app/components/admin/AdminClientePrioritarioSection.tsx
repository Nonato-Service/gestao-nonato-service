'use client'

import React from 'react'
import type { ClientePrioritario, ClientePrioritarioForm, SafeT } from './adminTypes'

type ClientePrioritarioEntity = ClientePrioritario

export type AdminClientePrioritarioSectionProps = {
  safeT: SafeT
  clientePrioritario: ClientePrioritario | null
  showClientePrioritarioForm: boolean
  editingClientePrioritario: ClientePrioritarioEntity | null
  clientePrioritarioForm: ClientePrioritarioForm
  setClientePrioritarioForm: React.Dispatch<React.SetStateAction<ClientePrioritarioForm>>
  handleAddClientePrioritario: () => void
  handleEditClientePrioritario: () => void
  handleDeleteClientePrioritario: () => void
  handleSaveClientePrioritario: () => void
  handleClientePrioritarioPhotoChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleRemoveClientePrioritarioPhoto: () => void
  setShowClientePrioritarioForm: React.Dispatch<React.SetStateAction<boolean>>
  setEditingClientePrioritario: React.Dispatch<React.SetStateAction<ClientePrioritarioEntity | null>>
  emptyClientePrioritarioForm: () => ClientePrioritarioForm
}

export function AdminClientePrioritarioSection({
  safeT,
  clientePrioritario,
  showClientePrioritarioForm,
  editingClientePrioritario,
  clientePrioritarioForm,
  setClientePrioritarioForm,
  handleAddClientePrioritario,
  handleEditClientePrioritario,
  handleDeleteClientePrioritario,
  handleSaveClientePrioritario,
  handleClientePrioritarioPhotoChange,
  handleRemoveClientePrioritarioPhoto,
  setShowClientePrioritarioForm,
  setEditingClientePrioritario,
  emptyClientePrioritarioForm,
}: AdminClientePrioritarioSectionProps) {
  return (
            <div className="admin-section admin-section--amber">
              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {clientePrioritario ? (
                    <>
                      <button className="btn-primary" onClick={handleEditClientePrioritario} style={{ padding: '8px 15px', backgroundColor: 'rgba(255, 215, 0, 0.2)', borderColor: 'rgba(255, 215, 0, 0.5)' }}>
                        {safeT?.editClientePrioritario || 'Editar Cliente Prioritário'}
                      </button>
                      <button className="btn-danger" onClick={handleDeleteClientePrioritario} style={{ padding: '8px 15px' }}>
                        {safeT?.deleteClientePrioritario || 'Excluir Cliente Prioritário'}
                      </button>
                    </>
                  ) : (
                    <button className="btn-primary" onClick={handleAddClientePrioritario} style={{ padding: '8px 15px', backgroundColor: 'rgba(255, 215, 0, 0.2)', borderColor: 'rgba(255, 215, 0, 0.5)' }}>
                      {safeT?.addClientePrioritario || 'Adicionar Cliente Prioritário'}
                    </button>
                  )}
                </div>
              </div>

              {clientePrioritario && !showClientePrioritarioForm ? (
                <div style={{ padding: '20px', backgroundColor: '#1e1e1e', borderRadius: '6px', border: '1px solid rgba(255, 215, 0, 0.3)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px', marginBottom: '20px' }}>
                    <div>
                      <strong style={{ color: '#ffd700', display: 'block', marginBottom: '5px' }}>{safeT?.nomeEmpresa || 'Nome da Empresa'}</strong>
                      <span>{clientePrioritario.nomeEmpresa}</span>
                    </div>
                    <div>
                      <strong style={{ color: '#ffd700', display: 'block', marginBottom: '5px' }}>{safeT?.morada || 'Morada'}</strong>
                      <span>{clientePrioritario.morada}</span>
                    </div>
                    <div>
                      <strong style={{ color: '#ffd700', display: 'block', marginBottom: '5px' }}>{safeT?.conselho || 'Conselho'}</strong>
                      <span>{clientePrioritario.conselho}</span>
                    </div>
                    <div>
                      <strong style={{ color: '#ffd700', display: 'block', marginBottom: '5px' }}>{safeT?.pais || 'País'}</strong>
                      <span>{clientePrioritario.pais}</span>
                    </div>
                    <div>
                      <strong style={{ color: '#ffd700', display: 'block', marginBottom: '5px' }}>{safeT?.codigoPostal || 'Código Postal'}</strong>
                      <span>{clientePrioritario.codigoPostal}</span>
                    </div>
                    <div>
                      <strong style={{ color: '#ffd700', display: 'block', marginBottom: '5px' }}>{safeT?.freguesia || 'Freguesia'}</strong>
                      <span>{clientePrioritario.freguesia}</span>
                    </div>
                    <div>
                      <strong style={{ color: '#ffd700', display: 'block', marginBottom: '5px' }}>{safeT?.identificacaoFiscal || 'Identificação Fiscal'}</strong>
                      <span>{clientePrioritario.numeroContribuicaoFiscal}</span>
                    </div>
                    <div>
                      <strong style={{ color: '#ffd700', display: 'block', marginBottom: '5px' }}>{safeT?.telefones || 'Telefones'}</strong>
                      <span>{clientePrioritario.telefones}</span>
                    </div>
                    <div>
                      <strong style={{ color: '#ffd700', display: 'block', marginBottom: '5px' }}>{safeT?.email || 'E-mail'}</strong>
                      <span>{clientePrioritario.email}</span>
                    </div>
                    <div>
                      <strong style={{ color: '#ffd700', display: 'block', marginBottom: '5px' }}>{safeT?.contato || 'Contato'}</strong>
                      <span>{clientePrioritario.contato}</span>
                    </div>
                    {clientePrioritario.photo && (
                      <div>
                        <strong style={{ color: '#ffd700', display: 'block', marginBottom: '5px' }}>Foto</strong>
                        <img src={clientePrioritario.photo} alt="Cliente Prioritário" style={{ maxWidth: '200px', maxHeight: '200px', borderRadius: '4px' }} />
                      </div>
                    )}
                  </div>
                </div>
              ) : showClientePrioritarioForm ? (
                <div style={{ border: '1px solid rgba(255, 215, 0, 0.2)', padding: '20px', borderRadius: '8px', marginBottom: '20px', backgroundColor: '#1e1e1e' }}>
                  <h3 style={{ marginBottom: '15px', color: '#ffd700' }}>{editingClientePrioritario ? (safeT?.editClientePrioritario || 'Editar Cliente Prioritário') : (safeT?.addClientePrioritario || 'Adicionar Cliente Prioritário')}</h3>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '5px' }}>{safeT?.nomeEmpresa || 'Nome da Empresa'} *</label>
                      <input
                        type="text"
                        placeholder={safeT?.nomeEmpresa || 'Nome da Empresa'}
                        value={clientePrioritarioForm.nomeEmpresa}
                        onChange={(e) => setClientePrioritarioForm({ ...clientePrioritarioForm, nomeEmpresa: e.target.value })}
                        style={{ width: '100%', padding: '8px', backgroundColor: '#141414', color: '#fff', border: '1px solid rgba(255, 215, 0, 0.3)', borderRadius: '4px' }}
                      />
                    </div>
                    
                    <div>
                      <label style={{ display: 'block', marginBottom: '5px' }}>{safeT?.morada || 'Morada'} *</label>
                      <input
                        type="text"
                        placeholder={safeT?.morada || 'Morada'}
                        value={clientePrioritarioForm.morada}
                        onChange={(e) => setClientePrioritarioForm({ ...clientePrioritarioForm, morada: e.target.value })}
                        style={{ width: '100%', padding: '8px', backgroundColor: '#141414', color: '#fff', border: '1px solid rgba(255, 215, 0, 0.3)', borderRadius: '4px' }}
                      />
                    </div>
                    
                    <div>
                      <label style={{ display: 'block', marginBottom: '5px' }}>{safeT?.conselho || 'Conselho'}</label>
                      <input
                        type="text"
                        placeholder={safeT?.conselho || 'Conselho'}
                        value={clientePrioritarioForm.conselho}
                        onChange={(e) => setClientePrioritarioForm({ ...clientePrioritarioForm, conselho: e.target.value })}
                        style={{ width: '100%', padding: '8px', backgroundColor: '#141414', color: '#fff', border: '1px solid rgba(255, 215, 0, 0.3)', borderRadius: '4px' }}
                      />
                    </div>
                    
                    <div>
                      <label style={{ display: 'block', marginBottom: '5px' }}>{safeT?.pais || 'País'}</label>
                      <input
                        type="text"
                        placeholder={safeT?.pais || 'País'}
                        value={clientePrioritarioForm.pais}
                        onChange={(e) => setClientePrioritarioForm({ ...clientePrioritarioForm, pais: e.target.value })}
                        style={{ width: '100%', padding: '8px', backgroundColor: '#141414', color: '#fff', border: '1px solid rgba(255, 215, 0, 0.3)', borderRadius: '4px' }}
                      />
                    </div>
                    
                    <div>
                      <label style={{ display: 'block', marginBottom: '5px' }}>{safeT?.codigoPostal || 'Código Postal'}</label>
                      <input
                        type="text"
                        placeholder={safeT?.codigoPostal || 'Código Postal'}
                        value={clientePrioritarioForm.codigoPostal}
                        onChange={(e) => setClientePrioritarioForm({ ...clientePrioritarioForm, codigoPostal: e.target.value })}
                        style={{ width: '100%', padding: '8px', backgroundColor: '#141414', color: '#fff', border: '1px solid rgba(255, 215, 0, 0.3)', borderRadius: '4px' }}
                      />
                    </div>
                    
                    <div>
                      <label style={{ display: 'block', marginBottom: '5px' }}>{safeT?.freguesia || 'Freguesia'}</label>
                      <input
                        type="text"
                        placeholder={safeT?.freguesia || 'Freguesia'}
                        value={clientePrioritarioForm.freguesia}
                        onChange={(e) => setClientePrioritarioForm({ ...clientePrioritarioForm, freguesia: e.target.value })}
                        style={{ width: '100%', padding: '8px', backgroundColor: '#141414', color: '#fff', border: '1px solid rgba(255, 215, 0, 0.3)', borderRadius: '4px' }}
                      />
                    </div>
                    
                    <div>
                      <label style={{ display: 'block', marginBottom: '5px' }}>{safeT?.identificacaoFiscal || 'Identificação Fiscal'}</label>
                      <input
                        type="text"
                        placeholder={safeT?.identificacaoFiscal || 'Identificação Fiscal'}
                        value={clientePrioritarioForm.numeroContribuicaoFiscal}
                        onChange={(e) => setClientePrioritarioForm({ ...clientePrioritarioForm, numeroContribuicaoFiscal: e.target.value })}
                        style={{ width: '100%', padding: '8px', backgroundColor: '#141414', color: '#fff', border: '1px solid rgba(255, 215, 0, 0.3)', borderRadius: '4px' }}
                      />
                    </div>
                    
                    <div>
                      <label style={{ display: 'block', marginBottom: '5px' }}>{safeT?.telefones || 'Telefones'}</label>
                      <input
                        type="text"
                        placeholder={safeT?.telefones || 'Telefones'}
                        value={clientePrioritarioForm.telefones}
                        onChange={(e) => setClientePrioritarioForm({ ...clientePrioritarioForm, telefones: e.target.value })}
                        style={{ width: '100%', padding: '8px', backgroundColor: '#141414', color: '#fff', border: '1px solid rgba(255, 215, 0, 0.3)', borderRadius: '4px' }}
                      />
                    </div>
                    
                    <div>
                      <label style={{ display: 'block', marginBottom: '5px' }}>{safeT?.email || 'E-mail'} *</label>
                      <input
                        type="email"
                        placeholder={safeT?.email || 'E-mail'}
                        value={clientePrioritarioForm.email}
                        onChange={(e) => setClientePrioritarioForm({ ...clientePrioritarioForm, email: e.target.value })}
                        style={{ width: '100%', padding: '8px', backgroundColor: '#141414', color: '#fff', border: '1px solid rgba(255, 215, 0, 0.3)', borderRadius: '4px' }}
                      />
                    </div>
                    
                    <div>
                      <label style={{ display: 'block', marginBottom: '5px' }}>{safeT?.contato || 'Contato'}</label>
                      <input
                        type="text"
                        placeholder={safeT?.contato || 'Contato'}
                        value={clientePrioritarioForm.contato}
                        onChange={(e) => setClientePrioritarioForm({ ...clientePrioritarioForm, contato: e.target.value })}
                        style={{ width: '100%', padding: '8px', backgroundColor: '#141414', color: '#fff', border: '1px solid rgba(255, 215, 0, 0.3)', borderRadius: '4px' }}
                      />
                    </div>
                    
                    <div>
                      <label style={{ display: 'block', marginBottom: '5px' }}>Foto</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleClientePrioritarioPhotoChange}
                        style={{ width: '100%', padding: '8px', backgroundColor: '#141414', color: '#fff', border: '1px solid rgba(255, 215, 0, 0.3)', borderRadius: '4px' }}
                      />
                      {clientePrioritarioForm.photo && (
                        <div style={{ marginTop: '10px' }}>
                          <img src={clientePrioritarioForm.photo} alt="Preview" style={{ maxWidth: '200px', maxHeight: '200px', borderRadius: '4px', marginBottom: '10px' }} />
                          <button className="btn-danger" onClick={handleRemoveClientePrioritarioPhoto} style={{ padding: '6px 12px', fontSize: '12px' }}>
                            Remover Foto
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                    <button className="btn-primary" onClick={handleSaveClientePrioritario} style={{ flex: 1, backgroundColor: 'rgba(255, 215, 0, 0.2)', borderColor: 'rgba(255, 215, 0, 0.5)' }}>
                      {safeT?.save || 'Salvar'}
                    </button>
                    <button className="btn-primary" onClick={() => { 
                      setShowClientePrioritarioForm(false); 
                      setEditingClientePrioritario(null); 
                      setClientePrioritarioForm({
                        nomeEmpresa: '',
                        morada: '',
                        localidade: '',
                        conselho: '',
                        pais: '',
                        codigoPostal: '',
                        freguesia: '',
                        numeroContribuicaoFiscal: '',
                        telefones: '',
                        email: '',
                        contato: '',
                        photo: ''
                      }); 
                    }} style={{ flex: 1 }}>
                      {safeT?.cancel || 'Cancelar'}
                    </button>
                  </div>
                </div>
              ) : (
                <p style={{ textAlign: 'center', opacity: 0.7, padding: '20px' }}>{safeT?.noClientePrioritario || 'Nenhum cliente prioritário cadastrado'}</p>
              )}
            </div>
  )
}
