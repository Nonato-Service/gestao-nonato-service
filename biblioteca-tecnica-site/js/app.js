/**
 * Bíblia da Nonato Service — Famílias → Modelos → Documentos + busca global + hero
 * (cópia gestão — chave localStorage do hero isolada da Bíblia original)
 */
(function () {
  const LS_HERO = 'gestao.biblia.heroDismissed';

  let state = { view: 'familias', familiaId: null, familiaNome: null, modeloId: null, modeloNome: null };
  let searchTimer = null;
  let lastSearchResults = [];

  const $ = (id) => document.getElementById(id);
  const $$ = (sel) => document.querySelectorAll(sel);

  function showView(viewName) {
    $$('.view').forEach(function (v) {
      v.classList.remove('active');
    });
    const v = document.getElementById('view-' + viewName);
    if (v) v.classList.add('active');
    state.view = viewName;
    refreshBreadcrumb();
  }

  function refreshBreadcrumb() {
    const bc = $('breadcrumb');
    if (!bc) return;
    let html = '<a href="#" data-goto="familias">Famílias</a>';
    if (state.familiaId) {
      html +=
        ' <span class="bc-sep" aria-hidden="true">›</span> <a href="#" data-goto="modelos">' +
        escapeHtml(state.familiaNome || 'Família') +
        '</a>';
    }
    if (state.modeloId) {
      html +=
        ' <span class="bc-sep" aria-hidden="true">›</span> <span class="bc-current">' +
        escapeHtml(state.modeloNome || 'Modelo') +
        '</span>';
    }
    bc.innerHTML = html;
    bc.querySelectorAll('a[data-goto]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        goto(a.getAttribute('data-goto'));
      });
    });
  }

  function goto(where) {
    if (where === 'familias') {
      state.familiaId = state.familiaNome = state.modeloId = state.modeloNome = null;
      showView('familias');
      loadFamilias();
    } else if (where === 'modelos' && state.familiaId) {
      state.modeloId = state.modeloNome = null;
      showView('modelos');
      loadModelos();
    }
  }

  function escapeHtml(s) {
    if (!s) return '';
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function emptyListMessage(text) {
    return '<li class="empty-row" role="presentation"><p class="empty-msg">' + escapeHtml(text) + '</p></li>';
  }

  function isTypingTarget(el) {
    if (!el || !el.tagName) return false;
    const t = el.tagName;
    return t === 'INPUT' || t === 'TEXTAREA' || t === 'SELECT' || el.isContentEditable;
  }

  /* ---------- Hero ---------- */
  function heroDismissed() {
    try {
      return localStorage.getItem(LS_HERO) === '1';
    } catch (e) {
      return false;
    }
  }

  function setHeroDismissed() {
    try {
      localStorage.setItem(LS_HERO, '1');
    } catch (e) {}
  }

  function hideHero() {
    const h = $('heroWelcome');
    if (h) h.hidden = true;
  }

  function showHeroBlock() {
    const h = $('heroWelcome');
    if (h) {
      h.hidden = false;
      h.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  function renderStartInfo() {
    const root = $('startInfoRoot');
    const data = typeof window.START_INFO !== 'undefined' ? window.START_INFO : null;
    if (!root || !data) return;
    const parts = [];
    parts.push('<div class="start-info-inner">');
    parts.push('<header class="start-info-head">');
    parts.push('<h2 class="start-info-title">' + escapeHtml(data.titulo || '') + '</h2>');
    if (data.subtitulo) {
      parts.push('<p class="start-info-sub">' + escapeHtml(data.subtitulo) + '</p>');
    }
    parts.push('</header>');
    if (data.paragrafo) {
      parts.push('<p class="start-info-lead">' + escapeHtml(data.paragrafo) + '</p>');
    }
    if (data.destaques && data.destaques.length) {
      parts.push('<ul class="start-info-grid">');
      data.destaques.forEach(function (d) {
        parts.push(
          '<li class="start-info-card"><h3 class="start-info-card-title">' +
            escapeHtml(d.titulo || '') +
            '</h3><p class="start-info-card-text">' +
            escapeHtml(d.texto || '') +
            '</p></li>'
        );
      });
      parts.push('</ul>');
    }
    if (data.bullets && data.bullets.length) {
      parts.push('<ul class="start-info-bullets">');
      data.bullets.forEach(function (b) {
        parts.push('<li>' + escapeHtml(b) + '</li>');
      });
      parts.push('</ul>');
    }
    if (data.contato && data.contato.linhas && data.contato.linhas.length) {
      parts.push('<div class="start-info-contact">');
      parts.push('<span class="start-info-contact-label">Contacto</span>');
      data.contato.linhas.forEach(function (ln) {
        parts.push('<p class="start-info-contact-line">' + escapeHtml(ln) + '</p>');
      });
      parts.push('</div>');
    }
    if (data.links && data.links.length) {
      parts.push('<div class="start-info-links">');
      data.links.forEach(function (lnk) {
        if (!lnk.href) return;
        const hrefEsc = String(lnk.href).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
        parts.push(
          '<a class="start-info-link" href="' +
            hrefEsc +
            '" target="_blank" rel="noopener noreferrer">' +
            escapeHtml(lnk.label || lnk.href) +
            '</a>'
        );
      });
      parts.push('</div>');
    }
    parts.push('</div>');
    root.innerHTML = parts.join('');
  }

  function initHero() {
    const hero = $('heroWelcome');
    if (!hero) return;
    if (!heroDismissed()) {
      hero.hidden = false;
    }
    const dismiss = $('heroDismiss');
    const cta = $('heroCta');
    const showBtn = $('btnShowHero');
    if (dismiss) {
      dismiss.addEventListener('click', function () {
        setHeroDismissed();
        hideHero();
      });
    }
    if (cta) {
      cta.addEventListener('click', function () {
        setHeroDismissed();
        hideHero();
        goto('familias');
        const inp = $('globalSearch');
        if (inp) inp.focus();
      });
    }
    if (showBtn) {
      showBtn.addEventListener('click', function () {
        try {
          localStorage.removeItem(LS_HERO);
        } catch (e) {}
        showHeroBlock();
      });
    }
  }

  /* ---------- Busca global ---------- */
  function searchPanelEl() {
    return $('searchPanel');
  }

  function searchInputEl() {
    return $('globalSearch');
  }

  function setSearchExpanded(open) {
    const inp = searchInputEl();
    if (inp) inp.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  function closeSearchPanel() {
    const panel = searchPanelEl();
    const clearBtn = $('searchClear');
    if (panel) {
      panel.hidden = true;
      panel.innerHTML = '';
    }
    lastSearchResults = [];
    setSearchExpanded(false);
    if (clearBtn) clearBtn.hidden = true;
  }

  function openSearchPanel() {
    const panel = searchPanelEl();
    if (panel) panel.hidden = false;
    setSearchExpanded(true);
  }

  function tokenMatch(query, haystack) {
    const q = (query || '').trim().toLowerCase();
    if (q.length < 2) return false;
    const h = (haystack || '').toLowerCase();
    return h.indexOf(q) !== -1;
  }

  async function runGlobalSearch(query) {
    const q = (query || '').trim();
    if (q.length < 2) {
      closeSearchPanel();
      return;
    }
    const familias = await getAllFamilias();
    const modelos = await getAllModelos();
    const docs = await getAllDocumentos();
    const famById = {};
    familias.forEach(function (f) {
      famById[f.id] = f;
    });
    const modById = {};
    modelos.forEach(function (m) {
      modById[m.id] = m;
    });
    const out = [];

    familias.forEach(function (f) {
      if (tokenMatch(q, [f.nome, f.descricao].filter(Boolean).join(' '))) {
        out.push({
          type: 'familia',
          id: f.id,
          title: f.nome,
          badge: 'Família',
          detail: f.descricao || ''
        });
      }
    });

    modelos.forEach(function (m) {
      const fn = famById[m.familiaId];
      const blob = [m.nome, m.descricao, fn ? fn.nome : ''].filter(Boolean).join(' ');
      if (tokenMatch(q, blob)) {
        out.push({
          type: 'modelo',
          id: m.id,
          familiaId: m.familiaId,
          title: m.nome,
          badge: 'Modelo',
          detail: (fn ? fn.nome + ' · ' : '') + (m.descricao || '')
        });
      }
    });

    docs.forEach(function (d) {
      const m = modById[d.modeloId];
      const fn = m ? famById[m.familiaId] : null;
      const blob = [d.titulo, d.observacoes, d.tipo, d.fileName, m ? m.nome : '', fn ? fn.nome : ''].filter(Boolean).join(' ');
      if (tokenMatch(q, blob)) {
        out.push({
          type: 'documento',
          id: d.id,
          modeloId: d.modeloId,
          familiaId: m ? m.familiaId : null,
          title: d.titulo,
          badge: 'Documento',
          detail: (fn ? fn.nome + ' › ' : '') + (m ? m.nome : '') + (d.fileName ? ' · ' + d.fileName : '')
        });
      }
    });

    lastSearchResults = out.slice(0, 36);
    renderSearchPanel(lastSearchResults, q);
  }

  function renderSearchPanel(results, query) {
    const panel = searchPanelEl();
    const clearBtn = $('searchClear');
    if (!panel) return;
    if (!results.length) {
      panel.innerHTML =
        '<div class="search-panel-empty" role="status">Nenhum resultado para “' +
        escapeHtml(query) +
        '”.</div>';
      openSearchPanel();
      if (clearBtn) clearBtn.hidden = false;
      return;
    }
    const html = results
      .map(function (r, idx) {
        return (
          '<button type="button" class="search-result" role="option" data-i="' +
          idx +
          '">' +
          '<span class="search-result-badge">' +
          escapeHtml(r.badge) +
          '</span>' +
          '<span class="search-result-title">' +
          escapeHtml(r.title) +
          '</span>' +
          (r.detail
            ? '<span class="search-result-detail">' + escapeHtml(r.detail.length > 120 ? r.detail.slice(0, 117) + '…' : r.detail) + '</span>'
            : '') +
          '</button>'
        );
      })
      .join('');
    panel.innerHTML = html;
    panel.querySelectorAll('.search-result').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const i = Number(btn.getAttribute('data-i'));
        const item = lastSearchResults[i];
        if (item) navigateSearchResult(item);
      });
    });
    openSearchPanel();
    if (clearBtn) clearBtn.hidden = false;
  }

  async function navigateSearchResult(r) {
    closeSearchPanel();
    const inp = searchInputEl();
    if (inp) inp.blur();

    if (r.type === 'familia') {
      await abrirFamilia(r.id);
      return;
    }
    if (r.type === 'modelo') {
      const familias = await getAllFamilias();
      const f = familias.find(function (x) {
        return x.id === r.familiaId;
      });
      if (!f) return;
      state.familiaId = r.familiaId;
      state.familiaNome = f.nome;
      state.modeloId = state.modeloNome = null;
      showView('modelos');
      await loadModelos();
      requestAnimationFrame(function () {
        const li = document.querySelector('#listModelos li[data-id="' + r.id + '"]');
        if (li) {
          li.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
          li.classList.add('list-row-flash');
          window.setTimeout(function () {
            li.classList.remove('list-row-flash');
          }, 1400);
        }
      });
      return;
    }
    if (r.type === 'documento') {
      const modelos = await getAllModelos();
      const m = modelos.find(function (x) {
        return x.id === r.modeloId;
      });
      if (!m) return;
      const familias = await getAllFamilias();
      const f = familias.find(function (x) {
        return x.id === m.familiaId;
      });
      if (!f) return;
      state.familiaId = m.familiaId;
      state.familiaNome = f.nome;
      state.modeloId = r.modeloId;
      state.modeloNome = m.nome;
      showView('documentos');
      await loadDocumentos();
      requestAnimationFrame(function () {
        const li = document.querySelector('#listDocumentos li[data-id="' + r.id + '"]');
        if (li) {
          li.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
          li.classList.add('list-row-flash');
          window.setTimeout(function () {
            li.classList.remove('list-row-flash');
          }, 1400);
        }
      });
    }
  }

  function initSearch() {
    const inp = searchInputEl();
    const clearBtn = $('searchClear');
    const strip = $('searchStrip');
    if (!inp) return;

    inp.addEventListener('input', function () {
      window.clearTimeout(searchTimer);
      const v = inp.value;
      if (!v.trim()) {
        closeSearchPanel();
        return;
      }
      searchTimer = window.setTimeout(function () {
        runGlobalSearch(v).catch(function () {});
      }, 240);
    });

    inp.addEventListener('focus', function () {
      if (inp.value.trim().length >= 2) {
        runGlobalSearch(inp.value).catch(function () {});
      }
    });

    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        inp.value = '';
        closeSearchPanel();
        inp.focus();
      });
    }

    document.addEventListener('click', function (e) {
      if (!strip || strip.contains(e.target)) return;
      closeSearchPanel();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        if (document.querySelector('.modal.show')) {
          closeAnyOpenModal();
          return;
        }
        if (searchPanelEl() && !searchPanelEl().hidden) {
          closeSearchPanel();
          return;
        }
        return;
      }
      if (e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        if (document.querySelector('.modal.show')) return;
        if (isTypingTarget(e.target)) return;
        e.preventDefault();
        inp.focus();
      }
    });
  }

  async function loadFamilias() {
    const list = $('listFamilias');
    if (!list) return;
    const familias = await getAllFamilias();
    familias.sort(function (a, b) {
      return (a.ordem ?? 999) - (b.ordem ?? 999);
    });
    if (!familias.length) {
      list.innerHTML = emptyListMessage('Nenhuma família ainda. Use “Nova família” para começar.');
      return;
    }
    list.innerHTML = familias
      .map(function (f) {
        return (
          '<li data-id="' +
          f.id +
          '" class="list-row is-clickable" tabindex="0" role="button" aria-label="Abrir ' +
          escapeHtml(f.nome) +
          '">' +
          '<div class="list-row-main">' +
          '<span class="item-title">' +
          escapeHtml(f.nome) +
          '</span>' +
          (f.descricao ? '<div class="item-desc">' + escapeHtml(f.descricao) + '</div>' : '') +
          '</div>' +
          '<div class="item-actions">' +
          '<button type="button" class="btn btn-icon" data-editar-familia="' +
          f.id +
          '">Editar</button>' +
          '<button type="button" class="btn btn-icon danger" data-excluir-familia="' +
          f.id +
          '">Excluir</button>' +
          '</div></li>'
        );
      })
      .join('');
    list.querySelectorAll('[data-editar-familia]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        editarFamilia(Number(btn.getAttribute('data-editar-familia')));
      });
    });
    list.querySelectorAll('[data-excluir-familia]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        excluirFamilia(Number(btn.getAttribute('data-excluir-familia')));
      });
    });
  }

  async function abrirFamilia(id) {
    const familias = await getAllFamilias();
    const f = familias.find(function (x) {
      return x.id === id;
    });
    if (!f) return;
    state.familiaId = id;
    state.familiaNome = f.nome;
    showView('modelos');
    loadModelos();
  }

  async function loadModelos() {
    const list = $('listModelos');
    if (!list || !state.familiaId) return;
    const modelos = await getModelosByFamilia(state.familiaId);
    modelos.sort(function (a, b) {
      return (a.ordem ?? 999) - (b.ordem ?? 999);
    });
    if (!modelos.length) {
      list.innerHTML = emptyListMessage('Nenhum modelo nesta família. Adicione um modelo para anexar documentos.');
      return;
    }
    list.innerHTML = modelos
      .map(function (m) {
        return (
          '<li data-id="' +
          m.id +
          '" class="list-row is-clickable" tabindex="0" role="button" aria-label="Abrir documentos de ' +
          escapeHtml(m.nome) +
          '">' +
          '<div class="list-row-main">' +
          '<span class="item-title">' +
          escapeHtml(m.nome) +
          '</span>' +
          (m.descricao ? '<div class="item-desc">' + escapeHtml(m.descricao) + '</div>' : '') +
          '</div>' +
          '<div class="item-actions">' +
          '<button type="button" class="btn btn-icon" data-editar-modelo="' +
          m.id +
          '">Editar</button>' +
          '<button type="button" class="btn btn-icon danger" data-excluir-modelo="' +
          m.id +
          '">Excluir</button>' +
          '</div></li>'
        );
      })
      .join('');
    list.querySelectorAll('[data-editar-modelo]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        editarModelo(Number(btn.getAttribute('data-editar-modelo')));
      });
    });
    list.querySelectorAll('[data-excluir-modelo]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        excluirModelo(Number(btn.getAttribute('data-excluir-modelo')));
      });
    });
  }

  async function abrirModelo(id) {
    const modelos = await getModelosByFamilia(state.familiaId);
    const m = modelos.find(function (x) {
      return x.id === id;
    });
    if (!m) return;
    state.modeloId = id;
    state.modeloNome = m.nome;
    showView('documentos');
    loadDocumentos();
  }

  async function loadDocumentos() {
    const list = $('listDocumentos');
    if (!list || !state.modeloId) return;
    const docs = await getDocumentosByModelo(state.modeloId);
    docs.sort(function (a, b) {
      return (a.ordem ?? 999) - (b.ordem ?? 999);
    });
    if (!docs.length) {
      list.innerHTML = emptyListMessage('Nenhum documento. Adicione PDFs, imagens ou planilhas.');
      return;
    }
    list.innerHTML = docs
      .map(function (d) {
        let preview = '';
        if (d.mimeType && d.mimeType.indexOf('image/') === 0 && d.fileData) {
          preview = '<div class="doc-preview"><img src="' + d.fileData + '" alt=""></div>';
        } else if (d.fileData) {
          preview =
            '<a href="' +
            d.fileData +
            '" download="' +
            escapeHtml(d.fileName || d.titulo || 'arquivo') +
            '" class="doc-link">Abrir ou baixar</a>';
        }
        return (
          '<li data-id="' +
          d.id +
          '" class="list-row">' +
          '<div class="list-row-main">' +
          '<span class="doc-type">' +
          escapeHtml(d.tipo || 'arquivo') +
          '</span>' +
          '<span class="item-title">' +
          escapeHtml(d.titulo) +
          '</span>' +
          (d.observacoes ? '<div class="item-desc">' + escapeHtml(d.observacoes) + '</div>' : '') +
          preview +
          '</div>' +
          '<div class="item-actions">' +
          '<button type="button" class="btn btn-icon" data-editar-doc="' +
          d.id +
          '">Editar</button>' +
          '<button type="button" class="btn btn-icon danger" data-excluir-doc="' +
          d.id +
          '">Excluir</button>' +
          '</div></li>'
        );
      })
      .join('');
    list.querySelectorAll('[data-editar-doc]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        editarDocumento(Number(btn.getAttribute('data-editar-doc')));
      });
    });
    list.querySelectorAll('[data-excluir-doc]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        excluirDocumento(Number(btn.getAttribute('data-excluir-doc')));
      });
    });
  }

  function openModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
      modal.classList.add('show');
      document.documentElement.classList.add('modal-open');
    }
  }

  function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.remove('show');
    syncModalScrollLock();
  }

  function closeAnyOpenModal() {
    $$('.modal.show').forEach(function (m) {
      m.classList.remove('show');
    });
    syncModalScrollLock();
  }

  function syncModalScrollLock() {
    if (!document.querySelector('.modal.show')) {
      document.documentElement.classList.remove('modal-open');
    }
  }

  $$('[data-close]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      closeModal(btn.getAttribute('data-close'));
    });
  });

  $$('.modal').forEach(function (modal) {
    modal.addEventListener('click', function (e) {
      if (e.target === modal) closeModal(modal.id);
    });
  });

  function setupRowOpen(listId, openFn) {
    const list = $(listId);
    if (!list) return;
    list.addEventListener('click', function (e) {
      if (e.target.closest('button') || e.target.closest('a')) return;
      const li = e.target.closest('li[data-id].is-clickable');
      if (!li) return;
      openFn(Number(li.getAttribute('data-id')));
    });
    list.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const li = e.target.closest('li[data-id].is-clickable');
      if (!li) return;
      e.preventDefault();
      openFn(Number(li.getAttribute('data-id')));
    });
  }

  $('btnNovaFamilia').addEventListener('click', function () {
    $('modalFamiliaTitle').textContent = 'Nova família';
    $('formFamilia').reset();
    $('familiaId').value = '';
    openModal('modalFamilia');
  });

  async function editarFamilia(id) {
    const familias = await getAllFamilias();
    const f = familias.find(function (x) {
      return x.id === id;
    });
    if (!f) return;
    $('modalFamiliaTitle').textContent = 'Editar família';
    $('familiaId').value = String(f.id);
    $('familiaNome').value = f.nome || '';
    $('familiaDesc').value = f.descricao || '';
    openModal('modalFamilia');
  }

  $('formFamilia').addEventListener('submit', async function (e) {
    e.preventDefault();
    const idVal = $('familiaId').value;
    const familia = {
      id: idVal ? Number(idVal) : undefined,
      nome: $('familiaNome').value.trim(),
      descricao: $('familiaDesc').value.trim()
    };
    await saveFamilia(familia);
    closeModal('modalFamilia');
    loadFamilias();
  });

  async function excluirFamilia(id) {
    if (!confirm('Excluir esta família e todo o conteúdo (modelos e documentos)?')) return;
    await deleteFamilia(id);
    if (state.familiaId === id) goto('familias');
    else loadFamilias();
  }

  $('btnNovoModelo').addEventListener('click', function () {
    $('modalModeloTitle').textContent = 'Novo modelo';
    $('formModelo').reset();
    $('modeloId').value = '';
    openModal('modalModelo');
  });

  $('btnVoltarFamilia').addEventListener('click', function () {
    goto('familias');
  });

  async function editarModelo(id) {
    const modelos = await getModelosByFamilia(state.familiaId);
    const m = modelos.find(function (x) {
      return x.id === id;
    });
    if (!m) return;
    $('modalModeloTitle').textContent = 'Editar modelo';
    $('modeloId').value = String(m.id);
    $('modeloNome').value = m.nome || '';
    $('modeloDesc').value = m.descricao || '';
    openModal('modalModelo');
  }

  $('formModelo').addEventListener('submit', async function (e) {
    e.preventDefault();
    const idVal = $('modeloId').value;
    const modelo = {
      id: idVal ? Number(idVal) : undefined,
      familiaId: state.familiaId,
      nome: $('modeloNome').value.trim(),
      descricao: $('modeloDesc').value.trim()
    };
    await saveModelo(modelo);
    closeModal('modalModelo');
    loadModelos();
  });

  async function excluirModelo(id) {
    if (!confirm('Excluir este modelo e todos os documentos?')) return;
    await deleteModelo(id);
    if (state.modeloId === id) {
      state.modeloId = state.modeloNome = null;
      showView('modelos');
      loadModelos();
    } else loadModelos();
  }

  $('btnNovoDocumento').addEventListener('click', function () {
    $('modalDocumentoTitle').textContent = 'Novo documento';
    $('formDocumento').reset();
    $('documentoId').value = '';
    $('documentoArquivo').value = '';
    openModal('modalDocumento');
  });

  $('btnVoltarModelo').addEventListener('click', function () {
    goto('modelos');
  });

  async function editarDocumento(id) {
    const docs = await getDocumentosByModelo(state.modeloId);
    const d = docs.find(function (x) {
      return x.id === id;
    });
    if (!d) return;
    $('modalDocumentoTitle').textContent = 'Editar documento';
    $('documentoId').value = String(d.id);
    $('documentoTitulo').value = d.titulo || '';
    $('documentoTipo').value = d.tipo || 'pdf';
    $('documentoObs').value = d.observacoes || '';
    $('documentoArquivo').value = '';
    openModal('modalDocumento');
  }

  $('formDocumento').addEventListener('submit', async function (e) {
    e.preventDefault();
    const idVal = $('documentoId').value;
    const fileInput = $('documentoArquivo');
    const doc = {
      id: idVal ? Number(idVal) : undefined,
      modeloId: state.modeloId,
      titulo: $('documentoTitulo').value.trim(),
      tipo: $('documentoTipo').value,
      observacoes: $('documentoObs').value.trim()
    };
    if (idVal && !fileInput.files.length) {
      const docs = await getDocumentosByModelo(state.modeloId);
      const existente = docs.find(function (x) {
        return x.id === Number(idVal);
      });
      if (existente && existente.fileData) {
        doc.fileData = existente.fileData;
        doc.fileName = existente.fileName;
        doc.mimeType = existente.mimeType;
      }
    }
    await saveDocumento(doc, fileInput.files[0] || null);
    closeModal('modalDocumento');
    loadDocumentos();
  });

  async function excluirDocumento(id) {
    if (!confirm('Excluir este documento?')) return;
    await deleteDocumento(id);
    loadDocumentos();
  }

  async function init() {
    await openDB();
    renderStartInfo();
    initHero();
    initSearch();
    loadFamilias();
    showView('familias');
    setupRowOpen('listFamilias', abrirFamilia);
    setupRowOpen('listModelos', abrirModelo);
  }

  init();
})();
