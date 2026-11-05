/* TELA: CONFIGURACOES
 * Responsabilidade: Gerencia as configurações disponíveis no sistema.
 * Contém a lógica específica desta tela.
 */
/* configuracoes.js — Configurações do financeiro: fornecedores, chargebacks e taxas das bandeiras. */

pagina(() => {
  let fSel = null; // fornecedor selecionado (para o botão Remover)

  /* ---------- Fornecedores ---------- */
  function fornecedores() {
    $('#fns').innerHTML = BD.fornecedores.map(f => `<div class="forn ${f.id === fSel ? 'on' : ''}" data-id="${f.id}"><div class="av">${P}</div>${esc(f.nome)}</div>`).join('')
      || '<p class="vazio">Nenhum fornecedor.</p>';
    $$('.forn').forEach(el => el.onclick = () => { fSel = +el.dataset.id; fornecedores(); });
  }
  $('#fAdd').onclick = () => abrirFormulario('Novo fornecedor', [{ id: 'nome', rotulo: 'Nome do fornecedor' }], v => {
    if (BD.fornecedores.some(f => f.nome.toLowerCase() === v.nome.toLowerCase())) return 'Esse fornecedor já existe.';
    inserir('fornecedores', { nome: v.nome });
    aviso('Fornecedor adicionado!');
    fornecedores();
  });
  $('#fRem').onclick = () => {
    if (!fSel) { aviso('Clique em um fornecedor para selecionar.'); return; }
    const f = BD.fornecedores.find(x => x.id === fSel);
    if (!confirm(`Remover "${f.nome}"?`)) return;
    remover('fornecedores', fSel);
    fSel = null;
    aviso('Fornecedor removido.');
    fornecedores();
  };

  /* ---------- Chargebacks ---------- */
  function chargebacks() {
    $('#cbs').innerHTML = BD.chargebacks.slice().sort((a, b) => b.data.localeCompare(a.data)).map(c => `
      <div class="cb"><div class="n"><div class="av">${P}</div>${esc(c.cliente)}</div><span>${esc(c.telefone)}</span><span>${brl(c.valor)}</span>
      <span>${dataBR(c.data)}</span><button class="x" data-id="${c.id}" title="Excluir" aria-label="Excluir chargeback">×</button></div>`).join('')
      || '<p class="vazio">Nenhum chargeback registrado.</p>';
    $$('#cbs .x').forEach(b => b.onclick = () => {
      if (!confirm('Excluir este chargeback?')) return;
      remover('chargebacks', +b.dataset.id);
      chargebacks();
    });
  }
  $('#cAdd').onclick = () => abrirFormulario('Novo chargeback', [
    { id: 'cliente', rotulo: 'Cliente' },
    { id: 'telefone', rotulo: 'Telefone', tipo: 'tel' },
    { id: 'valor', rotulo: 'Valor do chargeback (R$)', tipo: 'number' },
    { id: 'data', rotulo: 'Data', tipo: 'date', valor: isoData(new Date()) }
  ], v => {
    if (!(parseFloat(v.valor) > 0)) return 'Informe um valor maior que zero.';
    inserir('chargebacks', { cliente: v.cliente, telefone: v.telefone, valor: parseFloat(v.valor), data: v.data + 'T' + agora().slice(11) });
    aviso('Chargeback registrado!');
    chargebacks();
  });

  /* ---------- Taxas ---------- */
  function taxas() {
    const bandeiras = [...new Set(BD.taxas.map(t => t.bandeira))];
    const taxa = (b, p) => { const t = BD.taxas.find(x => x.bandeira === b && x.parcelas === p); return t ? t.taxa.toFixed(2).replace('.', ',') + '%' : '—'; };
    $('#txs').innerHTML = bandeiras.map(b => `<tr><td>${esc(b)}<button class="x" data-b="${esc(b)}" title="Remover bandeira" aria-label="Remover ${esc(b)}">×</button></td>${[1, 2, 3, 4, 5].map(p => `<td>${taxa(b, p)}</td>`).join('')}</tr>`).join('');
    $('#bds').innerHTML = bandeiras.map(b => `<option value="${esc(b)}">`).join('');
    $$('#txs .x').forEach(btn => btn.onclick = () => {
      if (!confirm(`Remover a bandeira ${btn.dataset.b}?`)) return;
      BD.taxas = BD.taxas.filter(t => t.bandeira !== btn.dataset.b);
      salvarBanco();
      taxas();
    });
  }
  // Alterar/Adicionar: atualiza a taxa da bandeira naquele número de vezes (ou cria, se não existir).
  $('#tf').onsubmit = e => {
    e.preventDefault();
    const bandeira = $('#tb').value.trim(), parcelas = +$('#tn').value, taxa = +$('#tt').value;
    const t = BD.taxas.find(x => x.bandeira.toLowerCase() === bandeira.toLowerCase() && x.parcelas === parcelas);
    if (t) t.taxa = taxa; else BD.taxas.push({ bandeira, parcelas, taxa });
    salvarBanco();
    aviso(`Taxa ${bandeira} em ${parcelas}x: ${taxa}%`);
    $('#tt').value = '';
    taxas();
  };

  fornecedores();
  chargebacks();
  taxas();
});
