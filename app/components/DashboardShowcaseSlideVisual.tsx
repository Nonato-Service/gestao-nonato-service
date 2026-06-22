'use client'

import React from 'react'

type VisualId = 'reports' | 'clients' | 'parts' | 'knowledge' | 'warehouse' | 'finance'

const MENU: { id: VisualId; icon: string; label: string }[] = [
  { id: 'reports', icon: '📋', label: 'Relatórios' },
  { id: 'clients', icon: '👥', label: 'Clientes' },
  { id: 'parts', icon: '🔧', label: 'Peças' },
  { id: 'knowledge', icon: '📚', label: 'Conhecimento' },
  { id: 'warehouse', icon: '🏭', label: 'Armazém' },
  { id: 'finance', icon: '💬', label: 'Finanças' },
]

function Shell(props: { active: VisualId; title: string; children: React.ReactNode }) {
  const { active, title, children } = props
  return (
    <div className="ns-showcase-screen">
      <aside className="ns-showcase-screen__sidebar" aria-hidden>
        <div className="ns-showcase-screen__brand">NONATO SERVICE</div>
        <nav className="ns-showcase-screen__nav">
          {MENU.map((item) => (
            <div
              key={item.id}
              className={`ns-showcase-screen__nav-item${item.id === active ? ' is-active' : ''}`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </div>
          ))}
        </nav>
      </aside>
      <div className="ns-showcase-screen__main">
        <header className="ns-showcase-screen__topbar">
          <h2>{title}</h2>
          <span className="ns-showcase-screen__status">● Online</span>
        </header>
        <div className="ns-showcase-screen__body">{children}</div>
      </div>
    </div>
  )
}

function ReportsVisual() {
  return (
    <Shell active="reports" title="Relatório de serviço #2847">
      <div className="ns-showcase-screen__split">
        <div className="ns-showcase-screen__panel">
          <p className="ns-showcase-screen__label">Protocolo visual</p>
          <ul className="ns-showcase-screen__checks">
            <li className="done">Inspeção mecânica concluída</li>
            <li className="done">Teste elétrico OK</li>
            <li>Envio de fotos ao cliente</li>
          </ul>
          <p className="ns-showcase-screen__label">Peças utilizadas</p>
          <div className="ns-showcase-screen__tags">
            <span>Rolamento SKF 6205</span>
            <span>Filtro óleo</span>
            <span>Kit vedação</span>
          </div>
          <div className="ns-showcase-screen__actions">
            <span className="ns-showcase-screen__btn ns-showcase-screen__btn--primary">Gerar PDF</span>
            <span className="ns-showcase-screen__btn">Enviar ao cliente</span>
          </div>
        </div>
        <div className="ns-showcase-screen__panel ns-showcase-screen__panel--paper">
          <p className="ns-showcase-screen__label">Pré-visualização PDF</p>
          <div className="ns-showcase-screen__pdf">
            <div className="line lg" />
            <div className="line" />
            <div className="line" />
            <div className="block" />
            <div className="line short" />
          </div>
        </div>
      </div>
    </Shell>
  )
}

function ClientsVisual() {
  return (
    <Shell active="clients" title="Cadastro de clientes">
      <div className="ns-showcase-screen__search">Pesquisar cliente ou equipamento…</div>
      <div className="ns-showcase-screen__table">
        <div className="ns-showcase-screen__row head">
          <span>Cliente</span>
          <span>Equipamentos</span>
          <span>Último serviço</span>
        </div>
        <div className="ns-showcase-screen__row highlight">
          <span>Metalúrgica Silva Lda.</span>
          <span>12</span>
          <span>OS #2841</span>
        </div>
        <div className="ns-showcase-screen__row">
          <span>Indústria Alimentar Norte</span>
          <span>8</span>
          <span>OS #2836</span>
        </div>
        <div className="ns-showcase-screen__row">
          <span>Frigoríficos Costa</span>
          <span>24</span>
          <span>OS #2820</span>
        </div>
      </div>
      <div className="ns-showcase-screen__detail">
        <strong>EQ-2024-884 · Compressor Atlas</strong>
        <span>Histórico · Manutenções · Anexos técnicos</span>
      </div>
    </Shell>
  )
}

function PartsVisual() {
  return (
    <Shell active="parts" title="Biblioteca de peças">
      <div className="ns-showcase-screen__toolbar">
        <span className="ns-showcase-screen__btn ns-showcase-screen__btn--primary">+ Importar URL</span>
        <span className="ns-showcase-screen__search inline">Filtrar por código…</span>
      </div>
      <div className="ns-showcase-screen__cards">
        {[
          { code: 'NS-004821', name: 'Rolamento SKF 6205', stock: '14', ok: true },
          { code: 'NS-004822', name: 'Filtro óleo hidráulico', stock: '3', ok: false },
          { code: 'NS-004890', name: 'Kit vedação bomba', stock: '28', ok: true },
        ].map((p) => (
          <div key={p.code} className={`ns-showcase-screen__card${p.ok ? ' is-hot' : ''}`}>
            <div className="ns-showcase-screen__card-img" />
            <strong>{p.code}</strong>
            <span>{p.name}</span>
            <em>Stock: {p.stock}</em>
          </div>
        ))}
      </div>
    </Shell>
  )
}

function KnowledgeVisual() {
  return (
    <Shell active="knowledge" title="Centro de conhecimento técnico">
      <div className="ns-showcase-screen__tabs">
        <span className="active">Ficha técnica</span>
        <span>Documentos e imagens</span>
        <span>Equipamentos</span>
      </div>
      <div className="ns-showcase-screen__split">
        <div className="ns-showcase-screen__panel narrow">
          <p className="ns-showcase-screen__label">Famílias</p>
          <ul className="ns-showcase-screen__tree">
            <li className="active">Compressores</li>
            <li>Bombas hidráulicas</li>
            <li>Motores elétricos</li>
          </ul>
        </div>
        <div className="ns-showcase-screen__panel">
          <div className="ns-showcase-screen__row highlight">
            <span>Atlas Copco · GA 37</span>
            <span>Manual PDF</span>
          </div>
          <div className="ns-showcase-screen__preview-box">
            <div className="ns-showcase-screen__pdf light">
              <div className="line lg" />
              <div className="line" />
              <div className="block" />
            </div>
            <div className="ns-showcase-screen__actions">
              <span className="ns-showcase-screen__btn ns-showcase-screen__btn--primary">Visualizar</span>
              <span className="ns-showcase-screen__btn">Traduzir</span>
            </div>
          </div>
        </div>
      </div>
    </Shell>
  )
}

function WarehouseVisual() {
  return (
    <Shell active="warehouse" title="Separação e stock">
      <div className="ns-showcase-screen__split">
        <div className="ns-showcase-screen__panel">
          <p className="ns-showcase-screen__label">Ordem SP-118 · OS #2847</p>
          <ul className="ns-showcase-screen__checks">
            <li className="done">NS-004821 · Rolamento · Qtd 2</li>
            <li>NS-004822 · Filtro · Qtd 1</li>
          </ul>
          <span className="ns-showcase-screen__btn ns-showcase-screen__btn--primary">Confirmar saída</span>
        </div>
        <div className="ns-showcase-screen__panel">
          <p className="ns-showcase-screen__label">Stock em tempo real</p>
          <div className="ns-showcase-screen__table compact">
            <div className="ns-showcase-screen__row head">
              <span>Código</span>
              <span>Qtd</span>
              <span>Local</span>
            </div>
            <div className="ns-showcase-screen__row">
              <span>NS-004821</span>
              <span>14</span>
              <span>A3</span>
            </div>
            <div className="ns-showcase-screen__row">
              <span>NS-004822</span>
              <span>3</span>
              <span>B1</span>
            </div>
          </div>
          <div className="ns-showcase-screen__stats">
            <div><strong>847</strong><span>Referências</span></div>
            <div><strong>12</strong><span>Pendentes</span></div>
          </div>
        </div>
      </div>
    </Shell>
  )
}

function FinanceVisual() {
  return (
    <Shell active="finance" title="Orçamentos e comunicação">
      <div className="ns-showcase-screen__split">
        <div className="ns-showcase-screen__panel">
          <p className="ns-showcase-screen__label">Orçamento ORC-2026-042</p>
          <div className="ns-showcase-screen__quote">
            <strong>Metalúrgica Silva Lda.</strong>
            <span>Manutenção compressor</span>
          </div>
          <div className="ns-showcase-screen__stats inline">
            <div><strong>€ 486</strong><span>Peças</span></div>
            <div><strong>€ 320</strong><span>Mão de obra</span></div>
            <div className="total"><strong>€ 806</strong><span>Total</span></div>
          </div>
          <span className="ns-showcase-screen__btn ns-showcase-screen__btn--primary">Enviar orçamento</span>
        </div>
        <div className="ns-showcase-screen__panel">
          <p className="ns-showcase-screen__label">Mensagens internas</p>
          <div className="ns-showcase-screen__chat">
            <div className="bubble">Peças prontas para OS #2847</div>
            <div className="bubble mine">Orçamento aprovado — fechar OS</div>
            <div className="composer">Escrever mensagem…</div>
          </div>
        </div>
      </div>
    </Shell>
  )
}

const VISUALS: Record<VisualId, React.FC> = {
  reports: ReportsVisual,
  clients: ClientsVisual,
  parts: PartsVisual,
  knowledge: KnowledgeVisual,
  warehouse: WarehouseVisual,
  finance: FinanceVisual,
}

export function DashboardShowcaseSlideVisual(props: { visual: VisualId }) {
  const Comp = VISUALS[props.visual]
  return <Comp />
}
