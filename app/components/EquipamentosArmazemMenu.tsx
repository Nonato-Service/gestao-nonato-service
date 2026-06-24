'use client'

import React from 'react'

type Props = {
  safeT: Record<string, string | undefined>
  etapa: 'hub' | 'visualizar-familias'
  familias: { nome: string; total: number }[]
  totalEquipamentos: number
  onCadastrar: () => void
  onAbrirVisualizar: () => void
  onEscolherFamilia: (familia: string | '__ALL__') => void
  onVoltarHub: () => void
}

export function EquipamentosArmazemMenu(props: Props) {
  const {
    safeT,
    etapa,
    familias,
    totalEquipamentos,
    onCadastrar,
    onAbrirVisualizar,
    onEscolherFamilia,
    onVoltarHub,
  } = props
  const tr = (key: string, fallback: string) => safeT[key] || fallback

  if (etapa === 'hub') {
    return (
      <div className="ns-equip-hub">
        <p className="ns-equip-hub__lead">
          {tr('equipamentosHubEscolha', 'O que deseja fazer?')}
        </p>
        <div className="ns-equip-hub__grid ns-equip-hub__grid--2">
          <button type="button" className="ns-equip-hub__card" onClick={onCadastrar}>
            <span className="ns-equip-hub__icon" aria-hidden>
              ➕
            </span>
            <strong>{tr('equipamentosHubCadastrar', 'Cadastrar Equipamentos')}</strong>
            <span>{tr('equipamentosHubCadastrarDesc', 'Registar novo equipamento no armazém')}</span>
          </button>
          <button type="button" className="ns-equip-hub__card" onClick={onAbrirVisualizar}>
            <span className="ns-equip-hub__icon" aria-hidden>
              👁️
            </span>
            <strong>{tr('equipamentosHubVisualizar', 'Visualizar Equipamentos do Armazém')}</strong>
            <span>
              {tr('equipamentosHubVisualizarDesc', 'Consultar equipamentos por família ou ver todos')}
            </span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="ns-equip-hub">
      <div className="ns-equip-hub__toolbar">
        <button type="button" className="ns-equip-hub__back" onClick={onVoltarHub}>
          ← {tr('equipamentosVoltarMenu', 'Voltar ao menu')}
        </button>
      </div>
      <h2 className="ns-equip-hub__title">
        {tr('equipamentosVisualizarFamiliasTitulo', 'Escolha a família')}
      </h2>
      <p className="ns-equip-hub__lead">
        {tr(
          'equipamentosVisualizarFamiliasDesc',
          'Selecione uma família para filtrar ou veja todos os equipamentos do armazém.'
        )}
      </p>
      <div className="ns-equip-hub__grid">
        <button
          type="button"
          className="ns-equip-hub__card ns-equip-hub__card--all"
          onClick={() => onEscolherFamilia('__ALL__')}
        >
          <span className="ns-equip-hub__icon" aria-hidden>
            📦
          </span>
          <strong>{tr('equipamentosVerTodos', 'Ver todos os equipamentos')}</strong>
          <span>
            {totalEquipamentos} {tr('equipamentosAtivos', 'equipamento(s)')}
          </span>
        </button>
        {familias.length === 0 ? (
          <div className="ns-equip-hub__empty">
            {tr('equipamentosSemFamilias', 'Nenhuma família cadastrada. Use «Cadastrar Equipamentos» ou «Famílias e grupos».')}
          </div>
        ) : (
          familias.map((familia) => (
            <button
              key={familia.nome}
              type="button"
              className="ns-equip-hub__card"
              onClick={() => onEscolherFamilia(familia.nome)}
            >
              <span className="ns-equip-hub__icon" aria-hidden>
                🏷️
              </span>
              <strong>{familia.nome}</strong>
              <span>
                {familia.total} {tr('equipamentosAtivos', 'equipamento(s)')}
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  )
}
