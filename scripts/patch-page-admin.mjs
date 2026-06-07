import fs from 'fs'
import path from 'path'

const pagePath = path.join('C:/Users/W10/gestao-tecnica-nonato-service/app/page.tsx')
let content = fs.readFileSync(pagePath, 'utf8')
const lines = content.split(/\r?\n/)

// 1. Add import after GestaoDemosContent import
if (!content.includes("AdministradorContent")) {
  content = content.replace(
    "import { GestaoDemosContent } from './components/GestaoDemosContent'",
    "import { GestaoDemosContent } from './components/GestaoDemosContent'\nimport { AdministradorContent } from './components/admin/AdministradorContent'"
  )
}

// Helper: replace line range [start, end] inclusive (1-based) with replacement
function replaceRange(start, end, replacement) {
  const before = lines.slice(0, start - 1)
  const after = lines.slice(end)
  const newLines = [...before, ...replacement.split('\n'), ...after]
  lines.length = 0
  lines.push(...newLines)
}

const adminTabReplacement = `      case 'administrador':
        return (
          <AdministradorContent
            variant="full"
            safeT={safeT}
            LogoComponent={LogoComponent}
            closeTab={closeTab}
            activeTabId={activeTabId}
            voltarPaginaInicial={voltarPaginaInicial}
            saveData={saveData}
            loadData={loadData}
            onOpenDemosFullTab={() => openTab('gestao-demos', getTabTitle('gestao-demos'))}
            sync={{
              safeT,
              syncPendingRemote,
              syncPushLoading,
              setSyncDecisionModalOpen,
              setLastAcceptedRevision,
              pendingFullServerReplaceKey: NONATO_PENDING_FULL_SERVER_REPLACE_LS,
              enviarEsteAparelhoParaServidor,
            }}
            geral={{
              preverProximoNumeroRelatorio,
              logoUrl,
              logoType,
              logoUrlDashboard,
              logoTypeDashboard,
              adminSidebarLogoDraft,
              adminDashboardLogoDraft,
              adminLogoSavingSidebar,
              adminLogoSavingDashboard,
              handleFileChangeSidebarLogo,
              handleFileChangeDashboardLogo,
              commitAdminSidebarLogoDraft,
              discardAdminSidebarLogoDraft,
              commitAdminDashboardLogoDraft,
              discardAdminDashboardLogoDraft,
              handleRemoveSidebarLogo,
              handleRemoveDashboardLogo,
              pdfLogosModoUnificado,
              setPdfLogosModoUnificado,
              logosRelatorios,
              adminBibliotecaLogoDraft,
              adminBibliotecaLogoSaving,
              logoRelatorioSelecionadoId,
              logoFechamentoSelecionadoId,
              logoOrcamentoSelecionadoId,
              logoProtocoloServicoSelecionadoId,
              incluirLogoNosRelatorios,
              incluirLogoFechamentosDespesas,
              setIncluirLogoNosRelatorios,
              setIncluirLogoFechamentosDespesas,
              setLogosRelatorios,
              setLogoRelatorioSelecionadoId,
              setLogoFechamentoSelecionadoId,
              setLogoOrcamentoSelecionadoId,
              setLogoProtocoloServicoSelecionadoId,
              saveData,
              administradorPreviewPdfLogo,
              aplicarLogoUnificadoTodosPdfs,
              administradorAddBibliotecaLogo,
              commitAdminBibliotecaLogoDraft,
              discardAdminBibliotecaLogoDraft,
            }}
            users={{
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
            }}
            clientePrioritario={{
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
              emptyClientePrioritarioForm: () => ({
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
                photo: '',
              }),
            }}
            sidebar={{
              sidebarButtons,
              sidebarGroups: SIDEBAR_GROUPS,
              sidebarPinnedIds: SIDEBAR_PINNED_IDS,
              sidebarOrganizerSearch,
              setSidebarOrganizerSearch,
              showSidebarButtonOrganizer,
              setShowSidebarButtonOrganizer,
              draggedButton,
              dragOverIndex,
              normalizeSidebarButtons,
              isSidebarButtonLocked,
              getDefaultSidebarGroup,
              getButtonName,
              getSidebarGroupLabel,
              getButtonsByGroup,
              handleRestoreSidebarOrganizerDefaults,
              handleDragStart,
              handleDragOver,
              handleDragLeave,
              handleDropWithGroup,
              handleDragEnd,
              handleMoveButtonToGroup,
              handleMoveButton,
              handleMoveButtonAcrossGroups,
              handleDeleteButton,
              setEditingButton,
              setButtonForm,
              setShowButtonForm,
            }}
            passwords={{
              t,
              selectedLanguage,
              localeDatetimeGeneral,
              managedPasswords,
              showPasswordForm,
              passwordForm,
              visiblePasswords,
              setShowPasswordForm,
              setPasswordForm,
              setVisiblePasswords,
              setManagedPasswords,
              generatePassword,
              handleSavePassword,
              saveData,
            }}
            backup={{
              isDemoMode,
              selectedLanguage,
              localeDatetimeGeneral,
              autoBackupEnabled,
              autoBackupInterval,
              setAutoBackupEnabled,
              setAutoBackupInterval,
              codeBackups,
              codeBackupsFolder,
              loadingBackups,
              restoringFromZip,
              restoreFromZipInputRef,
              saveData,
              handleCreateBackup,
              handleRestoreBackup,
              handleBackupCodigo,
              handleDownloadBackupZip,
              handleRestoreCodigo,
              handleRestoreFromZip,
              loadCodeBackups,
              getAutoBackups,
              restoreAutoBackup,
            }}
          />
        )`

// Find case 'administrador' and replace until next case
const adminStart = lines.findIndex((l) => l.trim() === "case 'administrador':")
if (adminStart === -1) throw new Error('admin case not found')
let adminEnd = adminStart + 1
while (adminEnd < lines.length && !lines[adminEnd].trim().startsWith("case 'familias-grupos'")) {
  adminEnd++
}
replaceRange(adminStart + 1, adminEnd, adminTabReplacement.split('\n').slice(1).join('\n')) // skip duplicate case line

// Re-read from lines array
content = lines.join('\n')

// Remove renderSidebarButtonOrganizer function
const sidebarFnStart = content.indexOf('  const renderSidebarButtonOrganizer = () => {')
if (sidebarFnStart !== -1) {
  const sidebarFnEnd = content.indexOf('  // Função para mover botão entre grupos', sidebarFnStart)
  if (sidebarFnEnd !== -1) {
    content = content.slice(0, sidebarFnStart) + content.slice(sidebarFnEnd)
  }
}

// Replace modal block
const modalStartMarker = '      {showModal && !openTabs.some(tab => tab.type === \'administrador\') && ('
const modalStart = content.indexOf(modalStartMarker)
if (modalStart === -1) throw new Error('modal start not found')

// Find the closing of this modal - look for modal de Formulário de Usuário comment after
const modalEndMarker = '      {/* Modal de Formulário de Usuário - Só mostra se não houver aba de administrador aberta */}'
const modalEnd = content.indexOf(modalEndMarker, modalStart)
if (modalEnd === -1) throw new Error('modal end not found')

const modalReplacement = `      {showModal && !openTabs.some(tab => tab.type === 'administrador') && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal admin-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto' }}>
            <AdministradorContent
              variant="compact"
              safeT={safeT}
              onClose={() => setShowModal(false)}
              saveData={saveData}
              loadData={loadData}
              onOpenDemosFullTab={() => {
                setShowModal(false)
                openTab('gestao-demos', getTabTitle('gestao-demos'))
              }}
              sync={{
                safeT,
                syncPendingRemote,
                syncPushLoading,
                setSyncDecisionModalOpen,
                setLastAcceptedRevision,
                pendingFullServerReplaceKey: NONATO_PENDING_FULL_SERVER_REPLACE_LS,
                enviarEsteAparelhoParaServidor,
              }}
              geral={{
                preverProximoNumeroRelatorio,
                logoUrl,
                logoType,
                logoUrlDashboard,
                logoTypeDashboard,
                adminSidebarLogoDraft,
                adminDashboardLogoDraft,
                adminLogoSavingSidebar,
                adminLogoSavingDashboard,
                handleFileChangeSidebarLogo,
                handleFileChangeDashboardLogo,
                commitAdminSidebarLogoDraft,
                discardAdminSidebarLogoDraft,
                commitAdminDashboardLogoDraft,
                discardAdminDashboardLogoDraft,
                handleRemoveSidebarLogo,
                handleRemoveDashboardLogo,
              }}
              users={{
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
              }}
              clientePrioritario={{
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
                emptyClientePrioritarioForm: () => ({
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
                  photo: '',
                }),
              }}
              sidebar={{
                sidebarButtons,
                sidebarGroups: SIDEBAR_GROUPS,
                sidebarPinnedIds: SIDEBAR_PINNED_IDS,
                sidebarOrganizerSearch,
                setSidebarOrganizerSearch,
                showSidebarButtonOrganizer,
                setShowSidebarButtonOrganizer,
                draggedButton,
                dragOverIndex,
                normalizeSidebarButtons,
                isSidebarButtonLocked,
                getDefaultSidebarGroup,
                getButtonName,
                getSidebarGroupLabel,
                getButtonsByGroup,
                handleRestoreSidebarOrganizerDefaults,
                handleDragStart,
                handleDragOver,
                handleDragLeave,
                handleDropWithGroup,
                handleDragEnd,
                handleMoveButtonToGroup,
                handleMoveButton,
                handleMoveButtonAcrossGroups,
                handleDeleteButton,
                setEditingButton,
                setButtonForm,
                setShowButtonForm,
              }}
              passwords={{
                t,
                selectedLanguage,
                localeDatetimeGeneral,
                managedPasswords,
                showPasswordForm,
                passwordForm,
                visiblePasswords,
                setShowPasswordForm,
                setPasswordForm,
                setVisiblePasswords,
                setManagedPasswords,
                generatePassword,
                handleSavePassword,
                saveData,
              }}
              backup={{
                isDemoMode,
                selectedLanguage,
                localeDatetimeGeneral,
                autoBackupEnabled,
                autoBackupInterval,
                setAutoBackupEnabled,
                setAutoBackupInterval,
                codeBackups,
                codeBackupsFolder,
                loadingBackups,
                restoringFromZip,
                restoreFromZipInputRef,
                saveData,
                handleCreateBackup,
                handleRestoreBackup,
                handleBackupCodigo,
                handleDownloadBackupZip,
                handleRestoreCodigo,
                handleRestoreFromZip,
                loadCodeBackups,
                getAutoBackups,
                restoreAutoBackup,
              }}
            />
          </div>
        </div>
      )}

`

content = content.slice(0, modalStart) + modalReplacement + content.slice(modalEnd)

fs.writeFileSync(pagePath, content)
console.log('Patched page.tsx')
