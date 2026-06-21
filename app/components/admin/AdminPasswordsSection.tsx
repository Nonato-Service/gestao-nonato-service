'use client'

import React from 'react'
import type { PasswordEntry, SafeT } from './adminTypes'

export type AdminPasswordsSectionProps = {
  safeT: SafeT
  t: Record<string, string | undefined>
  selectedLanguage: string
  localeDatetimeGeneral: (lang: string) => string
  managedPasswords: PasswordEntry[]
  showPasswordForm: boolean
  passwordForm: { tecnicoName: string; password: string }
  visiblePasswords: Set<string>
  setShowPasswordForm: React.Dispatch<React.SetStateAction<boolean>>
  setPasswordForm: React.Dispatch<React.SetStateAction<{ tecnicoName: string; password: string }>>
  setVisiblePasswords: React.Dispatch<React.SetStateAction<Set<string>>>
  setManagedPasswords: React.Dispatch<React.SetStateAction<PasswordEntry[]>>
  generatePassword: (length?: number) => string
  handleSavePassword: () => void
  saveData: (key: string, value: unknown, saveToLocalStorage?: boolean, awaitServer?: boolean) => Promise<boolean>
}

export function AdminPasswordsSection(props: AdminPasswordsSectionProps) {
  const {
    safeT, t, selectedLanguage, localeDatetimeGeneral,
    managedPasswords, showPasswordForm, passwordForm, visiblePasswords,
    setShowPasswordForm, setPasswordForm, setVisiblePasswords, setManagedPasswords,
    generatePassword, handleSavePassword, saveData,
  } = props
  return (
            <div className="admin-section admin-section--violet">
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '12px' }}>
                  <p style={{ fontSize: '13px', opacity: 0.7, margin: 0, flex: '1 1 200px' }}>
                    {safeT?.passwordManagerDescription || 'As senhas dos técnicos são automaticamente salvas aqui quando um novo usuário é criado.'}
                  </p>
                  <button
                    className="btn-primary"
                    onClick={() => setShowPasswordForm(!showPasswordForm)}
                    style={{ padding: '8px 16px', fontSize: '13px', whiteSpace: 'nowrap' }}
                  >
                    {showPasswordForm ? (safeT?.cancel || 'Cancelar') : (safeT?.addPassword || '+ Adicionar Senha')}
                  </button>
                </div>

                {/* Formulário de criação de senha */}
                {showPasswordForm && (
                  <div style={{ 
                    padding: '20px', 
                    backgroundColor: '#1e1e1e', 
                    borderRadius: '6px', 
                    border: '1px solid rgba(0, 200, 83, 0.3)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '15px'
                  }}>
                    <h4 style={{ color: '#00c853', margin: 0, fontSize: '16px' }}>
                      {safeT?.createPassword || 'Criar Nova Senha'}
                    </h4>
                    
                    <div>
                      <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
                        {safeT?.tecnicoName || 'Nome do Técnico'} <span style={{ color: '#ff0000' }}>*</span>
                      </label>
                      <input
                        type="text"
                        value={passwordForm.tecnicoName}
                        onChange={(e) => setPasswordForm({ ...passwordForm, tecnicoName: e.target.value })}
                        placeholder={safeT?.tecnicoNamePlaceholder || 'Digite o nome do técnico'}
                        style={{ 
                          width: '100%', 
                          padding: '10px', 
                          backgroundColor: '#141414', 
                          color: '#fff', 
                          border: '1px solid rgba(0, 200, 83, 0.3)', 
                          borderRadius: '4px',
                          fontSize: '14px'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
                        {safeT?.password || 'Senha'} <span style={{ color: '#ff0000' }}>*</span>
                      </label>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <input
                          type="text"
                          value={passwordForm.password}
                          onChange={(e) => setPasswordForm({ ...passwordForm, password: e.target.value })}
                          placeholder={safeT?.passwordPlaceholder || 'Digite a senha ou gere automaticamente'}
                          style={{ 
                            flex: 1,
                            padding: '10px', 
                            backgroundColor: '#141414', 
                            color: '#fff', 
                            border: '1px solid rgba(0, 200, 83, 0.3)', 
                            borderRadius: '4px',
                            fontSize: '14px',
                            fontFamily: 'monospace'
                          }}
                        />
                        <button
                          className="btn-primary"
                          onClick={() => setPasswordForm({ ...passwordForm, password: generatePassword(16) })}
                          style={{ padding: '10px 20px', fontSize: '13px', whiteSpace: 'nowrap' }}
                        >
                          {safeT?.generatePassword || 'Gerar senha'}
                        </button>
                      </div>
                      <p style={{ fontSize: '11px', opacity: 0.6, marginTop: '5px', marginBottom: 0 }}>
                        {safeT?.generatePasswordHint || 'Clique em "Gerar" para criar uma senha segura automaticamente'}
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                      <button
                        className="btn-secondary"
                        onClick={() => {
                          setShowPasswordForm(false)
                          setPasswordForm({ tecnicoName: '', password: '' })
                        }}
                        style={{ padding: '10px 20px', fontSize: '13px' }}
                      >
                        {safeT?.cancel || 'Cancelar'}
                      </button>
                      <button
                        className="btn-primary"
                        onClick={handleSavePassword}
                        style={{ padding: '10px 20px', fontSize: '13px' }}
                      >
                        {safeT?.save || 'Salvar'}
                      </button>
                    </div>
                  </div>
                )}
                
                {managedPasswords.length === 0 && !showPasswordForm ? (
                  <div style={{ padding: '20px', backgroundColor: '#1e1e1e', borderRadius: '6px', border: '1px solid rgba(0, 200, 83, 0.1)', textAlign: 'center' }}>
                    <p style={{ fontSize: '14px', opacity: 0.6 }}>{safeT?.noPasswordsManaged || 'Nenhuma senha gerenciada ainda.'}</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '400px', overflowY: 'auto' }}>
                    {managedPasswords.map((entry) => (
                      <div 
                        key={entry.id} 
                        style={{ 
                          padding: '15px', 
                          backgroundColor: '#1e1e1e', 
                          borderRadius: '6px', 
                          border: '1px solid rgba(0, 200, 83, 0.2)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '10px'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <strong style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
                              {entry.tecnicoName}
                            </strong>
                            <span style={{ fontSize: '11px', opacity: 0.6 }}>
                              {safeT?.createdAt || 'Criado em:'} {new Date(entry.createdAt).toLocaleString(localeDatetimeGeneral(selectedLanguage))}
                            </span>
                          </div>
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            <button
                              className="btn-primary"
                              onClick={() => {
                                const newVisible = new Set(visiblePasswords)
                                if (newVisible.has(entry.id)) {
                                  newVisible.delete(entry.id)
                                } else {
                                  newVisible.add(entry.id)
                                }
                                setVisiblePasswords(newVisible)
                              }}
                              style={{ padding: '8px 16px', fontSize: '13px', whiteSpace: 'nowrap', minWidth: '100px' }}
                            >
                              {visiblePasswords.has(entry.id) ? (safeT?.hidePassword || '👁️ Ocultar') : (safeT?.showPassword || '👁️‍🗨️ Mostrar')}
                            </button>
                            <button
                              className="btn-primary"
                              onClick={() => {
                                navigator.clipboard.writeText(entry.password)
                                alert(t.passwordCopied || 'Senha copiada para a área de transferência!')
                              }}
                              style={{ padding: '8px 16px', fontSize: '13px', whiteSpace: 'nowrap', minWidth: '100px' }}
                            >
                              {safeT?.copyPassword || '📋 Copiar'}
                            </button>
                            <button
                              className="btn-danger"
                              onClick={() => {
                                if (window.confirm(t.confirmDeletePassword)) {
                                  const updated = managedPasswords.filter(p => p.id !== entry.id)
                                  setManagedPasswords(updated)
                                  saveData('nonato-managed-passwords', updated)
                                }
                              }}
                              style={{ padding: '8px 16px', fontSize: '13px', whiteSpace: 'nowrap', minWidth: '100px' }}
                            >
                              {safeT?.deletePassword || '🗑️ Excluir'}
                            </button>
                          </div>
                        </div>
                        {visiblePasswords.has(entry.id) && (
                          <div style={{ 
                            padding: '10px', 
                            backgroundColor: '#141414', 
                            borderRadius: '4px', 
                            border: '1px solid rgba(0, 200, 83, 0.3)',
                            fontFamily: 'monospace',
                            fontSize: '14px',
                            wordBreak: 'break-all'
                          }}>
                            {entry.password}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
  )
}
