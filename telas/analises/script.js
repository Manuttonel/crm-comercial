/* TELA: ANALISES
 * Responsabilidade: Executa cálculos e organiza pareceres de análise revisional.
 * Contém a lógica específica desta tela.
 */
/* analises.js — Análises: compara o financiamento atual com o corrigido e salva no banco. */

pagina(() => {
  // Campos de entrada: [id, rótulo, tipo do campo].
  const L = [['financeira', 'Financeira', 'text'], ['modelo', 'Modelo', 'text'], ['valor_financiado', 'Valor financiado', 'number'],
    ['meses', 'N° de meses', 'number'], ['parcela', 'Valor da parcela', 'number'], ['qt_pagas', 'Qt. Pagas', 'number'], ['qt_atrasadas', 'Qt. Atrasadas', 'number']];
  // Campos de resultado (somente leitura).
  const R = [['correcao', 'Correção n°'], ['sit', 'Situação'], ['rm', 'N° de meses'], ['rp', 'Valor da parcela'], ['rr', 'Redução por parcela'], ['es', 'Estorno'], ['rt', 'Redução Total']];

  // Cria os campos nas duas colunas (ids a_ = entrada, b_ = resultado).
  $('#c1').innerHTML = L.map(f => `<label class="row">${f[1]}<input id="a_${f[0]}" type="${f[2]}" ${f[2] === 'number' ? 'min="0" step="0.01"' : ''} ${f[0] === 'financeira' ? 'list="fns"' : ''}></label>`).join('') +
    `<datalist id="fns">${BD.fornecedores.map(f => `<option value="${esc(f.nome)}">`).join('')}</datalist>`;
  $('#c2').innerHTML = R.map(f => `<label class="row">${f[1]}<input id="b_${f[0]}" readonly></label>`).join('');
  $('#cons').textContent = EU.nome;
  // Sugestões de nome: os clientes do consultor (escolher um preenche o CPF).
  const meus = BD.clientes.filter(c => c.consultor_id === EU.id);
  $('#cls').innerHTML = meus.map(c => `<option value="${esc(c.nome)}">`).join('');
  $('#nome').onchange = () => { const c = meus.find(x => x.nome === $('#nome').value); if (c && c.cpf) $('#cpf').value = c.cpf; };

  // Divisão padrão de cada tipo: veículo 4, imóvel 2, empréstimo 2.
  const DIV = { v: 4, i: 2, e: 2 };
  let aberta = null; // análise salva que está aberta na tela (null = nova)
  let parecer = null; // parecer da IA mostrado na tela (vai junto quando a análise é salva)
  const TIPOS = { v: 'Veículo', i: 'Imóvel', e: 'Empréstimo' };

  // Cálculo revisional (mesma fórmula do protótipo).
  function calculo(a) {
    const vf = a.valor_financiado, nm = a.meses, vp = a.parcela, qp = a.qt_pagas, dv = a.divisao || 1;
    if (!(vf > 0 && nm > 0 && vp > 0)) return null;     // falta dado essencial
    const juros = nm * vp - vf;                          // juros = total pago - valor financiado
    const np = (vf + juros / dv) / nm;                   // nova parcela = (financiado + juros dividido) / meses
    const red = vp - np;                                 // redução por parcela
    return { sit: juros > 0 ? 'APROVADO' : 'SEM JUROS ABUSIVOS', rm: Math.max(nm - qp, 0), np, red, estorno: red * qp, total: red * nm };
  }

  // Lê a tela inteira e devolve um objeto com os dados da análise.
  const num = id => parseFloat($('#a_' + id).value) || 0;
  function lerTela() {
    return {
      cliente: $('#nome').value.trim(), cpf: $('#cpf').value.trim(), tipo: $('#tp').value, divisao: parseFloat($('#dv').value) || 1,
      financeira: $('#a_financeira').value.trim(), modelo: $('#a_modelo').value.trim(),
      valor_financiado: num('valor_financiado'), meses: num('meses'), parcela: num('parcela'), qt_pagas: num('qt_pagas'), qt_atrasadas: num('qt_atrasadas')
    };
  }

  /* ---------- Parecer da IA ---------- */
  // Mostra (ou esconde) o parecer na tela.
  function mostrarParecer(o) {
    parecer = o || null;
    const box = $('#iaBox');
    box.hidden = !o;
    box.innerHTML = o ? htmlParecer(o) : '';
    const c = $('#iaCopiar');
    if (c) c.onclick = () => navigator.clipboard.writeText($('#iaMsg').textContent).then(() => aviso('Mensagem copiada!'), () => aviso('Não foi possível copiar.'));
  }

  // Pede o parecer à IA. Não envia nome nem CPF do cliente, só os dados do financiamento.
  $('#bIA').onclick = async () => {
    const a = lerTela(), r = calculo(a);
    if (!r) { aviso('Preencha valor financiado, n° de meses e valor da parcela.'); return; }
    const taxaPct = taxaMensal(a.valor_financiado, a.meses, a.parcela) * 100;
    const dados = {
      tipo_financiamento: TIPOS[a.tipo], financeira: a.financeira, modelo: a.modelo, valor_financiado: a.valor_financiado,
      meses: a.meses, parcela: a.parcela, qt_pagas: a.qt_pagas, qt_atrasadas: a.qt_atrasadas, divisao: a.divisao,
      juros_total: a.meses * a.parcela - a.valor_financiado, taxa_mensal_pct: taxaPct, situacao: r.sit,
      nova_parcela: r.np, reducao_parcela: r.red, estorno: r.estorno, reducao_total: r.total
    };
    const b = $('#bIA');
    b.disabled = true; b.textContent = 'Analisando...';
    try { mostrarParecer(await pedirIA('analise', dados)); }
    catch (e) { mostrarParecer(parecerLocal(a, r, taxaPct)); aviso('IA indisponível agora: mostrando a análise automática.'); }
    b.disabled = false; b.textContent = 'Analisar com IA';
  };

  // Mudou algum dado: o parecer antigo não vale mais, então some da tela.
  ['#c1', '#dv', '#tp'].forEach(id => { $(id).addEventListener('input', () => mostrarParecer(null)); $(id).addEventListener('change', () => mostrarParecer(null)); });

  // Recalcula os resultados a cada tecla digitada.
  function calcular() {
    const r = calculo(lerTela());
    $('#b_correcao').value = aberta ? aberta.correcao : '(gerado ao salvar)';
    if (!r) { R.slice(1).forEach(f => $('#b_' + f[0]).value = ''); return; }
    $('#b_sit').value = r.sit;
    $('#b_rm').value = r.rm;
    $('#b_rp').value = brl(r.np);
    $('#b_rr').value = brl(r.red);
    $('#b_es').value = brl(r.estorno);
    $('#b_rt').value = brl(r.total);
  }

  // Data da análise e aviso de validade (a análise vale 24 horas).
  function cabecalho() {
    const quando = aberta ? aberta.criado_em : agora();
    $('#dt').textContent = dataBR(quando);
    const venceu = diasDesde(quando) > 1;
    $('#exp').textContent = venceu ? 'Expirada' : 'Expira em 24 horas';
  }

  // Coloca uma análise salva (ou uma vazia) na tela.
  function preencher(a) {
    aberta = a;
    $('#nome').value = a ? a.cliente : '';
    $('#cpf').value = a ? a.cpf : '';
    $('#tp').value = a ? a.tipo : 'v';
    $('#dv').value = a ? a.divisao : 4;
    L.forEach(f => $('#a_' + f[0]).value = a && a[f[0]] !== undefined ? a[f[0]] : '');
    cabecalho();
    calcular();
    mostrarParecer(a && a.ia ? a.ia : null);
  }

  // Lista das análises salvas pelo consultor (mais recentes primeiro).
  function lista() {
    const l = BD.analises.filter(a => a.consultor_id === EU.id).sort((a, b) => b.criado_em.localeCompare(a.criado_em));
    $('#lst').innerHTML = l.map(a => {
      const r = calculo(a), venceu = diasDesde(a.criado_em) > 1;
      return `<div class="lan">
        <b>${esc(a.cliente || 'Sem nome')}</b><span>${esc(a.cpf)}</span><span>${dataBR(a.criado_em)}</span>
        <span>${r ? 'Redução ' + brl(r.total) : '—'}</span>
        <span class="tag ${venceu ? 'off' : ''}">${venceu ? 'Expirada' : 'Válida'}</span>
        <span class="acs"><button class="btn" data-ab="${a.id}">Abrir</button><button class="btn red" data-ex="${a.id}">Excluir</button></span>
      </div>`;
    }).join('') || '<p class="vazio">Nenhuma análise salva ainda.</p>';
    $$('[data-ab]').forEach(b => b.onclick = () => { preencher(BD.analises.find(a => a.id === +b.dataset.ab)); scrollTo({ top: 0, behavior: 'smooth' }); });
    $$('[data-ex]').forEach(b => b.onclick = () => {
      if (!confirm('Excluir esta análise?')) return;
      remover('analises', +b.dataset.ex);
      if (aberta && aberta.id === +b.dataset.ex) preencher(null);
      lista();
    });
  }

  // Salvar: atualiza a análise aberta ou cria uma nova com número de correção.
  $('#bSalvar').onclick = () => {
    const a = lerTela();
    a.ia = parecer; // guarda o parecer junto (ou apaga o antigo, se os dados mudaram)
    if (!a.cliente) { aviso('Informe o nome do cliente.'); $('#nome').focus(); return; }
    if (!calculo(a)) { aviso('Preencha valor financiado, n° de meses e valor da parcela.'); return; }
    if (aberta) aberta = alterar('analises', aberta.id, a);
    else {
      const hoje = isoData(new Date()).replace(/-/g, '').slice(2);               // ex.: 261101
      const n = BD.analises.filter(x => x.correcao && x.correcao.startsWith(hoje)).length + 1;
      aberta = inserir('analises', { ...a, consultor_id: EU.id, correcao: hoje + pad2(n), criado_em: agora() });
    }
    aviso('Análise salva!');
    cabecalho(); calcular(); lista();
  };
  $('#bNova').onclick = () => preencher(null);
  $('#bImp').onclick = () => print();

  $('#c1').oninput = calcular;   // recalcula a cada tecla digitada
  $('#dv').oninput = calcular;   // e quando a divisão muda
  // Trocar o tipo ajusta a divisão sugerida e recalcula.
  $('#tp').onchange = () => { $('#dv').value = DIV[$('#tp').value]; calcular(); };

  preencher(null);
  lista();
});
