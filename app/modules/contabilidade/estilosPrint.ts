/** CSS das janelas de impressão/PDF (contabilidade) — `viewport` + tabelas com scroll + botões em coluna no telemóvel */
export const CONTAB_PRINT_WINDOW_STYLES = `
@page{size:A4;margin:10mm}
html{-webkit-text-size-adjust:100%;text-size-adjust:100%}
body{
  font-family:Segoe UI,Arial,sans-serif;
  margin:0;
  box-sizing:border-box;
  max-width:100%;
  width:100%;
  background:#fff;
  color:#222;
  font-size:14px;
  line-height:1.45;
  padding:max(10px,env(safe-area-inset-top,0px)) max(10px,env(safe-area-inset-right,0px)) max(12px,env(safe-area-inset-bottom,0px)) max(10px,env(safe-area-inset-left,0px));
}
.contab-dica{
  margin:0 0 12px;
  padding:12px 12px;
  background:#e3f2fd;
  border:1px solid #90caf9;
  border-radius:8px;
  font-size:12px;
  line-height:1.5;
  color:#0d47a1;
  white-space:pre-wrap;
  word-break:break-word;
  overflow-wrap:break-word;
  max-width:100%;
  box-sizing:border-box
}
.contab-actions{
  display:flex;
  flex-direction:row;
  flex-wrap:wrap;
  gap:10px;
  align-items:stretch;
  margin-bottom:16px
}
.contab-actions button,
.contab-actions a{
  flex:1 1 auto;
  min-height:48px;
  min-width:0;
  -webkit-tap-highlight-color:transparent;
  box-sizing:border-box
}
@media (max-width: 600px){
  body{ font-size:13px; padding:10px 8px 14px }
  .contab-dica{ font-size:11px; padding:10px 8px; margin-bottom:10px }
  .contab-actions{ flex-direction:column; flex-wrap:nowrap; gap:8px; margin-bottom:12px }
  .contab-actions > button,
  .contab-actions > a{
    width:100% !important;
    flex:0 0 auto;
    text-align:center;
    justify-content:center;
    padding:14px 10px;
    font-size:14px
  }
  .contab-h-title{ font-size:17px !important }
  .contab-h-sub{ font-size:12px !important }
}
.contab-scroll{
  width:100%;
  max-width:100%;
  overflow-x:auto;
  -webkit-overflow-scrolling:touch;
  margin:0 0 12px;
  box-sizing:border-box
}
table.contab-items-table{ min-width:640px }
table.contab-client-tbl{ min-width: 100% }
.contab-info-card{ word-wrap:break-word; overflow-wrap:break-word; box-sizing:border-box; max-width:100% }
.contab-fiscal{ word-wrap:break-word; box-sizing:border-box; max-width:100% }
@media print{
  .no-print{ display:none !important }
  body{ padding:10px }
  .contab-scroll{ overflow:visible }
}
`
