(function (global) {
  "use strict";

  function uid() {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
  }

  function esc(s) {
    return String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function fmtDatePt(iso) {
    if (!iso) return "-";
    try {
      const d = new Date(iso.includes("T") ? iso : iso + "T12:00:00");
      if (Number.isNaN(d.getTime())) return iso;
      const loc =
        (global.NCampoI18n && global.NCampoI18n.localeTag && global.NCampoI18n.localeTag()) || "pt-BR";
      return d.toLocaleDateString(loc);
    } catch {
      return iso;
    }
  }

  function todayIso() {
    return new Date().toISOString().slice(0, 10);
  }

  function calcularDuracao(horaInicio, horaFim) {
    if (!horaInicio || !horaFim) return "";
    try {
      const [hInicio, mInicio] = horaInicio.split(":").map(Number);
      const [hFim, mFim] = horaFim.split(":").map(Number);
      let diff = hFim * 60 + mFim - (hInicio * 60 + mInicio);
      if (diff < 0) diff += 24 * 60;
      return `${Math.floor(diff / 60)}:${String(diff % 60).padStart(2, "0")}`;
    } catch {
      return "";
    }
  }

  function atualizarCalculosDia(dia) {
    let idaDuracao = dia.idaDuracao;
    if (dia.idaHora && dia.idaChegada) idaDuracao = calcularDuracao(dia.idaHora, dia.idaChegada);

    let retornoDuracao = dia.retornoDuracao;
    if (dia.retornoSaida && dia.retornoChegada) retornoDuracao = calcularDuracao(dia.retornoSaida, dia.retornoChegada);

    let horasDuracao = dia.horasDuracao;
    if (dia.horasInicio && dia.horasFim) {
      horasDuracao = calcularDuracao(dia.horasInicio, dia.horasFim);
      const pausa = dia.tempoPausa || dia.pausa;
      if (pausa && String(pausa).includes(":")) {
        try {
          const [hP, mP] = String(pausa).split(":").map(Number);
          const pausaMin = (hP || 0) * 60 + (mP || 0);
          const [hD, mD] = horasDuracao.split(":").map(Number);
          let durMin = (hD || 0) * 60 + (mD || 0) - pausaMin;
          if (durMin < 0) durMin = 0;
          horasDuracao = `${Math.floor(durMin / 60)}:${String(durMin % 60).padStart(2, "0")}`;
        } catch (_) {}
      }
    }

    const kmIda = parseFloat(dia.kmIda) || 0;
    const kmRetorno = parseFloat(dia.kmRetorno) || 0;
    return { ...dia, idaDuracao, retornoDuracao, horasDuracao, kmTotal: String(kmIda + kmRetorno) };
  }

  function calcularTotais(dias) {
    const lista = Array.isArray(dias) ? dias : [];
    let totalHorasTrabalho = 0;
    let totalKms = 0;
    let totalHorasViagem = 0;
    let totalHorasViagemIda = 0;
    let totalHorasViagemRetorno = 0;
    let totalPausa = 0;

    lista.forEach((dia) => {
      const d = atualizarCalculosDia(dia);
      if (d.horasDuracao) {
        const p = d.horasDuracao.split(":");
        if (p.length === 2) totalHorasTrabalho += (parseInt(p[0], 10) || 0) * 60 + (parseInt(p[1], 10) || 0);
      }
      const pausaRaw = d.tempoPausa || d.pausa;
      if (pausaRaw && String(pausaRaw).includes(":")) {
        const pp = String(pausaRaw).split(":");
        if (pp.length === 2) totalPausa += (parseInt(pp[0], 10) || 0) * 60 + (parseInt(pp[1], 10) || 0);
      }
      if (d.idaDuracao) {
        const p = d.idaDuracao.split(":");
        if (p.length === 2) {
          const m = (parseInt(p[0], 10) || 0) * 60 + (parseInt(p[1], 10) || 0);
          totalHorasViagemIda += m;
          totalHorasViagem += m;
        }
      }
      if (d.retornoDuracao) {
        const p = d.retornoDuracao.split(":");
        if (p.length === 2) {
          const m = (parseInt(p[0], 10) || 0) * 60 + (parseInt(p[1], 10) || 0);
          totalHorasViagemRetorno += m;
          totalHorasViagem += m;
        }
      }
      totalKms += parseFloat(d.kmTotal) || 0;
    });

    totalHorasTrabalho = Math.max(0, totalHorasTrabalho - totalPausa);
    const fmt = (min) => `${Math.floor(min / 60)}:${String(min % 60).padStart(2, "0")}`;
    return {
      horasTrabalho: fmt(totalHorasTrabalho),
      kmsPercorridos: totalKms.toFixed(2),
      horasViagem: fmt(totalHorasViagem),
      horasViagemIda: fmt(totalHorasViagemIda),
      horasViagemRetorno: fmt(totalHorasViagemRetorno),
    };
  }

  function diaTrabalhoVazio() {
    return {
      id: uid(),
      data: todayIso(),
      idaHora: "",
      idaChegada: "",
      idaDuracao: "",
      horasInicio: "",
      horasFim: "",
      horasDuracao: "",
      retornoSaida: "",
      retornoChegada: "",
      retornoDuracao: "",
      kmIda: "",
      kmRetorno: "",
      kmTotal: "",
      pausa: "",
      tempoPausa: "",
      descricaoTrabalho: "",
    };
  }

  function relatorioVazio() {
    return {
      id: uid(),
      numero: "",
      tecnico: "",
      cliente: "",
      cidade: "",
      telefone: "",
      data: todayIso(),
      maquinaModelo: "",
      numeroMaquina: "",
      tipoServico: "",
      diasTrabalho: [diaTrabalhoVazio()],
      servicoConcluido: false,
      retornoNecessario: false,
      observacoes: "",
      assinaturaCliente: "",
      dataAssinaturaCliente: "",
      assinaturaTecnico: "",
      dataAssinaturaTecnico: "",
      pecasSubstituicao: [],
    };
  }

  function gerarNumeroRelatorio(relatorios, dataIso) {
    const d = (dataIso || todayIso()).slice(0, 10).replace(/-/g, "");
    const doDia = (relatorios || []).filter((r) => String(r.data || "").slice(0, 10).replace(/-/g, "") === d);
    const seq = doDia.length + 1;
    return `${d}-${String(seq).padStart(3, "0")}`;
  }

  function normalizeGestaoImport(raw) {
    if (!raw || typeof raw !== "object") throw new Error("invalid");
    const out = {
      logo: null,
      servicoGrupos: [],
      servicos: [],
      relatorios: [],
      despesasDocs: [],
      cartoes: [],
    };
    if (raw.version === 1 && raw.app === "nonato-campo-app") return raw;
    if (Array.isArray(raw.servicoGrupos)) out.servicoGrupos = raw.servicoGrupos;
    if (Array.isArray(raw.servicos)) out.servicos = raw.servicos;
    if (Array.isArray(raw.relatorios)) out.relatorios = raw.relatorios;
    if (Array.isArray(raw.despesasDocs)) out.despesasDocs = raw.despesasDocs;
    if (Array.isArray(raw.cartoes)) out.cartoes = raw.cartoes;
    if (raw.logo) out.logo = raw.logo;
    if (Array.isArray(raw.familias)) return out;
    const map = {
      "nonato-servicos-grupos": "servicoGrupos",
      "nonato-servicos": "servicos",
      "nonato-relatorios-servico": "relatorios",
      "nonato-despesas-documentos": "despesasDocs",
      "nonato-cartoes-empresa-despesas": "cartoes",
    };
    Object.entries(map).forEach(([k, field]) => {
      if (Array.isArray(raw[k])) out[field] = raw[k];
    });
    if (raw["nonato-logos-relatorios"] && Array.isArray(raw["nonato-logos-relatorios"]) && raw["nonato-logos-relatorios"][0]) {
      const L = raw["nonato-logos-relatorios"][0];
      if (L.dataUrl) out.logo = { dataUrl: L.dataUrl, nome: L.nome || "Logo" };
    }
    if (raw["nonato-logo"] && typeof raw["nonato-logo"] === "string") {
      out.logo = { dataUrl: raw["nonato-logo"], nome: "Logo Gestão" };
    }
    return out;
  }

  function telefoneDigitsParaWa(telefone) {
    const d = String(telefone || "").replace(/\D/g, "");
    if (d.length >= 10 && d.length <= 15) return d;
    if (d.length === 9) return "351" + d;
    return d.length >= 9 ? d : "";
  }

  global.NCampoUtils = {
    uid,
    esc,
    fmtDatePt,
    todayIso,
    calcularDuracao,
    atualizarCalculosDia,
    calcularTotais,
    diaTrabalhoVazio,
    relatorioVazio,
    gerarNumeroRelatorio,
    normalizeGestaoImport,
    telefoneDigitsParaWa,
  };
})(typeof window !== "undefined" ? window : globalThis);
