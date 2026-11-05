/* TELA: GAMIFICACAO
 * Responsabilidade: Calcula pontuações, ranking e elementos de gamificação.
 * Contém a lógica específica desta tela.
 */
/* gamificacao.js — Gamificação/Metas do supervisor e do gestor. */

pagina(() => {
  const consultores = consultoresVisiveis();
  const ids = consultores.map(u => u.id);
  const metaDe = id => BD.metas.find(m => m.usuario_id === id) || { minimo: 0, desafio: 0 };

  // Lista de consultores no formulário.
  $('#mn').innerHTML = '<option value="">Nome do consultor...</option>' + consultores.map(u => `<option value="${u.id}">${esc(u.nome)}</option>`).join('');
  // Período salvo no banco (vale para todos os supervisores).
  $('#pi').value = BD.config.periodo.inicio;
  $('#pf').value = BD.config.periodo.fim;

  function desenhar() {
    const { inicio, fim } = BD.config.periodo;
    // Vendas dentro do período escolhido.
    const vendas = BD.vendas.filter(v => ids.includes(v.consultor_id) && v.data >= inicio && v.data <= fim);
    const feito = id => vendas.filter(v => v.consultor_id === id).reduce((s, v) => s + v.valor, 0);

    // Tabela de metas: clicar numa linha coloca os valores no formulário para editar.
    $('#tb').innerHTML = consultores.map(u => {
      const m = metaDe(u.id);
      return `<tr data-id="${u.id}"><td>${esc(u.nome)}</td><td class="v">${brl(m.minimo)}</td><td class="v">${brl(m.desafio)}</td><td class="v">${brl(feito(u.id))}</td></tr>`;
    }).join('');
    $$('#tb tr').forEach(tr => tr.onclick = () => {
      const m = metaDe(+tr.dataset.id);
      $('#mn').value = tr.dataset.id; $('#mm').value = m.minimo; $('#md').value = m.desafio;
      $('#mm').focus();
    });

    // Barra "Valores já realizados": total vendido x soma das metas mínimas.
    const real = vendas.reduce((s, v) => s + v.valor, 0);
    const tot = consultores.reduce((s, u) => s + metaDe(u.id).minimo, 0);
    const pc = tot ? Math.min(Math.round(real / tot * 100), 100) : 0;
    $('#al').textContent = brl(real);
    $('#fa').textContent = brl(Math.max(tot - real, 0));
    $('#pc').textContent = pc + '% da meta';
    $('#mt').textContent = 'Meta da equipe: ' + brl(tot);
    setTimeout(() => $('#pb').style.width = pc + '%', 30); // anima a barra

    // Projeção: o que já foi vendido + ritmo diário dos últimos 30 dias x dias que faltam no período.
    const dia = 864e5, fi = new Date(fim + 'T23:59');
    const ritmo = BD.vendas.filter(v => ids.includes(v.consultor_id) && diasDesde(v.data) <= 30).reduce((s, v) => s + v.valor, 0) / 30;
    const faltam = Math.max((fi - Date.now()) / dia, 0);
    $('#pj').textContent = brl(real + ritmo * faltam);

    negociacoes();
    atencao(vendas);
  }

  // Gráfico de áreas dos últimos 5 meses: clientes negociando, que desistiram e vendas fechadas (com link de pagamento).
  function negociacoes() {
    const meses = [4, 3, 2, 1, 0].map(n => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - n); return isoData(d).slice(0, 7); });
    const cli = BD.clientes.filter(c => ids.includes(c.consultor_id));
    const series = [
      meses.map(m => cli.filter(c => mesDe(c.criado_em) === m && c.etapa > 0 && c.etapa < 5 && c.categoria !== 1).length),
      meses.map(m => cli.filter(c => mesDe(c.criado_em) === m && c.categoria === 1).length),
      meses.map(m => BD.vendas.filter(v => ids.includes(v.consultor_id) && mesDe(v.data) === m).length)
    ];
    const W = 300, H = 170, ml = 26, mb = 20, alt = H - mb - 6;
    const max = escala(Math.max(...series.flat()));
    const x = i => ml + (W - ml - 8) * i / 4, y = v => 6 + alt - alt * v / max;
    let s = '';
    for (let i = 0; i <= 4; i++) s += `<line x1="${ml}" x2="${W}" y1="${y(max * i / 4)}" y2="${y(max * i / 4)}" class="gl"/><text x="${ml - 4}" y="${y(max * i / 4) + 4}" text-anchor="end">${max * i / 4}</text>`;
    // Desenha a maior série atrás e a menor na frente.
    const cores = ['#6ae6ec', '#41b6d8', '#2c8abf'];
    [2, 0, 1].forEach(k => {
      const pts = series[k].map((v, i) => `${x(i)},${y(v)}`).join(' L');
      s += `<path d="M${x(0)},${y(0)} L${pts} L${x(4)},${y(0)}Z" fill="${cores[k]}" opacity=".8"/>`;
    });
    meses.forEach((m, i) => s += `<text x="${x(i)}" y="${H - 4}" text-anchor="middle">${MESES[+m.slice(5) - 1].slice(0, 3)}</text>`);
    $('#neg').innerHTML = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Negociações por mês">${s}</svg>`;
  }

  // Pontos de atenção calculados a partir dos números de cada consultor.
  function atencao(vendas) {
    const semana = BD.ligacoes.filter(l => diasDesde(l.criado_em) <= 7);
    const ticketGeral = vendas.length ? vendas.reduce((s, v) => s + v.valor, 0) / vendas.length : 0;
    const pontos = [];
    consultores.forEach(u => {
      const minhas = vendas.filter(v => v.consultor_id === u.id);
      const valor = minhas.reduce((s, v) => s + v.valor, 0);
      const m = metaDe(u.id);
      if (semana.filter(l => l.usuario_id === u.id).length < 5) pontos.push([u, 'Queda nas ligações', '']);
      if (minhas.length && valor / minhas.length < ticketGeral * 0.75) pontos.push([u, 'Ticket muito abaixo', '']);
      if (m.minimo && valor < m.minimo * 0.5) pontos.push([u, 'Poucas vendas', '']);
      else if (m.minimo && valor < m.minimo) pontos.push([u, `Faltam ${brl(m.minimo - valor)} para a meta`, 'o']);
    });
    $('#at').innerHTML = pontos.map(p => `<div class="at"><div class="av">${P}</div>${esc(p[0].nome.split(' ')[0])}<em class="${p[2]}">${esc(p[1])}</em></div>`).join('')
      || '<div class="at"><div class="av">' + P + '</div>Equipe<em class="ok">Tudo certo! Metas em dia.</em></div>';
  }

  // Salvar meta: cria ou atualiza a meta do consultor escolhido.
  $('#mf').onsubmit = e => {
    e.preventDefault();
    const id = +$('#mn').value, campos = { minimo: +$('#mm').value, desafio: +$('#md').value };
    const m = BD.metas.find(x => x.usuario_id === id);
    if (m) Object.assign(m, campos); else BD.metas.push({ usuario_id: id, ...campos });
    salvarBanco();
    aviso('Meta de ' + nomeUsuario(id) + ' salva!');
    e.target.reset();
    desenhar();
  };

  // Mudar o período recalcula tudo e salva no banco.
  [$('#pi'), $('#pf')].forEach(inp => inp.onchange = () => {
    if (!$('#pi').value || !$('#pf').value || $('#pi').value > $('#pf').value) { aviso('Período inválido.'); return; }
    BD.config.periodo = { inicio: $('#pi').value, fim: $('#pf').value };
    salvarBanco();
    desenhar();
  });

  desenhar();
  aoMudarBanco(desenhar);
});
