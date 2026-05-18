              <div className="biblioteca-relatorios-client-list">
                {buscaBibliotecaRelatoriosCliente.trim() !== '' && bibliotecaFiltrada.length === 0 ? (
                  <p className="biblioteca-relatorios-empty-busca">
                    {(safeT as any)?.bibliotecaRelatoriosSemResultadosBusca ||
                      'Nenhum resultado para esta pesquisa. Tente outro termo.'}
                  </p>
                ) : null}
                {bibliotecaFiltrada.map(({ cliente, equipamentos, despesas: despesasCliente }) => {
                  const txBib = safeT as Record<string, string>
                  const numEquip = equipamentos.length
                  const totalRelatoriosServicoCliente = equipamentos.reduce(
                    (sum, eq) => sum + eq.relatorios.length,
                    0
                  )
                  const totalRelatoriosDespesasCliente = despesasCliente.length
                  const labelEquip = (n: number) =>
                    String(txBib.bibliotecaRelatoriosEquipamentosCount || '{n} equipamento(s)').replace(
                      /\{n\}/g,
                      String(n)
                    )
                  const labelRelEquip = (n: number) =>
                    String(
                      txBib.bibliotecaRelatoriosRelatoriosPorEquip || '{n} relatório(s)'
                    ).replace(/\{n\}/g, String(n))
                  return (
                    <details
                      key={cliente.id}
                      className="biblioteca-relatorios-cliente"
                      open={bibliotecaRelatoriosClientesExpandidos.has(cliente.id)}
                      onToggle={e => {
                        const opened = (e.currentTarget as HTMLDetailsElement).open
                        setBibliotecaRelatoriosClientesExpandidos(prev => {
                          const next = new Set(prev)
                          if (opened) next.add(cliente.id)
                          else next.delete(cliente.id)
                          return next
                        })
                      }}
                    >
                      <summary className="biblioteca-relatorios-cliente__summary">
                        <span className="biblioteca-relatorios-cliente__chevron" aria-hidden>
                          ▸
                        </span>
                        <h3 className="biblioteca-relatorios-cliente__title">{cliente.nomeEmpresa}</h3>
                        <div className="biblioteca-relatorios-cliente__summary-kpis">
                          <span className="bib-kpi bib-kpi--equip" title={labelEquip(numEquip)}>
                            {numEquip} {txBib.bibliotecaRelatoriosLegendaEquipamentos || 'equip.'}
                          </span>
                          <span className="bib-kpi bib-kpi--serv">
                            {totalRelatoriosServicoCliente}{' '}
                            {txBib.bibliotecaRelatoriosLegendaServico ?? txBib.relatoriosServicoShort ?? 'serv.'}
                          </span>
                          <span className="bib-kpi bib-kpi--desp">
                            {totalRelatoriosDespesasCliente}{' '}
                            {txBib.bibliotecaRelatoriosLegendaDespesas ?? 'desp.'}
                          </span>
                        </div>
                      </summary>

                      <div className="biblioteca-relatorios-cliente__body">
                        <div className="biblioteca-relatorios-cliente__body-toolbar">
                          <span className="biblioteca-relatorios-cliente__body-toolbar-label">
                            {txBib.relatoriosServicoTitle || 'Relatórios de Serviço'}
                          </span>
                          <button
                            type="button"
                            className="biblioteca-relatorios-cliente__delete"
                            onClick={e => {
                              e.preventDefault()
                              e.stopPropagation()
                              handleDeleteCliente(cliente.id)
                            }}
                            title={txBib.excluirPastaBiblioteca || 'Excluir pasta (e cliente)'}
                          >
                            {txBib.excluirPasta || 'Excluir pasta'}
                          </button>
                        </div>

                        {equipamentos.length === 0 ? (
                          <p className="biblioteca-relatorios-muted">
                            {txBib.bibliotecaRelatoriosSemEquipamentos ||
                              'Nenhum equipamento registado neste cliente.'}
                          </p>
                        ) : (
                          <div className="biblioteca-relatorios-equip-list">
                            {equipamentos.map(({ equipamento, equipamentoKey, relatorios }) => {
                              const eqKey = bibliotecaEquipKey(cliente.id, equipamentoKey)
                              const eqLabel = [equipamento.modelo, equipamento.marca]
                                .filter(Boolean)
                                .join(' ')
                                .trim()
                              return (
                                <details
                                  key={eqKey}
                                  className={
                                    'biblioteca-relatorios-equip' +
                                    (relatorios.length === 0
                                      ? ' biblioteca-relatorios-equip--vazio'
                                      : '')
                                  }
                                  open={bibliotecaRelatoriosEquipExpandidos.has(eqKey)}
                                  onToggle={e => {
                                    const opened = (e.currentTarget as HTMLDetailsElement).open
                                    setBibliotecaRelatoriosEquipExpandidos(prev => {
                                      const next = new Set(prev)
                                      if (opened) next.add(eqKey)
                                      else next.delete(eqKey)
                                      return next
                                    })
                                  }}
                                >
                                  <summary className="biblioteca-relatorios-equip__summary">
                                    <span className="biblioteca-relatorios-equip__chev" aria-hidden>
                                      ▸
                                    </span>
                                    <span className="biblioteca-relatorios-equip__nome">
                                      {eqLabel || equipamentoKey}
                                    </span>
                                    {equipamento.numeroSerie ? (
                                      <span className="biblioteca-relatorios-equip__ns">
                                        {equipamento.numeroSerie}
                                      </span>
                                    ) : null}
                                    <span
                                      className="biblioteca-relatorios-equip__badge"
                                      title={labelRelEquip(relatorios.length)}
                                    >
                                      {labelRelEquip(relatorios.length)}
                                    </span>
                                  </summary>
                                  {relatorios.length === 0 ? (
                                    <p className="biblioteca-relatorios-muted biblioteca-relatorios-muted--indent">
                                      {txBib.bibliotecaRelatoriosEquipamentoSemRelatorios ||
                                        'Sem relatórios neste equipamento.'}
                                    </p>
                                  ) : (
                                    <div className="biblioteca-relatorios-tabela-wrap">
                                      <table className="biblioteca-relatorios-tabela">
                                        <thead>
                                          <tr>
                                            <th>{txBib.relatorioNumeroLabel || 'Rel.'}</th>
                                            <th>{txBib.tipoServico || 'Tipo'}</th>
                                            <th>{txBib.data || 'Data'}</th>
                                            <th>{txBib.tecnico || 'Técnico'}</th>
                                            <th className="bib-col-num">H</th>
                                            <th className="bib-col-num">KM</th>
                                            <th className="bib-col-acoes">{txBib.acoes || 'Ações'}</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {relatorios.map((relatorio, relIndex) => {
                                            const totais = calcularTotais(relatorio.diasTrabalho)
                                            const dataFormatada = new Date(
                                              relatorio.data
                                            ).toLocaleDateString('pt-PT', {
                                              day: '2-digit',
                                              month: '2-digit',
                                              year: 'numeric',
                                            })
                                            return (
                                              <tr key={`${eqKey}-${relatorio.id}-${relIndex}`}>
                                                <td className="bib-col-num">
                                                  <span className="bib-rel-num">{relatorio.numero}</span>
                                                  {relatorio.servicoConcluido ? (
                                                    <span className="bib-tag-ok" title="Concluído">
                                                      OK
                                                    </span>
                                                  ) : null}
                                                </td>
                                                <td>{relatorio.tipoServico || '—'}</td>
                                                <td>{dataFormatada}</td>
                                                <td>{relatorio.tecnico || '—'}</td>
                                                <td className="bib-col-num">{totais.horasTrabalho}h</td>
                                                <td className="bib-col-num">{totais.kmsPercorridos}</td>
                                                <td className="bib-col-acoes">
                                                  <div className="bib-acoes-icones">
                                                    <button
                                                      type="button"
                                                      className="bib-acao bib-acao--ver"
                                                      title={safeT?.view || 'Ver'}
                                                      onClick={() =>
                                                        setViewingRelatorioServico(
                                                          resolverRelatorioServicoDono(relatorio)
                                                        )
                                                      }
                                                    >
                                                      Ver
                                                    </button>
                                                    <button
                                                      type="button"
                                                      className="bib-acao bib-acao--pdf"
                                                      title={safeT?.gerarPDF || 'PDF'}
                                                      onClick={() => handlePrintRelatorio(relatorio)}
                                                    >
                                                      PDF
                                                    </button>
                                                    <button
                                                      type="button"
                                                      className="bib-acao bib-acao--del"
                                                      title={safeT?.delete || 'Excluir'}
                                                      onClick={() =>
                                                        handleDeleteRelatorioServico(relatorio.id, {
                                                          clienteId: cliente.id,
                                                          equipamentoKey,
                                                          indexInEquipamento: relIndex,
                                                        })
                                                      }
                                                    >
                                                      ×
                                                    </button>
                                                  </div>
                                                </td>
                                              </tr>
                                            )
                                          })}
                                        </tbody>
                                      </table>
                                    </div>
                                  )}
                                </details>
                              )
                            })}
                          </div>
                        )}

                        <div className="biblioteca-relatorios-cliente__despesas-block">
                          <h4 className="biblioteca-relatorios-cliente__section-label">
                            {txBib.relatoriosDespesasTitle || 'Relatórios de Despesas'}
                            <span className="biblioteca-relatorios-cliente__section-count">
                              ({totalRelatoriosDespesasCliente})
                            </span>
                          </h4>
                          {despesasCliente.length === 0 ? (
                            <p className="biblioteca-relatorios-muted">
                              {txBib.nenhumRelatorioDespesas || 'Nenhum fechamento de despesas'}
                            </p>
                          ) : (
                            <div className="biblioteca-relatorios-tabela-wrap">
                              <table className="biblioteca-relatorios-tabela biblioteca-relatorios-tabela--desp">
                                <thead>
                                  <tr>
                                    <th>{txBib.relatorioNumeroLabel || 'Rel.'}</th>
                                    <th>{txBib.maquinaModelo || 'Equipamento'}</th>
                                    <th>{txBib.total || 'Total'}</th>
                                    <th className="bib-col-acoes">{txBib.acoes || 'Ações'}</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {despesasCliente.map(({ relatorio, itens }) => {
                                    const itensDespesasVisiveis = filtrarFechamentoItensPorOmitidos(
                                      fechamentoItensOmitidosPorRelatorio,
                                      relatorio.id,
                                      itens
                                    )
                                    const totalCobranca = totaisFechamentoLiquidoComIva(
                                      itensDespesasVisiveis,
                                      fechamentoIvaPorRelatorioId[relatorio.id]
                                    ).comIva
                                    return (
                                      <tr key={relatorio.id}>
                                        <td className="bib-col-num">{relatorio.numero}</td>
                                        <td>{relatorio.maquinaModelo || '—'}</td>
                                        <td className="bib-col-num">€{totalCobranca.toFixed(2)}</td>
                                        <td className="bib-col-acoes">
                                          <div className="bib-acoes-icones">
                                            <button
                                              type="button"
                                              className="bib-acao bib-acao--ver"
                                              title={txBib.visualizarDespesasBiblioteca ?? safeT?.view ?? 'Ver'}
                                              onClick={() =>
                                                setModalVisualizarDespesasBiblioteca({
                                                  relatorio,
                                                  itens: itensDespesasVisiveis,
                                                })
                                              }
                                            >
                                              Ver
                                            </button>
                                            <button
                                              type="button"
                                              className="bib-acao bib-acao--edit"
                                              title={txBib.editarRelatorioDespesas ?? safeT?.edit ?? 'Editar'}
                                              onClick={() => handleEditarDespesasNaBiblioteca(relatorio.id)}
                                            >
                                              Ed.
                                            </button>
                                            <button
                                              type="button"
                                              className="bib-acao bib-acao--pdf"
                                              title={txBib.gerarPDF || 'PDF'}
                                              onClick={() =>
                                                imprimirPDFDespesasDaBiblioteca(
                                                  relatorio,
                                                  itensDespesasVisiveis
                                                )
                                              }
                                            >
                                              PDF
                                            </button>
                                            <button
                                              type="button"
                                              className="bib-acao bib-acao--del"
                                              title={safeT?.delete || 'Excluir'}
                                              onClick={() => handleDeleteFechamentoRelatorio(relatorio.id)}
                                            >
                                              ×
                                            </button>
                                          </div>
                                        </td>
                                      </tr>
                                    )
                                  })}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      </div>
                    </details>
                  )
                })}
              </div>
