/* TELA: FINANCEIRO
 * Responsabilidade: Apresenta faturamento, taxas, fornecedores e chargebacks.
 * Contém a lógica específica desta tela.
 */
/* financeiro.js — Home do setor financeiro: chargebacks, evolução do faturamento e ranking de vendas. */

pagina(() => {
  // Filtro "Supervisor": mostra só a equipe daquele supervisor.
  const sups = BD.usuarios.filter(u => u.perfil === 'supervisor');
  $('#fs').innerHTML = '<option value="">Supervisor: todos</option>' + sups.map(s => `<option value="${s.equipe_id}">${esc(s.nome)} (${esc(nomeEquipe(s.equipe_id))})</option>`).join('');
  $('#fl').innerHTML = '<option value="">Lead: todos</option>' + ORIGENS.map(o => `<option>${o}</option>`).join('');

  function desenhar() {
    const eq = +$('#fs').value || 0, fl = $('#fl').value;
    const consultores = BD.usuarios.filter(u => u.perfil === 'comercial' && (!eq || u.equipe_id === eq));
    const ids = consultores.map(u => u.id);
    // Últimos 8 meses (do mais antigo ao atual).
    const meses = [7, 6, 5, 4, 3, 2, 1, 0].map(n => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - n); return isoData(d).slice(0, 7); });
    const vendas = BD.vendas.filter(v => ids.includes(v.consultor_id) && (!fl || v.origem === fl) && v.data.slice(0, 7) >= meses[0]);

    // Faturamento total do período.
    const total = vendas.reduce((s, v) => s + v.valor, 0);
    $('#ft').textContent = brlCurto(total);
    $('#ftSub').textContent = `últimos 8 meses · ${vendas.length} vendas`;

    // Evolução do faturamento: colunas por mês + área suave atrás.
    const val = meses.map(m => vendas.filter(v => mesDe(v.data) === m).reduce((s, v) => s + v.valor, 0));
    const W = 520, H = 230, ml = 58, mb = 22, alt = H - mb - 8;
    const max = escala(Math.max(...val));
    const gw = (W - ml) / meses.length, x = i => ml + gw * i + gw / 2, y = v => 8 + alt - alt * v / max;
    let s = '';
    for (let i = 0; i <= 4; i++) s += `<line x1="${ml}" x2="${W}" y1="${y(max * i / 4)}" y2="${y(max * i / 4)}" class="gl"/><text x="${ml - 6}" y="${y(max * i / 4) + 4}" text-anchor="end">${brlCurto(max * i / 4)}</text>`;
    // Curva suave passando pelo topo de cada coluna.
    let d = `M${ml},${y(val[0])} L${x(0)},${y(val[0])}`;
    for (let i = 1; i < val.length; i++) { const cx = (x(i - 1) + x(i)) / 2; d += ` C${cx},${y(val[i - 1])} ${cx},${y(val[i])} ${x(i)},${y(val[i])}`; }
    s += `<path d="${d} L${W},${y(val[val.length - 1])} L${W},${y(0)} L${ml},${y(0)}Z" fill="#74c69d" opacity=".3"/>`;
    val.forEach((v, i) => s += `<rect x="${x(i) - gw * 0.22}" y="${y(v)}" width="${gw * 0.44}" height="${y(0) - y(v)}" fill="#74c69d"><title>${MESES[+meses[i].slice(5) - 1]}: ${brl(v)}</title></rect>
      <text x="${x(i)}" y="${H - 5}" text-anchor="middle">${MESES[+meses[i].slice(5) - 1]}</text>`);
    $('#evo').innerHTML = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Evolução do faturamento">${s}</svg>`;

    // Ranking de consultores: % do faturamento e número de vendas.
    $('#rk').innerHTML = ranking(vendas, consultores).map((r, i) => `
      <tr><td>${estrela(i)}</td><td class="n">${i + 1}</td><td>${esc(r.u.nome)}</td>
      <td style="text-align:right">${r.pct.toFixed(2).replace('.', ',')}%</td><td style="text-align:right">${r.qtd}</td></tr>`).join('');

    // Chargebacks mais recentes.
    $('#cbs').innerHTML = BD.chargebacks.slice().sort((a, b) => b.data.localeCompare(a.data)).slice(0, 3).map(c => `
      <div class="cb"><div class="n"><div class="av">${P}</div>${esc(c.cliente)}</div><span>${esc(c.telefone)}</span><span>${brl(c.valor)}</span><span>${dataBR(c.data).slice(0, 5)} ${horaBR(c.data)}</span><span></span></div>`).join('')
      || '<p class="vazio">Nenhum chargeback registrado.</p>';
  }

  $('#fs').onchange = desenhar;
  $('#fl').onchange = desenhar;
  desenhar();
  aoMudarBanco(desenhar); // vendas novas aparecem sem recarregar
});
