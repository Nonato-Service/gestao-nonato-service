/** Texto do balão ao pairar na sidebar — título visível + descrição opcional. */
export function extractSidebarButtonTip(btn: HTMLButtonElement): { title: string; desc: string } {
  const bubble = btn.querySelector('.sidebar-tip-bubble')
  const descRaw = (bubble?.textContent ?? '').replace(/\s+/g, ' ').trim()
  const labelEl =
    btn.querySelector('.sidebar-empresa-entry-title') ||
    btn.querySelector('.sidebar-nav-label-text')
  let title = (labelEl?.textContent ?? '').replace(/\s+/g, ' ').trim()
  if (!title) {
    title = (btn.getAttribute('aria-label') ?? '').trim()
  }
  if (!title) {
    title = (btn.textContent ?? '')
      .replace(/[✓›▸▾]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  }
  const desc = descRaw && descRaw !== title ? descRaw : ''
  return { title, desc }
}
