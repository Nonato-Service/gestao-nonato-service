'use client'

import React from 'react'
import type { GestorItem, SafeT, TecnicoItem, User, UserFormState } from './adminTypes'

export type AdminUsersSectionProps = {
  variant?: 'full' | 'compact'
  safeT: SafeT
  users: User[]
  showUserForm: boolean
  editingUser: User | null
  userForm: UserFormState
  setUserForm: React.Dispatch<React.SetStateAction<UserFormState>>
  gestores: GestorItem[]
  tecnicos: TecnicoItem[]
  handleAddUser: () => void
  handleEditUser: (user: User) => void
  handleDeleteUser: (id: string) => void
  handleSaveUser: () => void
  setShowUserForm: (v: boolean) => void
  setEditingUser: (v: User | null) => void
  createEmptyUserForm: () => UserFormState
}

export function AdminUsersSection({
  variant = 'full',
  safeT,
  users,
  showUserForm,
  editingUser,
  userForm,
  setUserForm,
  gestores,
  tecnicos,
  handleAddUser,
  handleEditUser,
  handleDeleteUser,
  handleSaveUser,
  setShowUserForm,
  setEditingUser,
  createEmptyUserForm,
}: AdminUsersSectionProps) {
  if (variant === 'compact') {
    return (
            <div className="admin-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid rgba(0, 255, 136, 0.2)', paddingBottom: '10px' }}>
                <h3 className="admin-section-title" style={{ marginBottom: 0, borderBottom: 'none', paddingBottom: 0 }}>
                  {safeT?.userManagement || 'GESTÃO DE USUÁRIOS'}
                </h3>
                <button className="btn-primary" onClick={handleAddUser} style={{ padding: '8px 15px' }}>
                  {safeT?.addUser || 'Adicionar Usuário'}
                </button>
              </div>
              
              {users.length === 0 ? (
                <p style={{ textAlign: 'center', opacity: 0.7, padding: '20px' }}>{safeT?.noUsers || 'Nenhum usuário cadastrado'}</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {users.map(user => (
                    <div key={user.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', backgroundColor: '#222222', borderRadius: '6px', border: '1px solid rgba(0, 255, 0, 0.1)' }}>
                      <div>
                        <strong style={{ display: 'block', marginBottom: '5px' }}>{user.name}</strong>
                        <span style={{ fontSize: '12px', opacity: 0.7 }}>{user.email} • {user.role}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <button className="btn-primary" onClick={() => handleEditUser(user)} style={{ padding: '8px 16px', fontSize: '13px', whiteSpace: 'nowrap', minWidth: '80px' }}>
                          {safeT?.edit || 'Editar'}
                        </button>
                        <button className="btn-danger" onClick={() => handleDeleteUser(user.id)} style={{ padding: '8px 16px', fontSize: '13px', whiteSpace: 'nowrap', minWidth: '80px' }}>
                          {safeT?.delete || 'Excluir'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
    )
  }
  return (
            <div className="admin-section">
              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '16px' }}>
                <button className="btn-primary" onClick={handleAddUser} style={{ padding: '8px 15px' }}>
                  {safeT?.addUser || 'Adicionar Usuário'}
                </button>
              </div>
              
              {showUserForm && (
                <div style={{ border: '1px solid rgba(0, 255, 0, 0.2)', padding: '20px', borderRadius: '8px', marginBottom: '20px', backgroundColor: '#222222' }}>
                  <h3 style={{ marginBottom: '15px' }}>{editingUser ? safeT?.editUser : safeT?.addUser}</h3>
                  
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px' }}>{safeT?.name || 'Nome'}</label>
                    <input
                      type="text"
                      value={userForm.name}
                      onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                      style={{ width: '100%', padding: '8px', backgroundColor: '#141414', color: '#fff', border: '1px solid rgba(0, 255, 0, 0.3)', borderRadius: '4px' }}
                    />
                  </div>
                  
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px' }}>{safeT?.email || 'E-mail'}</label>
                    <input
                      type="email"
                      value={userForm.email}
                      onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                      style={{ width: '100%', padding: '8px', backgroundColor: '#141414', color: '#fff', border: '1px solid rgba(0, 255, 0, 0.3)', borderRadius: '4px' }}
                    />
                  </div>
                  
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px' }}>{safeT?.role || 'Função'}</label>
                    <input
                      type="text"
                      value={userForm.role}
                      onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                      style={{ width: '100%', padding: '8px', backgroundColor: '#141414', color: '#fff', border: '1px solid rgba(0, 255, 0, 0.3)', borderRadius: '4px' }}
                    />
                  </div>
                  
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px' }}>
                      {safeT?.password || 'Senha'} {!editingUser && <span style={{ color: '#ff0000' }}>*</span>}
                    </label>
                    <input
                      type="password"
                      value={userForm.password}
                      onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                      placeholder={editingUser ? (safeT?.leaveEmptyToKeepPassword || 'Deixe vazio para manter a senha atual') : ''}
                      style={{ width: '100%', padding: '8px', backgroundColor: '#141414', color: '#fff', border: '1px solid rgba(0, 255, 0, 0.3)', borderRadius: '4px' }}
                    />
                  </div>

                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px' }}>Vincular com</label>
                    <select
                      value={userForm.linkedProfileType}
                      onChange={(e) => setUserForm({ ...userForm, linkedProfileType: e.target.value as 'gestor' | 'tecnico' | '', linkedProfileId: '' })}
                      style={{ width: '100%', padding: '8px', backgroundColor: '#141414', color: '#fff', border: '1px solid rgba(0, 255, 0, 0.3)', borderRadius: '4px' }}
                    >
                      <option value="">Sem vínculo direto</option>
                      <option value="gestor">{safeT?.gestores || 'Gestores'}</option>
                      <option value="tecnico">{safeT?.tecnicos || 'Técnicos'}</option>
                    </select>
                  </div>

                  {userForm.linkedProfileType && (
                    <div style={{ marginBottom: '15px' }}>
                      <label style={{ display: 'block', marginBottom: '5px' }}>
                        {userForm.linkedProfileType === 'gestor' ? (safeT?.selecionarGestor || 'Selecionar Gestor') : (safeT?.selecionarTecnico || 'Selecionar Técnico')}
                      </label>
                      <select
                        value={userForm.linkedProfileId}
                        onChange={(e) => setUserForm({ ...userForm, linkedProfileId: e.target.value })}
                        style={{ width: '100%', padding: '8px', backgroundColor: '#141414', color: '#fff', border: '1px solid rgba(0, 255, 0, 0.3)', borderRadius: '4px' }}
                      >
                        <option value="">{userForm.linkedProfileType === 'gestor' ? (safeT?.selecionarGestor || 'Selecionar Gestor') : (safeT?.selecionarTecnico || 'Selecionar Técnico')}</option>
                        {userForm.linkedProfileType === 'gestor'
                          ? gestores.map((item) => (
                              <option key={item.id} value={item.id}>
                                {`${item.name} (${item.area || '-'})`}
                              </option>
                            ))
                          : tecnicos.map((item) => (
                              <option key={item.id} value={item.id}>
                                {`${item.name} (${item.type === 'internal' ? (safeT?.tecnicoInterno || 'Interno') : item.type === 'external' ? (safeT?.tecnicoExterno || 'Externo') : (safeT?.armazem || 'Armazém')})`}
                              </option>
                            ))}
                      </select>
                    </div>
                  )}
                  
                  <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#141414', borderRadius: '6px', border: '1px solid rgba(0, 255, 0, 0.2)' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={userForm.isAdmin}
                        onChange={(e) => setUserForm({ ...userForm, isAdmin: e.target.checked })}
                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                      />
                      <strong style={{ color: '#00ff00' }}>{safeT?.administradorGeral || 'Administrador Geral'}</strong>
                    </label>
                    <p style={{ fontSize: '12px', opacity: 0.7, marginTop: '5px', marginLeft: '28px' }}>
                      {safeT?.administradorGeralDesc || 'O administrador geral tem acesso a todas as funcionalidades do sistema'}
                    </p>
                  </div>
                  
                  {!userForm.isAdmin && (
                    <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#141414', borderRadius: '6px', border: '1px solid rgba(0, 255, 0, 0.2)' }}>
                      <strong style={{ display: 'block', marginBottom: '15px' }}>{safeT?.permissions || 'Permissões'}</strong>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                        {userForm.permissions && Object.entries(userForm.permissions).map(([key, value]) => (
                          <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                            <input
                              type="checkbox"
                              checked={value as boolean}
                              onChange={(e) => setUserForm({ 
                                ...userForm, 
                                permissions: { 
                                  ...(userForm.permissions || {}), 
                                  [key]: e.target.checked 
                                } 
                              })}
                              style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                            />
                            <span>{safeT?.[`permission${key.charAt(0).toUpperCase() + key.slice(1)}` as keyof typeof safeT] || key}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="btn-primary" onClick={handleSaveUser} style={{ flex: 1 }}>
                      {safeT?.save || 'Salvar'}
                    </button>
                    <button className="btn-primary" onClick={() => { 
                      setShowUserForm(false); 
                      setEditingUser(null); 
                      setUserForm(createEmptyUserForm()); 
                    }} style={{ flex: 1 }}>
                      {safeT?.cancel || 'Cancelar'}
                    </button>
                  </div>
                </div>
              )}
              
              {users.length === 0 ? (
                <p style={{ textAlign: 'center', opacity: 0.7, padding: '20px' }}>{safeT?.noUsers || 'Nenhum usuário cadastrado'}</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {users.map(user => (
                    <div key={user.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', backgroundColor: '#222222', borderRadius: '6px', border: '1px solid rgba(0, 255, 0, 0.1)' }}>
                      <div>
                        <strong style={{ display: 'block', marginBottom: '5px' }}>{user.name}</strong>
                        <span style={{ fontSize: '12px', opacity: 0.7 }}>{user.email} • {user.role}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <button className="btn-primary" onClick={() => handleEditUser(user)} style={{ padding: '8px 16px', fontSize: '13px', whiteSpace: 'nowrap', minWidth: '80px' }}>
                          {safeT?.edit || 'Editar'}
                        </button>
                        <button className="btn-danger" onClick={() => handleDeleteUser(user.id)} style={{ padding: '8px 16px', fontSize: '13px', whiteSpace: 'nowrap', minWidth: '80px' }}>
                          {safeT?.delete || 'Excluir'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
  )
}
