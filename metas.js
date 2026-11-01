/* metas.js — Gamificação/Metas do consultor: números do dia, pódio, ranking, meta e Kanban. */

pagina(() => {
  /* ---------- Números do topo ---------- */
  function numeros() {
    const meus = BD.clientes.filter(c => c.consultor_id === EU.id);
    // Novos leads = clientes que chegaram nos últimos 7 dias.
    $('#k1').textContent = meus.filter(c => diasDesde(c.criado_em) <= 7).length;
    // Novas conversas = clientes cuja última mensagem foi do cliente (esperando resposta).
    $('#k2').textContent = meus.filter(c => { const m = ultimaMsgCliente(c.id); return m && m.do_cliente; }).length;
    // Número de vendas do mês atual.
    $('#k3').textContent = BD.vendas.filter(v => v.consultor_id === EU.id && mesDe(v.data) === mesAtual()).length;
  }

  /* ---------- Pódio da semana e ranking do mês ---------- */
  function gamificacao() {
    const consultores = BD.usuarios.filter(u => u.perfil === 'comercial');
    // Pódio: quem mais faturou nos últimos 7 dias.
    const semana = ranking(BD.vendas.filter(v => diasDesde(v.data) <= 7), consultores);
    const cores = ['#f06bbd', '#6fd0c7', '#f25c6e'];   // cor do círculo de cada lugar
    const ordem = [1, 0, 2];                           // desenha 2º, 1º, 3º (o 1º fica no meio)
    const alturas = [110, 80, 60];
    $('#podio').innerHTML = ordem.map(i => {
      const r = semana[i];
      return `<div>
        <div class="av" style="background:${cores[i]}">${P}</div>
        ${r && r.valor ? esc(r.u.nome.split(' ')[0]) + `<small>${brlCurto(r.valor)}</small>` : '—'}
        <i style="height:${alturas[i]}px">${i + 1}</i>
      </div>`;
    }).join('');
    // Ranking: faturamento do mês atual de todos os consultores. A linha do usuário fica em destaque.
    const mes = ranking(BD.vendas.filter(v => mesDe(v.data) === mesAtual()), consultores);
    $('#rk').innerHTML = mes.map((r, i) => `
      <tr class="${r.u.id === EU.id ? 'eu' : ''}">
        <td>${estrela(i)}</td><td class="n">${i + 1}</td><td>${esc(r.u.nome)}</td>
      </tr>`).join('');
  }

  /* ---------- Barra da meta do mês ---------- */
  function meta() {
    const m = BD.metas.find(x => x.usuario_id === EU.id) || { minimo: 0, desafio: 0 };
    const feito = BD.vendas.filter(v => v.consultor_id === EU.id && mesDe(v.data) === mesAtual()).reduce((s, v) => s + v.valor, 0);
    const pc = m.minimo ? Math.round(feito / m.minimo * 100) : 0;
    $('#mtx').textContent = m.minimo
      ? `Você já atingiu ${pc}% da meta (${brl(feito)} de ${brl(m.minimo)}) · Desafio: ${brl(m.desafio)}`
      : 'Seu supervisor ainda não definiu sua meta.';
    setTimeout(() => $('#bar').style.width = Math.min(pc, 100) + '%', 50); // anima a barra
  }

  /* ---------- Kanban (tarefas salvas no banco) ---------- */
  const COLUNAS = [['A FAZER', '#2f7fd8'], ['EM ANDAMENTO', '#f0a500'], ['CONCLUÍDO', '#5b2fc9']];
  let drag = null; // id da tarefa que está sendo arrastada

  function kanban() {
    const minhas = BD.tarefas.filter(t => t.usuario_id === EU.id);
    $('#kb').innerHTML = COLUNAS.map((c, i) => `
      <div class="kc" data-c="${i}">
        <div class="kh" style="border-color:${c[1]}">${c[0]}</div>
        ${minhas.filter(t => t.coluna === i).map(t => `
          <div class="task" draggable="true" data-id="${t.id}">
            <span>${esc(t.titulo)}</span>
            <span class="ac">
              ${i > 0 ? `<button data-mv="-1" title="Voltar coluna" aria-label="Voltar coluna">‹</button>` : ''}
              ${i < 2 ? `<button data-mv="1" title="Avançar coluna" aria-label="Avançar coluna">›</button>` : ''}
              <button data-del title="Excluir" aria-label="Excluir tarefa">×</button>
            </span>
          </div>`).join('')}
      </div>`).join('');

    // Botões ‹ › (mover) e × (excluir) de cada tarefa.
    $$('.task').forEach(el => {
      const id = +el.dataset.id;
      el.ondragstart = () => drag = id;
      el.querySelectorAll('[data-mv]').forEach(b => b.onclick = () => {
        const t = BD.tarefas.find(x => x.id === id);
        alterar('tarefas', id, { coluna: t.coluna + +b.dataset.mv });
        kanban();
      });
      el.querySelector('[data-del]').onclick = () => { remover('tarefas', id); kanban(); };
    });
    // Arrastar e soltar entre colunas: grava a nova coluna no banco.
    $$('.kc').forEach(col => {
      col.ondragover = e => { e.preventDefault(); col.classList.add('over'); };
      col.ondragleave = () => col.classList.remove('over');
      col.ondrop = e => {
        e.preventDefault();
        col.classList.remove('over');
        if (drag) alterar('tarefas', drag, { coluna: +col.dataset.c });
        drag = null;
        kanban();
      };
    });
  }

  // Nova tarefa sempre entra em "A FAZER".
  $('#kf').onsubmit = e => {
    e.preventDefault();
    inserir('tarefas', { usuario_id: EU.id, titulo: $('#kt').value.trim(), coluna: 0 });
    $('#kt').value = '';
    kanban();
  };

  function tudo() { numeros(); gamificacao(); meta(); kanban(); }
  tudo();
  aoMudarBanco(tudo); // atualiza se outra aba mudar os dados
});
