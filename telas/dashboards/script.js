/* TELA: DASHBOARDS
 * Responsabilidade: Monta indicadores, filtros e gráficos para supervisão e gestão.
 * Contém a lógica específica desta tela.
 */
/* dashboards.js — Dashboards do supervisor (sua equipe) e do gestor (todas as equipes). */

pagina(() => {
  const consultores = consultoresVisiveis();

  // Filtro "Consultor": todos ou um só. O gestor vê os consultores agrupados por equipe.
  const opc = u => `<option value="${u.id}">${esc(u.nome)}</option>`;
  $('#fc').innerHTML = '<option value="">Consultor: todos</option>' + (EU.perfil === 'gestor'
    ? BD.equipes.map(e => `<optgroup label="${esc(e.nome)}">${consultores.filter(u => u.equipe_id === e.id).map(opc).join('')}</optgroup>`).join('')
    : consultores.map(opc).join(''));
  // Filtro "Lead": de onde o cliente veio.
  $('#fl').innerHTML = '<option value="">Lead: todos</option>' + ORIGENS.map(o => `<option>${o}</option>`).join('');

  let estado = null; // o que está na tela agora (usado pelo botão "Analisar com IA")

  function desenhar() {
    const fc = +$('#fc').value || 0, fl = $('#fl').value;
    // Consultores considerados (todos os visíveis ou só o escolhido).
    const sel = fc ? consultores.filter(u => u.id === fc) : consultores;
    const ids = sel.map(u => u.id);
    const vendas = BD.vendas.filter(v => ids.includes(v.consultor_id) && (!fl || v.origem === fl));
    const clientes = BD.clientes.filter(c => ids.includes(c.consultor_id) && (!fl || c.origem === fl));

    // Faturamento do mês atual.
    const doMes = vendas.filter(v => mesDe(v.data) === mesAtual());
    $('#ftTit').textContent = fc ? 'Faturamento do Consultor' : EU.perfil === 'gestor' ? 'Faturamento da Empresa' : 'Faturamento da Equipe';
    $('#ft').textContent = brlCurto(doMes.reduce((s, v) => s + v.valor, 0));
    $('#ftSub').textContent = `${MESES[new Date().getMonth()]} · ${doMes.length} vendas`;

    // Conversão: número de vendas por financeira, mês atual x mês passado.
    $('#gConv').innerHTML = graficoColunas(BD.fornecedores.map(f => ({
      rotulo: f.nome,
      valores: [mesAtual(), mesAnterior()].map(m => vendas.filter(v => v.fornecedor_id === f.id && mesDe(v.data) === m).length)
    })), ['#6ae6ec', '#41b6d8']);

    // Tempo médio das ligações atendidas (minutos), manual x automática, por consultor.
    const media = l => l.length ? l.reduce((s, x) => s + x.duracao, 0) / l.length : 0;
    $('#gTempo').innerHTML = graficoBarras(sel.slice(0, 8).map(u => {
      const at = BD.ligacoes.filter(l => l.usuario_id === u.id && l.status === 'Atendeu');
      return { rotulo: u.nome.split(' ')[0], valores: [media(at.filter(l => l.tipo === 'manual')), media(at.filter(l => l.tipo === 'automatica'))].map(v => Math.round(v * 10) / 10) };
    }), ['#6ae6ec', '#41b6d8'], v => v + ' min');

    // Funil: % dos clientes que chegaram a cada etapa (ou passaram dela).
    const total = clientes.length || 1;
    estado = { fc, fl, sel, vendas, clientes };
    $('#fun').innerHTML = graficoFunil(ETAPAS.map((e, i) => ({ rotulo: e, pct: clientes.filter(c => c.etapa >= i).length / total * 100 })));
  }

  /* ---------- Análise da IA ---------- */
  // Junta os números do painel (já filtrados) num resumo. Só vão totais e nomes próprios dos consultores.
  function resumoParaIA() {
    const { fc, fl, sel, vendas, clientes } = estado;
    const soma = l => l.reduce((t, v) => t + v.valor, 0);
    const doMes = vendas.filter(v => mesDe(v.data) === mesAtual());
    const doAnt = vendas.filter(v => mesDe(v.data) === mesAnterior());
    const total = clientes.length || 1;
    const media = l => l.length ? l.reduce((t, x) => t + x.duracao, 0) / l.length : 0;
    return {
      escopo: fc ? 'Um consultor' : EU.perfil === 'gestor' ? 'Empresa (todas as equipes)' : 'Equipe do supervisor',
      lead: fl || 'todos', mes: MESES[new Date().getMonth()], dia_do_mes: new Date().getDate(),
      faturamento_mes: soma(doMes), vendas_mes: doMes.length, faturamento_mes_anterior: soma(doAnt), vendas_mes_anterior: doAnt.length,
      funil: ETAPAS.map((e, i) => ({ etapa: e, pct: Math.round(clientes.filter(c => c.etapa >= i).length / total * 100) })),
      financeiras: BD.fornecedores.map(f => ({ financeira: f.nome, mes: vendas.filter(v => v.fornecedor_id === f.id && mesDe(v.data) === mesAtual()).length, mes_anterior: vendas.filter(v => v.fornecedor_id === f.id && mesDe(v.data) === mesAnterior()).length })),
      ligacoes: sel.slice(0, 12).map(u => {
        const at = BD.ligacoes.filter(l => l.usuario_id === u.id && l.status === 'Atendeu');
        return { consultor: u.nome.split(' ')[0], manual: media(at.filter(l => l.tipo === 'manual')), automatica: media(at.filter(l => l.tipo === 'automatica')) };
      }),
      consultores: sel.slice(0, 12).map(u => {
        const m = BD.metas.find(x => x.usuario_id === u.id) || { minimo: 0, desafio: 0 };
        const meus = doMes.filter(v => v.consultor_id === u.id);
        return { nome: u.nome.split(' ')[0], vendas_mes: meus.length, faturamento_mes: soma(meus), meta_minima: m.minimo, meta_desafio: m.desafio };
      })
    };
  }

  $('#bIA').onclick = async () => {
    const dados = resumoParaIA(), b = $('#bIA'), box = $('#iaBox');
    b.disabled = true; b.textContent = 'Analisando...';
    let o;
    try { o = await pedirIA('dashboard', dados); }
    catch (e) { o = dashLocal(dados); aviso('IA indisponível agora: mostrando a análise automática.'); }
    box.innerHTML = htmlDash(o); box.hidden = false; $('#iaDica').hidden = true;
    b.disabled = false; b.textContent = 'Analisar de novo';
  };
  // Mudou o filtro ou chegou venda nova: a análise anterior fica velha, então some.
  const limparIA = () => { $('#iaBox').hidden = true; $('#iaDica').hidden = false; $('#bIA').textContent = 'Analisar com IA'; };

  $('#fc').onchange = () => { limparIA(); desenhar(); };
  $('#fl').onchange = () => { limparIA(); desenhar(); };
  desenhar();
  aoMudarBanco(() => { limparIA(); desenhar(); }); // vendas registradas em outra aba atualizam o painel
});
