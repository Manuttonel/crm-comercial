/* TELA: CHATS-COMERCIAL
 * Responsabilidade: Gerencia conversas do consultor com clientes.
 * Contém a lógica específica desta tela.
 */
/* chats-comercial.js — Chat do consultor: clientes por situação, venda, novo cliente e chat com a equipe. */

pagina(() => {
  const EQUIPE = CATEGORIAS.length; // o último botão ("Equipe") abre o chat interno
  // Botão (categoria) aberto: começa no primeiro que tem clientes.
  let cc = Math.max(CATEGORIAS.findIndex((c, i) => BD.clientes.some(x => x.consultor_id === EU.id && x.categoria === i)), 0);
  let sc = null;   // id do cliente selecionado
  let si = null;   // contato interno selecionado (aba Equipe)

  // Botões do topo: as 5 situações do cliente + Equipe.
  function filtros() {
    $('#fltc').innerHTML = [...CATEGORIAS, 'Equipe'].map((c, i) => `<button class="${i === cc ? 'on' : ''}" data-i="${i}">${c}</button>`).join('');
    $$('#fltc button').forEach(b => b.onclick = () => { cc = +b.dataset.i; sc = null; si = null; filtros(); lista(); });
  }

  // Desenha a lista da esquerda e a conversa aberta.
  function lista() {
    const interno = cc === EQUIPE;
    $('#rcl').hidden = interno; // "Resposta do cliente" só faz sentido com clientes
    if (interno) return listaInterna();

    // Clientes do consultor nesta situação, com a conversa mais recente primeiro.
    const l = BD.clientes.filter(c => c.consultor_id === EU.id && c.categoria === cc)
      .sort((a, b) => ((ultimaMsgCliente(b.id) || b).criado_em).localeCompare((ultimaMsgCliente(a.id) || a).criado_em));
    if (!l.some(c => c.id === sc)) sc = l[0] ? l[0].id : null;
    $('#clc').innerHTML = `<div class="ci novo" id="nc">+ Novo cliente</div>` + (l.map(c => {
      const m = ultimaMsgCliente(c.id);
      return `<div class="ci ${c.id === sc ? 'on' : ''}" data-id="${c.id}">
        <div class="av">${P}</div>
        <div>${esc(c.nome)}<small>${m ? esc(m.texto.slice(0, 26)) : 'Sem mensagens'}</small></div>
        ${m && m.do_cliente ? '<span class="dot" title="Aguardando resposta"></span>' : ''}
      </div>`;
    }).join('') || '<p class="vazio">Nenhum cliente nesta categoria.</p>');
    $$('#clc .ci[data-id]').forEach(e => e.onclick = () => { sc = +e.dataset.id; lista(); });
    $('#nc').onclick = novoCliente;
    conversa();
  }

  // Cabeçalho, ações e mensagens do cliente selecionado.
  function conversa() {
    const c = BD.clientes.find(x => x.id === sc);
    $('#cnc').textContent = c ? c.nome : 'Nome cliente';
    $('#cic').textContent = c ? `${c.telefone} · ${c.origem} · ${nomeFornecedor(c.fornecedor_id)}` : '';
    $('#ops').innerHTML = c ? `
      <select id="sCat" aria-label="Situação do cliente">${CATEGORIAS.map((t, i) => `<option value="${i}" ${i === c.categoria ? 'selected' : ''}>${t}</option>`).join('')}</select>
      <select id="sEt" aria-label="Etapa do funil">${ETAPAS.map((t, i) => `<option value="${i}" ${i === c.etapa ? 'selected' : ''}>Etapa: ${t}</option>`).join('')}</select>
      <button type="button" class="btn" id="bVd">Registrar venda</button>` : '';
    if (c) {
      // Mudar situação: o cliente vai para outro botão do topo.
      $('#sCat').onchange = e => { alterar('clientes', c.id, { categoria: +e.target.value }); aviso('Cliente movido para "' + CATEGORIAS[+e.target.value] + '"'); lista(); };
      $('#sEt').onchange = e => { alterar('clientes', c.id, { etapa: +e.target.value }); aviso('Etapa do funil atualizada'); };
      $('#bVd').onclick = () => registrarVenda(c);
    }
    const msgs = c ? BD.mensagensCliente.filter(m => m.cliente_id === c.id).map(m => ({ texto: m.texto, meu: !m.do_cliente, criado_em: m.criado_em })) : [];
    $('#msc').innerHTML = c ? baloes(msgs) : '';
    $('#msc').scrollTop = 1e5; // rola até a última mensagem
  }

  // Grava uma mensagem para o cliente aberto. doCliente = 1 registra uma resposta recebida do cliente.
  function enviar(doCliente) {
    const v = $('#mic').value.trim();
    if (!v) return;
    if (cc === EQUIPE) { if (si) enviarInterna(si, v); }
    else if (sc) inserir('mensagensCliente', { cliente_id: sc, do_cliente: doCliente, texto: v, criado_em: agora() });
    else return;
    $('#mic').value = '';
    lista();
  }
  $('#sfc').onsubmit = e => { e.preventDefault(); enviar(0); };
  $('#rcl').onclick = () => enviar(1);

  // Venda: grava o valor, move o cliente para "Já pagaram" e para a etapa "vendas" do funil.
  function registrarVenda(c) {
    abrirFormulario('Registrar venda – ' + c.nome, [
      { id: 'valor', rotulo: 'Valor da venda (R$)', tipo: 'number' },
      { id: 'forn', rotulo: 'Financeira', tipo: 'select', opcoes: BD.fornecedores.map(f => [f.id, f.nome]), valor: c.fornecedor_id }
    ], v => {
      const valor = parseFloat(v.valor);
      if (!(valor > 0)) return 'Informe um valor maior que zero.';
      inserir('vendas', { consultor_id: EU.id, cliente_id: c.id, fornecedor_id: +v.forn, origem: c.origem, valor, data: isoData(new Date()) });
      alterar('clientes', c.id, { categoria: 0, etapa: 5, fornecedor_id: +v.forn });
      aviso('Venda de ' + brl(valor) + ' registrada!');
      cc = 0; sc = c.id; filtros(); lista();
    });
  }

  // Novo cliente (lead): entra na situação escolhida e na primeira etapa do funil.
  function novoCliente() {
    abrirFormulario('Novo cliente', [
      { id: 'nome', rotulo: 'Nome' },
      { id: 'telefone', rotulo: 'Telefone', tipo: 'tel' },
      { id: 'cpf', rotulo: 'CPF', req: false },
      { id: 'origem', rotulo: 'Origem do lead', tipo: 'select', opcoes: ORIGENS.map(o => [o, o]) },
      { id: 'forn', rotulo: 'Financeira do contrato', tipo: 'select', opcoes: BD.fornecedores.map(f => [f.id, f.nome]) },
      { id: 'cat', rotulo: 'Situação', tipo: 'select', opcoes: CATEGORIAS.map((c, i) => [i, c]), valor: cc === EQUIPE ? 4 : cc }
    ], v => {
      const c = inserir('clientes', {
        nome: v.nome, cpf: v.cpf, telefone: v.telefone, consultor_id: EU.id, fornecedor_id: +v.forn,
        origem: v.origem, categoria: +v.cat, etapa: 0, criado_em: agora()
      });
      aviso('Cliente cadastrado!');
      cc = c.categoria; sc = c.id; filtros(); lista();
    });
  }

  /* ---------- Aba Equipe: chat interno com supervisor, gestor e grupo ---------- */
  function listaInterna() {
    const l = contatosInternos()[0].itens;
    if (!si || !l.some(c => c.tipo === si.tipo && c.id === si.id)) si = l[0] || null;
    $('#clc').innerHTML = l.map((c, i) => {
      const ms = msgsInternas(c), u = ms[ms.length - 1];
      return `<div class="ci ${si && c.tipo === si.tipo && c.id === si.id ? 'on' : ''}" data-i="${i}">
        <div class="av">${P}</div><div>${esc(c.nome)}<small>${u ? esc(u.texto.slice(0, 26)) : c.sub}</small></div></div>`;
    }).join('');
    $$('#clc .ci').forEach(e => e.onclick = () => { si = l[+e.dataset.i]; lista(); });
    $('#cnc').textContent = si ? si.nome : '';
    $('#cic').textContent = si ? si.sub : '';
    $('#ops').innerHTML = '';
    $('#msc').innerHTML = si ? baloes(msgsInternas(si).map(m => ({
      texto: m.texto, meu: m.de_id === EU.id, autor: si.tipo === 'g' && m.de_id !== EU.id ? nomeUsuario(m.de_id) : '', criado_em: m.criado_em
    }))) : '';
    $('#msc').scrollTop = 1e5;
  }

  filtros();
  lista();
  aoMudarBanco(lista); // mensagens novas de outra aba aparecem sozinhas
});
