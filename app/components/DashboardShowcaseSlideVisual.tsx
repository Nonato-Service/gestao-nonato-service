'use client'

import React from 'react'
import { ShowcaseTypingText } from './ShowcaseTypingText'

export type VisualId =
  | 'reports'
  | 'clients'
  | 'parts'
  | 'knowledge'
  | 'warehouse'
  | 'finance'
  | 'import'
  | 'schedule'
  | 'equipment'
  | 'sync'

const MENU: { id: VisualId; icon: string; label: string }[] = [
  { id: 'reports', icon: '📋', label: 'Relatórios' },
  { id: 'clients', icon: '👥', label: 'Clientes' },
  { id: 'parts', icon: '🔧', label: 'Peças' },
  { id: 'knowledge', icon: '📚', label: 'Conhecimento' },
  { id: 'warehouse', icon: '🏭', label: 'Armazém' },
  { id: 'finance', icon: '💬', label: 'Finanças' },
  { id: 'import', icon: '📥', label: 'Importação' },
  { id: 'schedule', icon: '📅', label: 'Agenda' },
  { id: 'equipment', icon: '⚙️', label: 'Equipamentos' },
  { id: 'sync', icon: '🔄', label: 'Sincronização' },
]

function Shell(props: {
  active: VisualId
  title: string
  live?: boolean
  children: React.ReactNode
}) {
  const { active, title, live = false, children } = props
  return (
    <div className="ns-showcase-screen" data-live={live ? 'true' : 'false'}>
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
          <h2>
            <ShowcaseTypingText text={title} active={live} speed={28} delay={120} showCursor={false} />
          </h2>
          <span className="ns-showcase-screen__status ns-showcase-animate-pulse">● Online</span>
        </header>
        <div className="ns-showcase-screen__body">{children}</div>
      </div>
    </div>
  )
}

function TypingSearch(props: { text: string; live?: boolean; inline?: boolean; delay?: number }) {
  const { text, live, inline, delay = 400 } = props
  return (
    <div className={`ns-showcase-screen__search${inline ? ' inline' : ''} ns-showcase-animate-in`}>
      <ShowcaseTypingText text={text} active={!!live} speed={38} delay={delay} />
    </div>
  )
}

function ReportsVisual({ live }: { live?: boolean }) {
  return (
    <Shell active="reports" title="Relatório de serviço #2847" live={live}>
      <div className="ns-showcase-screen__split">
        <div className="ns-showcase-screen__panel ns-showcase-animate-in" style={{ animationDelay: '0.2s' }}>
          <p className="ns-showcase-screen__label">Protocolo visual</p>
          <ul className="ns-showcase-screen__checks">
            <li className="done ns-showcase-stagger-item">Inspeção mecânica concluída</li>
            <li className="done ns-showcase-stagger-item">Teste elétrico OK</li>
            <li className="ns-showcase-stagger-item">Envio de fotos ao cliente</li>
          </ul>
          <p className="ns-showcase-screen__label">Peças utilizadas</p>
          <div className="ns-showcase-screen__tags">
            <span className="ns-showcase-stagger-item">Rolamento SKF 6205</span>
            <span className="ns-showcase-stagger-item">Filtro óleo</span>
            <span className="ns-showcase-stagger-item">Kit vedação</span>
          </div>
          <div className="ns-showcase-screen__actions ns-showcase-animate-in" style={{ animationDelay: '1.1s' }}>
            <span className="ns-showcase-screen__btn ns-showcase-screen__btn--primary">Gerar PDF</span>
            <span className="ns-showcase-screen__btn">Enviar ao cliente</span>
          </div>
        </div>
        <div
          className="ns-showcase-screen__panel ns-showcase-screen__panel--paper ns-showcase-animate-in"
          style={{ animationDelay: '0.45s' }}
        >
          <p className="ns-showcase-screen__label">Pré-visualização PDF</p>
          <div className="ns-showcase-screen__pdf ns-showcase-pdf-build">
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

function ClientsVisual({ live }: { live?: boolean }) {
  return (
    <Shell active="clients" title="Cadastro de clientes" live={live}>
      <TypingSearch text="Pesquisar cliente ou equipamento…" live={live} />
      <div className="ns-showcase-screen__table">
        <div className="ns-showcase-screen__row head">
          <span>Cliente</span>
          <span>Equipamentos</span>
          <span>Último serviço</span>
        </div>
        <div className="ns-showcase-screen__row highlight ns-showcase-stagger-item">
          <span>Metalúrgica Silva Lda.</span>
          <span>12</span>
          <span>OS #2841</span>
        </div>
        <div className="ns-showcase-screen__row ns-showcase-stagger-item">
          <span>Indústria Alimentar Norte</span>
          <span>8</span>
          <span>OS #2836</span>
        </div>
        <div className="ns-showcase-screen__row ns-showcase-stagger-item">
          <span>Frigoríficos Costa</span>
          <span>24</span>
          <span>OS #2820</span>
        </div>
      </div>
      <div className="ns-showcase-screen__detail ns-showcase-animate-in" style={{ animationDelay: '1.4s' }}>
        <strong>EQ-2024-884 · Compressor Atlas</strong>
        <span>Histórico · Manutenções · Anexos técnicos</span>
      </div>
    </Shell>
  )
}

function PartsVisual({ live }: { live?: boolean }) {
  return (
    <Shell active="parts" title="Biblioteca de peças" live={live}>
      <div className="ns-showcase-screen__toolbar ns-showcase-animate-in">
        <span className="ns-showcase-screen__btn ns-showcase-screen__btn--primary">+ Importar URL</span>
        <TypingSearch text="Filtrar por código…" live={live} inline delay={600} />
      </div>
      <div className="ns-showcase-screen__cards">
        {[
          { code: 'NS-004821', name: 'Rolamento SKF 6205', stock: '14', ok: true },
          { code: 'NS-004822', name: 'Filtro óleo hidráulico', stock: '3', ok: false },
          { code: 'NS-004890', name: 'Kit vedação bomba', stock: '28', ok: true },
        ].map((p, i) => (
          <div
            key={p.code}
            className={`ns-showcase-screen__card ns-showcase-stagger-item${p.ok ? ' is-hot' : ''}`}
            style={{ animationDelay: `${0.35 + i * 0.18}s` }}
          >
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

function KnowledgeVisual({ live }: { live?: boolean }) {
  return (
    <Shell active="knowledge" title="Centro de conhecimento técnico" live={live}>
      <div className="ns-showcase-screen__tabs ns-showcase-animate-in">
        <span className="active">Ficha técnica</span>
        <span>Documentos e imagens</span>
        <span>Equipamentos</span>
      </div>
      <div className="ns-showcase-screen__split">
        <div className="ns-showcase-screen__panel narrow ns-showcase-animate-in" style={{ animationDelay: '0.25s' }}>
          <p className="ns-showcase-screen__label">Famílias</p>
          <ul className="ns-showcase-screen__tree">
            <li className="active ns-showcase-stagger-item">Compressores</li>
            <li className="ns-showcase-stagger-item">Bombas hidráulicas</li>
            <li className="ns-showcase-stagger-item">Motores elétricos</li>
          </ul>
        </div>
        <div className="ns-showcase-screen__panel ns-showcase-animate-in" style={{ animationDelay: '0.45s' }}>
          <div className="ns-showcase-screen__row highlight ns-showcase-stagger-item">
            <span>Atlas Copco · GA 37</span>
            <span>Manual PDF</span>
          </div>
          <div className="ns-showcase-screen__preview-box">
            <div className="ns-showcase-screen__pdf light ns-showcase-pdf-build">
              <div className="line lg" />
              <div className="line" />
              <div className="block" />
            </div>
            <div className="ns-showcase-screen__actions ns-showcase-animate-in" style={{ animationDelay: '1.2s' }}>
              <span className="ns-showcase-screen__btn ns-showcase-screen__btn--primary">Visualizar</span>
              <span className="ns-showcase-screen__btn">Traduzir</span>
            </div>
          </div>
        </div>
      </div>
    </Shell>
  )
}

function WarehouseVisual({ live }: { live?: boolean }) {
  return (
    <Shell active="warehouse" title="Separação e stock" live={live}>
      <div className="ns-showcase-screen__split">
        <div className="ns-showcase-screen__panel ns-showcase-animate-in">
          <p className="ns-showcase-screen__label">Ordem SP-118 · OS #2847</p>
          <ul className="ns-showcase-screen__checks">
            <li className="done ns-showcase-stagger-item">NS-004821 · Rolamento · Qtd 2</li>
            <li className="ns-showcase-stagger-item">NS-004822 · Filtro · Qtd 1</li>
          </ul>
          <span className="ns-showcase-screen__btn ns-showcase-screen__btn--primary ns-showcase-animate-in">
            Confirmar saída
          </span>
        </div>
        <div className="ns-showcase-screen__panel ns-showcase-animate-in" style={{ animationDelay: '0.3s' }}>
          <p className="ns-showcase-screen__label">Stock em tempo real</p>
          <div className="ns-showcase-screen__table compact">
            <div className="ns-showcase-screen__row head">
              <span>Código</span>
              <span>Qtd</span>
              <span>Local</span>
            </div>
            <div className="ns-showcase-screen__row ns-showcase-stagger-item">
              <span>NS-004821</span>
              <span>14</span>
              <span>A3</span>
            </div>
            <div className="ns-showcase-screen__row ns-showcase-stagger-item">
              <span>NS-004822</span>
              <span>3</span>
              <span>B1</span>
            </div>
          </div>
          <div className="ns-showcase-screen__stats">
            <div className="ns-showcase-stagger-item">
              <strong>847</strong>
              <span>Referências</span>
            </div>
            <div className="ns-showcase-stagger-item">
              <strong>12</strong>
              <span>Pendentes</span>
            </div>
          </div>
        </div>
      </div>
    </Shell>
  )
}

function FinanceVisual({ live }: { live?: boolean }) {
  return (
    <Shell active="finance" title="Orçamentos e comunicação" live={live}>
      <div className="ns-showcase-screen__split">
        <div className="ns-showcase-screen__panel ns-showcase-animate-in">
          <p className="ns-showcase-screen__label">Orçamento ORC-2026-042</p>
          <div className="ns-showcase-screen__quote ns-showcase-stagger-item">
            <strong>Metalúrgica Silva Lda.</strong>
            <span>Manutenção compressor</span>
          </div>
          <div className="ns-showcase-screen__stats inline">
            <div className="ns-showcase-stagger-item">
              <strong>€ 486</strong>
              <span>Peças</span>
            </div>
            <div className="ns-showcase-stagger-item">
              <strong>€ 320</strong>
              <span>Mão de obra</span>
            </div>
            <div className="total ns-showcase-stagger-item">
              <strong>€ 806</strong>
              <span>Total</span>
            </div>
          </div>
          <span className="ns-showcase-screen__btn ns-showcase-screen__btn--primary ns-showcase-animate-in">
            Enviar orçamento
          </span>
        </div>
        <div className="ns-showcase-screen__panel ns-showcase-animate-in" style={{ animationDelay: '0.35s' }}>
          <p className="ns-showcase-screen__label">Mensagens internas</p>
          <div className="ns-showcase-screen__chat">
            <div className="bubble ns-showcase-stagger-item">Peças prontas para OS #2847</div>
            <div className="bubble mine ns-showcase-stagger-item">Orçamento aprovado — fechar OS</div>
            <div className="composer">
              <ShowcaseTypingText text="Escrever mensagem…" active={!!live} speed={42} delay={1200} />
            </div>
          </div>
        </div>
      </div>
    </Shell>
  )
}

function ImportVisual({ live }: { live?: boolean }) {
  return (
    <Shell active="import" title="Importação de catálogo" live={live}>
      <div className="ns-showcase-screen__paste ns-showcase-animate-in">
        <p className="ns-showcase-screen__label">Colar página do fornecedor</p>
        <div className="ns-showcase-screen__paste-box">
          <ShowcaseTypingText
            text="700030001 · Rolamento guia · € 24,90"
            active={!!live}
            speed={34}
            delay={350}
          />
        </div>
      </div>
      <div className="ns-showcase-screen__import-analysis">
        <div className="ns-showcase-screen__import-block warn ns-showcase-animate-in" style={{ animationDelay: '1.1s' }}>
          <strong>Já na biblioteca (2)</strong>
          <span>700030001 · 700030002</span>
        </div>
        <div className="ns-showcase-screen__import-block ok ns-showcase-animate-in" style={{ animationDelay: '1.45s' }}>
          <strong>Novas para cadastrar (5)</strong>
          <span>Serão enviadas para a fila amarela</span>
        </div>
      </div>
      <div className="ns-showcase-screen__actions ns-showcase-animate-in" style={{ animationDelay: '1.8s' }}>
        <span className="ns-showcase-screen__btn ns-showcase-screen__btn--primary">Importar 5 peça(s) nova(s)</span>
      </div>
    </Shell>
  )
}

function ScheduleVisual({ live }: { live?: boolean }) {
  return (
    <Shell active="schedule" title="Diário de pedidos" live={live}>
      <TypingSearch text="Filtrar por cliente ou n.º OS…" live={live} />
      <div className="ns-showcase-screen__table">
        <div className="ns-showcase-screen__row head">
          <span>Data</span>
          <span>Cliente</span>
          <span>Estado</span>
        </div>
        <div className="ns-showcase-screen__row highlight ns-showcase-stagger-item">
          <span>Hoje · 09:30</span>
          <span>Metalúrgica Silva</span>
          <span className="ns-showcase-badge-live">Em curso</span>
        </div>
        <div className="ns-showcase-screen__row ns-showcase-stagger-item">
          <span>Amanhã · 14:00</span>
          <span>Frigoríficos Costa</span>
          <span>Agendado</span>
        </div>
        <div className="ns-showcase-screen__row ns-showcase-stagger-item">
          <span>28/06 · 08:00</span>
          <span>Ind. Alimentar Norte</span>
          <span>Confirmado</span>
        </div>
      </div>
      <div className="ns-showcase-screen__timeline ns-showcase-animate-in" style={{ animationDelay: '1.3s' }}>
        <span className="ns-showcase-screen__timeline-dot" />
        <span>Técnico João · OS #2847 · Visita confirmada</span>
      </div>
    </Shell>
  )
}

function EquipmentVisual({ live }: { live?: boolean }) {
  return (
    <Shell active="equipment" title="Equipamentos no armazém" live={live}>
      <div className="ns-showcase-screen__split">
        <div className="ns-showcase-screen__panel ns-showcase-animate-in">
          <p className="ns-showcase-screen__label">Carga · EQ-2024-884</p>
          <div className="ns-showcase-screen__load-seq">
            <div className="ns-showcase-screen__load-item ns-showcase-stagger-item is-main">
              <span>1/3</span>
              <strong>Compressor Atlas GA 37</strong>
            </div>
            <div className="ns-showcase-screen__load-item ns-showcase-stagger-item">
              <span>2/3</span>
              <strong>Separador + kit tubagem</strong>
            </div>
            <div className="ns-showcase-screen__load-item ns-showcase-stagger-item">
              <span>3/3</span>
              <strong>Caixa ferramentas</strong>
            </div>
          </div>
        </div>
        <div className="ns-showcase-screen__panel ns-showcase-animate-in" style={{ animationDelay: '0.35s' }}>
          <p className="ns-showcase-screen__label">Etiquetas de armazém</p>
          <div className="ns-showcase-screen__tags">
            <span className="ns-showcase-stagger-item">🏷️ T/3 · Máquina</span>
            <span className="ns-showcase-stagger-item">🏷️ T/2 · Embalagem</span>
            <span className="ns-showcase-stagger-item">🏷️ T/1 · Extra</span>
          </div>
          <div className="ns-showcase-screen__detail ns-showcase-animate-in" style={{ animationDelay: '1.2s' }}>
            <strong>Sequência de saída automática</strong>
            <span>Cliente → camião · volumes numerados</span>
          </div>
        </div>
      </div>
    </Shell>
  )
}

function SyncVisual({ live }: { live?: boolean }) {
  return (
    <Shell active="sync" title="Sincronização multi-dispositivo" live={live}>
      <div className="ns-showcase-screen__sync-grid">
        <div className="ns-showcase-screen__sync-device ns-showcase-animate-in">
          <span className="ns-showcase-screen__sync-icon">💻</span>
          <strong>Escritório</strong>
          <span className="ns-showcase-badge-live">Online</span>
        </div>
        <div className="ns-showcase-screen__sync-flow ns-showcase-animate-pulse" aria-hidden>
          <span className="ns-showcase-screen__sync-arrow">⇄</span>
          <em>Servidor</em>
        </div>
        <div className="ns-showcase-screen__sync-device ns-showcase-animate-in" style={{ animationDelay: '0.35s' }}>
          <span className="ns-showcase-screen__sync-icon">📱</span>
          <strong>Campo</strong>
          <span>Carregar do servidor</span>
        </div>
      </div>
      <div className="ns-showcase-screen__sync-log ns-showcase-animate-in" style={{ animationDelay: '0.8s' }}>
        <div className="ns-showcase-screen__sync-line ns-showcase-stagger-item">
          <ShowcaseTypingText text="✓ Dados enviados ao servidor" active={!!live} speed={30} delay={900} showCursor={false} />
        </div>
        <div className="ns-showcase-screen__sync-line ns-showcase-stagger-item">
          <ShowcaseTypingText text="↻ Outros aparelhos verão «Carregar do servidor»" active={!!live} speed={28} delay={1800} showCursor={false} />
        </div>
      </div>
    </Shell>
  )
}

const VISUALS: Record<VisualId, React.FC<{ live?: boolean }>> = {
  reports: ReportsVisual,
  clients: ClientsVisual,
  parts: PartsVisual,
  knowledge: KnowledgeVisual,
  warehouse: WarehouseVisual,
  finance: FinanceVisual,
  import: ImportVisual,
  schedule: ScheduleVisual,
  equipment: EquipmentVisual,
  sync: SyncVisual,
}

export function DashboardShowcaseSlideVisual(props: { visual: VisualId; live?: boolean }) {
  const Comp = VISUALS[props.visual]
  return <Comp live={props.live} />
}
