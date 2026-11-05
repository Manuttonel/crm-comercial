/* TELA: CHATS
 * Responsabilidade: Gerencia o chat interno entre usuários e equipes.
 * Contém a lógica específica desta tela.
 */
/* chats.js — Chat interno do supervisor e do gestor. As mensagens ficam salvas no banco
   e aparecem para o outro usuário (teste abrindo outra aba com outro login). */

pagina(() => {
  const ABAS = contatosInternos(); // [{ titulo, itens: [contatos] }]
  let g = 1;      // aba aberta; começa em "Consultores"
  let sel = null; // contato selecionado

  // Botões das abas; a aba atual recebe a classe "on".
  function flt() {
    $('#flt').innerHTML = ABAS.map((a, i) => `<button class="${i === g ? 'on' : ''}" data-i="${i}">${a.titulo}</button>`).join('');
    $$('#flt button').forEach(b => b.onclick = () => { g = +b.dataset.i; sel = null; flt(); lista(); });
  }

  // Lista de contatos da aba e a conversa aberta.
  function lista() {
    const l = ABAS[g].itens;
    if (!sel || !l.includes(sel)) sel = l[0] || null;
    $('#cl').innerHTML = l.map((c, i) => {
      const ms = msgsInternas(c), u = ms[ms.length - 1];
      return `<div class="ci ${c === sel ? 'on' : ''}" data-i="${i}">
        <div class="av">${P}</div>
        <div>${esc(c.nome)}<small>${u ? esc(u.texto.slice(0, 26)) : esc(c.sub)}</small></div>
      </div>`;
    }).join('') || '<p class="vazio">Nenhum contato nesta aba.</p>';
    $$('#cl .ci').forEach(e => e.onclick = () => { sel = l[+e.dataset.i]; lista(); });
    $('#cn').textContent = sel ? sel.nome : '';
    $('#cs').textContent = sel ? sel.sub : '';
    // Em grupo, cada balão mostra quem escreveu.
    $('#ms').innerHTML = sel ? baloes(msgsInternas(sel).map(m => ({
      texto: m.texto, meu: m.de_id === EU.id, autor: sel.tipo === 'g' && m.de_id !== EU.id ? nomeUsuario(m.de_id) : '', criado_em: m.criado_em
    }))) : '';
    $('#ms').scrollTop = 1e5; // rola até a última mensagem
  }

  // Enviar mensagem: grava no banco e redesenha.
  $('#sf').onsubmit = e => {
    e.preventDefault();
    const v = $('#mi').value.trim();
    if (!v || !sel) return;
    enviarInterna(sel, v);
    $('#mi').value = '';
    lista();
  };

  flt();
  lista();
  aoMudarBanco(lista); // mensagens de outra aba aparecem sozinhas
});
