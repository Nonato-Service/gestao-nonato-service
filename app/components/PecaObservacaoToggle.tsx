'use client'

type Props = {
  incluir: boolean
  texto: string
  onIncluirChange: (sim: boolean) => void
  onTextoChange: (texto: string) => void
  safeT: Record<string, string | undefined>
}

/** Sim/Não + campo de texto opcional por peça (orçamentos e pedidos avulsos). */
export function PecaObservacaoToggle({
  incluir,
  texto,
  onIncluirChange,
  onTextoChange,
  safeT,
}: Props) {
  return (
    <div className="orc-pro__peca-obs">
      <div className="orc-pro__peca-obs-toggle">
        <span className="orc-pro__peca-obs-label">
          {safeT?.pecaObservacaoPergunta || 'Adicionar observação?'}
        </span>
        <button
          type="button"
          className={`orc-pro__peca-obs-btn${incluir ? ' orc-pro__peca-obs-btn--active' : ''}`}
          onClick={() => onIncluirChange(true)}
        >
          {safeT?.pecaObservacaoSim || 'Sim'}
        </button>
        <button
          type="button"
          className={`orc-pro__peca-obs-btn${!incluir ? ' orc-pro__peca-obs-btn--active' : ''}`}
          onClick={() => onIncluirChange(false)}
        >
          {safeT?.pecaObservacaoNao || 'Não'}
        </button>
      </div>
      {incluir && (
        <textarea
          className="orc-pro__input orc-pro__peca-obs-field"
          rows={2}
          value={texto}
          onChange={(e) => onTextoChange(e.target.value)}
          placeholder={
            safeT?.pecaObservacaoPlaceholder ||
            'Escreva as informações desejadas sobre esta peça…'
          }
        />
      )}
    </div>
  )
}
