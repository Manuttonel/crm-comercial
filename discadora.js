/* discadora.js — Discadora (comercial, supervisor e gestor). As ligações são simuladas e salvas no banco. */

pagina(() => {
  // Teclado: botões 1-9, depois [desligar] [0] [ligar].
  $('#pad').innerHTML = [1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `<button data-d="${n}">${n}</button>`).join('') +
    `<button class="call" id="hang" aria-label="Desligar"><svg class="i" viewBox="0 0 24 24"><path d="M3 14c5-5 13-5 18 0l-2 3-4-1v-2a9 9 0 0 0-6 0v2l-4 1z"/></svg></button>
     <button data-d="0">0</button>
     <button class="call g" id="dial" aria-label="Ligar"><svg class="i" viewBox="0 0 24 24"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A15 15 0 0 1 3 6a2 2 0 0 1 2-2z"/></svg></button>`;

  // Clicar num número acrescenta o dígito ao campo de telefone.
  $$('[data-d]').forEach(b => b.onclick = () => $('#tel').value += b.dataset.d);

  // Clientes que este usuário pode ligar: os seus (consultor) ou os da equipe (supervisor/gestor).
  const ids = consultoresVisiveis().map(u => u.id);
  const meusClientes = () => BD.clientes.filter(c => ids.includes(c.consultor_id));
  const soNumeros = t => String(t).replace(/\D/g, '');

  let atual = null; // ligação em andamento (registro do banco)
  let inicio = 0;   // hora em que ela começou (para calcular a duração)

  // Contadores e histórico (últimas 10 ligações do usuário).
  function hist() {
    const minhas = BD.ligacoes.filter(l => l.usuario_id === EU.id);
    $('#nm').textContent = minhas.filter(l => l.tipo === 'manual').length;
    $('#na').textContent = minhas.filter(l => l.tipo === 'automatica').length;
    $('#hs').innerHTML = minhas.slice().sort((a, b) => b.criado_em.localeCompare(a.criado_em)).slice(0, 10).map(h => `
      <div class="hr">
        <div class="n"><div class="av">${P}</div>${esc(h.cliente_nome || 'Número avulso')}</div>
        <span>${esc(h.telefone)}</span><span>${esc(h.status)}${h.tipo === 'automatica' ? ' · auto' : ''}</span><span>${dataBR(h.criado_em).slice(0, 5)} ${horaBR(h.criado_em)}</span>
      </div>`).join('') || '<p class="vazio">Nenhuma ligação ainda.</p>';
  }

  // Botão verde: inicia uma ligação manual e grava no banco como "Chamando...".
  $('#dial').onclick = () => {
    const t = $('#tel').value.trim();
    if (!t) { aviso('Digite um número.'); return; }
    if (atual) { aviso('Já existe uma ligação em andamento.'); return; }
    // Se o número for de um cliente, o histórico mostra o nome dele.
    const cli = meusClientes().find(c => soNumeros(c.telefone) === soNumeros(t) || soNumeros(c.telefone).endsWith(soNumeros(t)));
    atual = inserir('ligacoes', { usuario_id: EU.id, cliente_nome: cli ? cli.nome : '', telefone: cli ? cli.telefone : t, status: 'Chamando...', tipo: 'manual', duracao: 0, criado_em: agora() });
    inicio = Date.now();
    // Mostra os botões para dizer como a ligação terminou.
    $('#res').hidden = false;
    $('#res').innerHTML = `Ligando para ${esc(cli ? cli.nome : t)}... Resultado: ` +
      ['Atendeu', 'Caixa postal', 'Sem sinal'].map(s => `<button class="btn" data-s="${s}">${s}</button>`).join('');
    $$('#res [data-s]').forEach(b => b.onclick = () => encerrar(b.dataset.s));
    hist();
  };

  // Encerra a ligação atual com o resultado e a duração (minutos).
  function encerrar(status) {
    if (!atual) return;
    const minutos = status === 'Atendeu' ? Math.max(Math.round((Date.now() - inicio) / 6000) / 10, 0.1) : 0;
    alterar('ligacoes', atual.id, { status, duracao: minutos });
    atual = null;
    $('#res').hidden = true;
    $('#tel').value = '';
    aviso('Ligação registrada: ' + status);
    hist();
  }

  // Botão vermelho: desliga (conta como atendida se estava em andamento) ou só limpa o número.
  $('#hang').onclick = () => atual ? encerrar('Atendeu') : $('#tel').value = '';

  /* ---------- Modo automático (simulação) ---------- */
  // A cada 4 segundos liga para o próximo cliente da fila: primeiro quem "Não respondeu", depois os demais.
  let timer = null;
  function ligacaoAutomatica() {
    const fila = meusClientes().sort((a, b) => (b.categoria === 4) - (a.categoria === 4));
    if (!fila.length) { aviso('Nenhum cliente para ligar.'); return desligarAuto(); }
    // Escolhe o cliente que foi chamado há mais tempo.
    const ultima = c => (BD.ligacoes.filter(l => l.telefone === c.telefone).map(l => l.criado_em).sort().pop() || '');
    const cli = fila.slice(0, 12).sort((a, b) => ultima(a).localeCompare(ultima(b)))[0];
    const status = ['Atendeu', 'Caixa postal', 'Sem sinal', 'Atendeu'][Math.floor(Math.random() * 4)];
    inserir('ligacoes', { usuario_id: EU.id, cliente_nome: cli.nome, telefone: cli.telefone, status, tipo: 'automatica', duracao: status === 'Atendeu' ? 1 + Math.floor(Math.random() * 10) : 0, criado_em: agora() });
    hist();
  }
  function desligarAuto() {
    clearInterval(timer);
    timer = null;
    $('#sw').classList.remove('on');
    $('#sw').setAttribute('aria-checked', 'false');
  }
  // Chave do modo automático: liga/desliga as chamadas.
  $('#sw').onclick = () => {
    if (timer) { desligarAuto(); aviso('Modo automático desligado'); return; }
    $('#sw').classList.add('on');
    $('#sw').setAttribute('aria-checked', 'true');
    aviso('Modo automático ligado');
    ligacaoAutomatica();
    timer = setInterval(ligacaoAutomatica, 4000);
  };

  hist();
});
