'use client'

import React, { useState } from 'react'
import {
  ClienteEquipamentoHistoricoPanel,
  type ClienteEquipamentoHistVista,
  type RelatorioEquipamentoHistorico,
} from './ClienteEquipamentoHistoricoPanel'
import type {
  PedidoOrcamentoRef,
  PedidoAvulsoRef,
  EquipamentoClienteRef,
  EquipamentoArmazemRef,
} from '../lib/clienteEquipamentoOrcamentos'

type HubTab = 'relatorios' | 'pecas' | 'orcamentos'

type Props = {
  relatorios: RelatorioEquipamentoHistorico[]
  clienteId: string
  clienteNome: string
  equipamento: EquipamentoClienteRef
  equipamentoIndex: number
  pedidosRelatorio: PedidoOrcamentoRef[]
  equipamentosArmazem?: EquipamentoArmazemRef[]
  language?: string
  safeT: Record<string, string | undefined>
  loadData?: (key: string) => Promise<unknown>
  relatorioComDivida?: (relatorioId: string) => boolean
  onVerRelatorio?: (relatorio: RelatorioEquipamentoHistorico) => void
  onUpdatePedidoRelatorioStatus?: (id: string, status: PedidoOrcamentoRef['status']) => void
  onVisualizarPdfRelatorio?: (pedido: PedidoOrcamentoRef) => void
  onVisualizarPdfAvulso?: (pedido: PedidoAvulsoRef) => void
  onAtualizarPedidoAvulso?: (pedidos: PedidoAvulsoRef[]) => void
  /** Abre formulário de novo relatório de serviço com cliente + equipamento preenchidos. */
  onNovoRelatorio?: () => void
  /** Abre modal de nova fatura de peças com cliente + equipamento preenchidos. */
  onNovaFatura?: () => void
  /** Abre pedido de orçamento/peças avulso com cliente + equipamento preenchidos. */
  onNovoPedidoOrcamento?: () => void
}

const TABS: Array<{ id: HubTab; vista: ClienteEquipamentoHistVista; labelKey: string; fallback: string; icon: string }> = [
  { id: 'relatorios', vista: 'relatorios', labelKey: 'hubEqTabRelatorios', fallback: 'Relatórios de Serviço', icon: '📋' },
  { id: 'pecas', vista: 'pecas', labelKey: 'hubEqTabPecas', fallback: 'Pedidos de Peças', icon: '🔧' },
  { id: 'orcamentos', vista: 'orcamentos', labelKey: 'hubEqTabOrcamentos', fallback: 'Orçamentos', icon: '💶' },
]

const btnCriarStyle: React.CSSProperties = {
  padding: '7px 11px',
  borderRadius: '8px',
  fontSize: '11px',
  fontWeight: 700,
  letterSpacing: '0.02em',
  cursor: 'pointer',
  border: '1px solid rgba(0, 200, 83, 0.45)',
  background: 'rgba(0, 200, 83, 0.1)',
  color: '#b9ffd0',
  whiteSpace: 'nowrap',
}

export function ClienteEquipamentoHub(props: Props) {
  const [tab, setTab] = useState<HubTab>('relatorios')
  const tr = (key: string, fb: string) => props.safeT[key] || fb
  const active = TABS.find((t) => t.id === tab) || TABS[0]
  const temAcoesCriar = Boolean(props.onNovoRelatorio || props.onNovaFatura || props.onNovoPedidoOrcamento)

  return (
    <div className="cliente-equip-hub">
      <div
        className="cliente-equip-hub__tabs"
        role="tablist"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
          marginBottom: temAcoesCriar ? '10px' : '14px',
          paddingBottom: '12px',
          borderBottom: temAcoesCriar ? 'none' : '1px solid rgba(0, 200, 83, 0.18)',
        }}
      >
        {TABS.map((t) => {
          const selected = t.id === tab
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setTab(t.id)}
              style={{
                padding: '10px 14px',
                borderRadius: '10px',
                fontSize: '12px',
                fontWeight: 700,
                letterSpacing: '0.02em',
                cursor: 'pointer',
                border: selected ? '1px solid rgba(0, 200, 83, 0.55)' : '1px solid rgba(255,255,255,0.12)',
                background: selected ? 'rgba(0, 200, 83, 0.18)' : 'rgba(0,0,0,0.25)',
                color: selected ? '#b9ffd0' : 'rgba(255,255,255,0.78)',
              }}
            >
              {t.icon} {tr(t.labelKey, t.fallback)}
            </button>
          )
        })}
      </div>

      {temAcoesCriar && (
        <div
          className="cliente-equip-hub__criar"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '14px',
            paddingBottom: '12px',
            borderBottom: '1px solid rgba(0, 200, 83, 0.18)',
          }}
        >
          <span
            style={{
              fontSize: '11px',
              color: 'rgba(255,255,255,0.55)',
              marginRight: '4px',
            }}
          >
            {tr('hubEqCriarBarraHint', 'Criar a partir deste equipamento:')}
          </span>
          {props.onNovoRelatorio && (
            <button
              type="button"
              className="cliente-equip-hub__criar-relatorio"
              onClick={props.onNovoRelatorio}
              style={btnCriarStyle}
            >
              ➕ {tr('hubEqCriarRelatorio', 'Novo Relatório')}
            </button>
          )}
          {props.onNovoPedidoOrcamento && (
            <button
              type="button"
              className="cliente-equip-hub__criar-orcamento"
              onClick={props.onNovoPedidoOrcamento}
              style={btnCriarStyle}
            >
              🔧 {tr('hubEqCriarOrcamento', 'Pedido / Orçamento')}
            </button>
          )}
          {props.onNovaFatura && (
            <button
              type="button"
              className="cliente-equip-hub__criar-fatura"
              onClick={props.onNovaFatura}
              style={btnCriarStyle}
            >
              💶 {tr('hubEqCriarFatura', 'Nova Fatura')}
            </button>
          )}
        </div>
      )}

      <ClienteEquipamentoHistoricoPanel {...props} vista={active.vista} />
    </div>
  )
}
