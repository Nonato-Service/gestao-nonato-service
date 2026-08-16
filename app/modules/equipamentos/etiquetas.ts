export type { GrupoEquipamento } from './tiposGrupo'

/** Item incluso no equipamento de armazém (volume extra para etiquetas). */
export type ItemInclusoEtiqueta = {
  id: string
  nome: string
  imagem?: string
}

export type EquipamentoEtiquetaLike = {
  id?: string
  tipoEquipamento?: string
  modelo?: string
  marca?: string
  numeroSerie?: string
  familia?: string
  grupo?: string
  photo?: string
  coverPhoto?: string
  itemsIncluded?: Array<ItemInclusoEtiqueta | string>
}

/** Máquina (principal) = T/T; cada item incluso = T/(T−1), T/(T−2), … até T/1 */
export function getSequenciaEtiquetasArmazem(eq: EquipamentoEtiquetaLike): {
  total: number
  linhas: Array<{ id: string; nome: string; rotulo: string; imagem?: string; isPrincipal: boolean }>
} {
  const extras = (eq.itemsIncluded || []).map((raw, idx) =>
    typeof raw === 'string' ? { id: `legacy-${idx}-${String(raw).slice(0, 20)}`, nome: raw } : raw
  )
  const total = Math.max(1, 1 + extras.length)
  const nomePrincipal =
    [eq.tipoEquipamento, eq.modelo].filter(Boolean).join(' — ').trim() || eq.modelo || 'Equipamento'
  const linhas: Array<{ id: string; nome: string; rotulo: string; imagem?: string; isPrincipal: boolean }> =
    [
      {
        id: '__principal_armazem__',
        nome: nomePrincipal,
        rotulo: `${total}/${total}`,
        isPrincipal: true,
        imagem: eq.coverPhoto || eq.photo,
      },
    ]
  extras.forEach((ex, k) => {
    const denom = total - 1 - k
    linhas.push({
      id: ex.id,
      nome: ex.nome,
      rotulo: `${total}/${Math.max(1, denom)}`,
      imagem: ex.imagem,
      isPrincipal: false,
    })
  })
  return { total, linhas }
}

export type EtiquetasArmazemLabels = {
  titulo: string
  subtitulo: string
  serie: string
  clienteOuCarga?: string
}

/** Abre janela de impressão das etiquetas de volumes do armazém. */
export function openPrintEtiquetasArmazem(eq: EquipamentoEtiquetaLike, t: EtiquetasArmazemLabels) {
  const { total, linhas } = getSequenciaEtiquetasArmazem(eq)
  const esc = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  const idEquip = (eq.id || '').trim() || '—'
  const numEquip = (eq.numeroSerie || '').trim() || '—'
  const modeloMarca = [eq.modelo, eq.marca].filter(Boolean).join(' · ')
  const familiaGrupo = [eq.familia, eq.grupo].filter(Boolean).join(' / ')
  const cards = linhas
    .map((l) => {
      const sub = l.isPrincipal ? [eq.marca, eq.numeroSerie].filter(Boolean).join(' · ') || '' : ''
      const nomeVolume = esc(l.nome)
      return `
    <div class="etq-card">
      <div class="etq-banner">
        <div class="etq-banner-row">
          <span class="etq-banner-lbl">ID equipamento</span>
          <span class="etq-id-val">${esc(idEquip)}</span>
        </div>
        <div class="etq-banner-row etq-banner-mid">
          <span class="etq-vol-lbl">Volumes (total)</span>
          <span class="etq-vol-val">${total}</span>
        </div>
        <div class="etq-banner-row">
          <span class="etq-banner-lbl">N.º equipamento (S/N)</span>
          <span class="etq-sn-val">${esc(numEquip)}</span>
        </div>
      </div>
      <div class="etq-frac">${esc(l.rotulo)}</div>
      <div class="etq-nome">${nomeVolume}</div>
      ${sub && l.isPrincipal ? `<div class="etq-sub">${esc(sub)}</div>` : ''}
      ${!l.isPrincipal ? `<div class="etq-extra">Volume incluso · mesmo equipamento</div>` : ''}
      ${modeloMarca ? `<div class="etq-meta">${esc(modeloMarca)}</div>` : ''}
      ${familiaGrupo ? `<div class="etq-meta2">${esc(familiaGrupo)}</div>` : ''}
      <div class="etq-peq">${esc(t.titulo)} · ${esc(t.subtitulo)}</div>
    </div>`
    })
    .join('')
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${esc(t.titulo)}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; padding: 16px; background: #fff; color: #111; }
    h1 { font-size: 15px; margin: 0 0 8px; font-weight: 800; }
    .resumo { font-size: 13px; margin: 0 0 6px; font-weight: 700; color: #000; }
    .resumo span { color: #060; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 14px; }
    .etq-card { border: 3px solid #060; border-radius: 12px; padding: 12px; text-align: center; break-inside: avoid; page-break-inside: avoid; background: #fafefa; }
    .etq-banner { background: linear-gradient(180deg, #e8ffe8 0%, #f5fff5 100%); border: 2px solid #0a0; border-radius: 8px; padding: 10px 8px; margin-bottom: 10px; text-align: left; }
    .etq-banner-row { display: flex; flex-direction: column; gap: 2px; margin-bottom: 8px; }
    .etq-banner-row:last-child { margin-bottom: 0; }
    .etq-banner-mid { padding-bottom: 8px; border-bottom: 1px dashed #0a6; margin-bottom: 8px; }
    .etq-banner-lbl, .etq-vol-lbl { font-size: 9px; text-transform: uppercase; letter-spacing: 0.06em; color: #035; font-weight: 700; }
    .etq-id-val { font-size: 18px; font-weight: 900; color: #000; font-family: Consolas, 'Courier New', monospace; word-break: break-all; line-height: 1.15; }
    .etq-vol-val { font-size: 26px; font-weight: 900; color: #060; line-height: 1; }
    .etq-sn-val { font-size: 20px; font-weight: 800; color: #000; font-family: Consolas, 'Courier New', monospace; word-break: break-all; line-height: 1.15; }
    .etq-frac { font-size: 34px; font-weight: 900; color: #060; letter-spacing: 0.02em; margin-top: 4px; }
    .etq-nome { font-size: 13px; font-weight: 700; margin-top: 8px; word-break: break-word; color: #111; }
    .etq-sub { font-size: 11px; color: #333; margin-top: 4px; font-weight: 600; }
    .etq-extra { font-size: 10px; color: #444; margin-top: 4px; font-style: italic; }
    .etq-meta { font-size: 11px; color: #222; margin-top: 8px; font-weight: 600; }
    .etq-meta2 { font-size: 10px; color: #555; margin-top: 4px; }
    .etq-peq { font-size: 8px; color: #555; margin-top: 10px; text-transform: uppercase; letter-spacing: 0.04em; border-top: 1px solid #ccc; padding-top: 8px; }
    @media print { body { padding: 8px; } .etq-card { border-color: #000; background: #fff; } .etq-banner { border-color: #000; } }
  </style></head><body>
  <h1>${esc(t.titulo)} — ${esc(t.subtitulo)}</h1>
  <p class="resumo">ID: <span>${esc(idEquip)}</span> · Volumes: <span>${total}</span> · S/N: <span>${esc(numEquip)}</span></p>
  <p style="font-size:12px;margin:0 0 14px;color:#333;line-height:1.4">${esc(t.serie)}${t.clienteOuCarga ? ` · ${esc(t.clienteOuCarga)}` : ''}</p>
  <div class="grid">${cards}</div>
  <script>window.onload=function(){window.print();}</script>
  </body></html>`
  if (typeof window === 'undefined') return
  const w = window.open('', '_blank')
  if (!w) {
    alert('Permita pop-ups para imprimir as etiquetas.')
    return
  }
  w.document.write(html)
  w.document.close()
}
