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
    $('#fun').innerHTML = graficoFunil(ETAPAS.map((e, i) => ({ rotulo: e, pct: clientes.filter(c => c.etapa >= i).length / total * 100 })));
  }

  $('#fc').onchange = desenhar;
  $('#fl').onchange = desenhar;
  desenhar();
  aoMudarBanco(desenhar); // vendas registradas em outra aba atualizam o painel
});
