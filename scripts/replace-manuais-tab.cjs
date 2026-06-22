const fs = require('fs')
const p = 'app/page.tsx'
let s = fs.readFileSync(p, 'utf8')
const start = s.indexOf('  // Componente para evitar erro de parser SWC no case')
const end = s.indexOf('  /** Modal «Visualizar despesas»', start)
if (start < 0 || end < 0) {
  console.error('markers not found', start, end)
  process.exit(1)
}
const replacement = `  function ManuaisInformacoesTabContent() {
    return (
      <ManuaisInformacoesContent
        safeT={safeT as Record<string, string | undefined>}
        LogoComponent={LogoComponent}
        closeTab={closeTab}
        activeTabId={activeTabId}
        voltarPaginaInicial={voltarPaginaInicial}
        manuaisFamilias={manuaisFamilias}
        setManuaisFamilias={setManuaisFamilias}
        manuaisGrupos={manuaisGrupos}
        setManuaisGrupos={setManuaisGrupos}
        manuaisModelos={manuaisModelos}
        setManuaisModelos={setManuaisModelos}
        novaFamiliaManuais={novaFamiliaManuais}
        setNovaFamiliaManuais={setNovaFamiliaManuais}
        novoGrupoManuais={novoGrupoManuais}
        setNovoGrupoManuais={setNovoGrupoManuais}
        novoModeloManuais={novoModeloManuais}
        setNovoModeloManuais={setNovoModeloManuais}
        selectedFamiliaManuais={selectedFamiliaManuais}
        setSelectedFamiliaManuais={setSelectedFamiliaManuais}
        selectedGrupoManuais={selectedGrupoManuais}
        setSelectedGrupoManuais={setSelectedGrupoManuais}
        selectedModeloManuaisId={selectedModeloManuaisId}
        setSelectedModeloManuaisId={setSelectedModeloManuaisId}
        editingFamiliaManuais={editingFamiliaManuais}
        setEditingFamiliaManuais={setEditingFamiliaManuais}
        editingFamiliaManuaisValue={editingFamiliaManuaisValue}
        setEditingFamiliaManuaisValue={setEditingFamiliaManuaisValue}
        editingGrupoManuaisId={editingGrupoManuaisId}
        setEditingGrupoManuaisId={setEditingGrupoManuaisId}
        editingGrupoManuaisValue={editingGrupoManuaisValue}
        setEditingGrupoManuaisValue={setEditingGrupoManuaisValue}
        editingModeloManuaisId={editingModeloManuaisId}
        setEditingModeloManuaisId={setEditingModeloManuaisId}
        editingModeloManuaisValue={editingModeloManuaisValue}
        setEditingModeloManuaisValue={setEditingModeloManuaisValue}
        manuaisFamiliasRef={manuaisFamiliasRef}
        manuaisGruposRef={manuaisGruposRef}
        manuaisModelosRef={manuaisModelosRef}
        equipamentos={equipamentos}
        saveData={saveData}
      />
    )
  }

`
s = s.slice(0, start) + replacement + s.slice(end)
fs.writeFileSync(p, s)
console.log('OK')
