/* NÚCLEO COMPARTILHADO DO CRM
 * Reúne sessão, permissões, navegação e componentes reutilizados pelas telas.
 */
/* =====================================================================
   app.js — código compartilhado por TODAS as telas do sistema.
   Carregar sempre depois do dados.js.
   Ordem: atalhos > formatação > menu > sessão e acesso > consultas comuns
          > chat interno > gráficos > avisos e formulários.
   ===================================================================== */

/* ---------- 1. Atalhos ---------- */
// $('#id') devolve o primeiro elemento que combina com o seletor; $$ devolve todos em lista.
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

/* ---------- 2. Formatação ---------- */
// 1500 vira "R$ 1.500,00".
const brl = n => (+n || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
// Valor curto para números grandes: "R$ 1,23 Mi", "R$ 100 Mil".
const brlCurto = n => n >= 1e6 ? 'R$ ' + (n / 1e6).toLocaleString('pt-BR', { maximumFractionDigits: 2 }) + ' Mi'
  : n >= 1e3 ? 'R$ ' + Math.round(n / 1e3).toLocaleString('pt-BR') + ' Mil' : brl(n);
// Protege textos digitados pelo usuário antes de colocar no HTML (evita que "<b>" vire código).
const esc = t => String(t ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
// "2026-11-01T14:30" vira "01/11/2026" e "14:30".
const dataBR = iso => iso ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}` : '';
const horaBR = iso => iso && iso.length > 10 ? iso.slice(11, 16) : '';
// Mês "2026-11" de uma data, do mês atual e do mês anterior.
const mesDe = iso => iso.slice(0, 7);
const mesAtual = () => isoData(new Date()).slice(0, 7);
const mesAnterior = () => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - 1); return isoData(d).slice(0, 7); };
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
// Quantos dias se passaram desde uma data.
const diasDesde = iso => (Date.now() - new Date(iso).getTime()) / 864e5;
// Desenho (SVG) de uma pessoa, usado como foto padrão.
const P = '<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-5 3-7 8-7s8 2 8 7z"/></svg>';
// Estrelas do ranking: 1º dourada, 2º contorno, 3º cinza.
function estrela(pos) {
  const forma = '<path d="M12 2l3 6.5 7 .8-5.2 4.8 1.4 7L12 17.6 5.8 21l1.4-7L2 9.3l7-.8z"/>';
  if (pos === 0) return `<svg class="st" viewBox="0 0 24 24" fill="#e0a526" stroke="#b07d10">${forma}</svg>`;
  if (pos === 1) return `<svg class="st" viewBox="0 0 24 24" fill="none" stroke="currentColor">${forma}</svg>`;
  if (pos === 2) return `<svg class="st" viewBox="0 0 24 24" fill="#666" stroke="#555">${forma}</svg>`;
  return '';
}

/* ---------- 3. Dados do menu ---------- */
// Desenho (SVG) do ícone de cada item do menu lateral.
const IC = {
  dashboards: '<rect x="4" y="9" width="4" height="11"/><rect x="10" y="5" width="4" height="15"/><circle cx="18" cy="15" r="3.5"/>',
  chats: '<path d="M4 4h12v9H9l-3 3v-3H4zM20 9v7h-2v3l-3-3H9"/>',
  chatsc: '<path d="M4 4h12v9H9l-3 3v-3H4zM20 9v7h-2v3l-3-3H9"/>',
  discadora: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A15 15 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
  gamificacao: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>',
  metas: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>',
  analises: '<rect x="4" y="9" width="10" height="12"/><path d="M7 13h4M7 16h4"/><circle cx="17" cy="7" r="3"/>',
  financeiro: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
  configuracoes: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>'
};

// Texto mostrado embaixo de cada ícone.
const LB = {
  dashboards: 'Dashboards', chats: 'Chats', chatsc: 'Chats', discadora: 'Discadora',
  gamificacao: 'Gamificação/Metas', metas: 'Gamificação/Metas', analises: 'Análises',
  financeiro: 'Home', configuracoes: 'Configurações'
};

// Itens do menu que cada perfil enxerga. O primeiro é a página inicial do perfil.
const NAV = {
  comercial: ['metas', 'chatsc', 'analises', 'discadora'],
  supervisor: ['dashboards', 'chats', 'discadora', 'gamificacao'],
  gestor: ['dashboards', 'chats', 'discadora', 'gamificacao'],
  financeiro: ['financeiro', 'configuracoes']
};

// Arquivo HTML de cada item do menu.
const FILE = {
  dashboards: '../dashboards/index.html', chats: '../chats/index.html', discadora: '../discadora/index.html', gamificacao: '../gamificacao/index.html',
  metas: '../metas/index.html', chatsc: '../chats-comercial/index.html', analises: '../analises/index.html',
  financeiro: '../financeiro/index.html', configuracoes: '../configuracoes/index.html'
};

/* ---------- 4. Sessão: quem está logado ---------- */
// A sessão guarda só o id do usuário. Fica no sessionStorage (só esta aba)
// ou no localStorage (se marcou "Lembrar", continua logado ao reabrir o navegador).
const CHAVE_SESSAO = 'crm-revisional-sessao';
function lerSessao() {
  try { return JSON.parse(sessionStorage.getItem(CHAVE_SESSAO) || localStorage.getItem(CHAVE_SESSAO) || 'null'); }
  catch (e) { return null; }
}
function sair() {
  try { sessionStorage.removeItem(CHAVE_SESSAO); localStorage.removeItem(CHAVE_SESSAO); } catch (e) {}
  location.href = '../../index.html';
}
const SESSAO = lerSessao();
// EU = usuário logado (ou null se ninguém entrou).
const EU = (SESSAO && BD.usuarios.find(u => u.id === SESSAO.uid)) || null;

/* ---------- 5. Controle de acesso e menu lateral ---------- */
// Cada página tem <body data-k="nome">; é assim que sabemos em qual tela estamos.
const KEY = document.body.dataset.k || '';
let liberado = false; // vira true quando o usuário pode ver esta tela
if (KEY) { // a tela de login não tem data-k, então pula este bloco
  if (!EU) location.replace('../../index.html');                                           // ninguém logado: volta ao login
  else if (!NAV[EU.perfil].includes(KEY)) location.replace(FILE[NAV[EU.perfil][0]]); // tela de outro perfil: vai para a sua
  else {
    liberado = true;
    // Monta os links do menu; a tela atual recebe a classe "on" (círculo azul).
    $('#nav').innerHTML = NAV[EU.perfil].map(k => `
      <a href="${FILE[k]}" class="${k === KEY ? 'on' : ''}" title="${LB[k]}">
        <span class="ic"><svg class="i" viewBox="0 0 24 24">${IC[k]}</svg></span><span class="tx">${LB[k]}</span>
      </a>`).join('');
    // Troca o texto de todos os lugares com a classe "un" pelo primeiro nome do usuário.
    $$('.un').forEach(x => x.textContent = EU.nome.split(' ')[0]);
    $$('.lo').forEach(b => b.onclick = sair);                                // botões de Logout
    const hb = $('#hb');                                                     // menu "sanduíche"
    if (hb) hb.onclick = () => $('#app').classList.toggle('mini');           // recolhe/expande o menu
  }
}

// Cada tela coloca seu código dentro de pagina(() => { ... }); assim ele só roda se o acesso foi liberado.
const pagina = fn => { if (liberado) fn(); };

/* ---------- 6. Consultas usadas por várias telas ---------- */
// Nome de um usuário pelo id.
const nomeUsuario = id => (BD.usuarios.find(u => u.id === id) || {}).nome || '—';
const nomeEquipe = id => (BD.equipes.find(e => e.id === id) || {}).nome || '';
const nomeFornecedor = id => (BD.fornecedores.find(f => f.id === id) || {}).nome || '—';

// Consultores que o usuário logado pode acompanhar:
// gestor vê todos, supervisor vê a própria equipe, consultor vê só a si mesmo.
function consultoresVisiveis() {
  const todos = BD.usuarios.filter(u => u.perfil === 'comercial');
  if (EU.perfil === 'supervisor') return todos.filter(u => u.equipe_id === EU.equipe_id);
  if (EU.perfil === 'comercial') return todos.filter(u => u.id === EU.id);
  return todos;
}

// Ranking: soma as vendas por consultor e ordena do maior para o menor faturamento.
function ranking(vendas, consultores) {
  const total = vendas.reduce((s, v) => s + v.valor, 0) || 1;
  return consultores.map(u => {
    const minhas = vendas.filter(v => v.consultor_id === u.id);
    const valor = minhas.reduce((s, v) => s + v.valor, 0);
    return { u, valor, qtd: minhas.length, pct: valor / total * 100 };
  }).sort((a, b) => b.valor - a.valor || b.qtd - a.qtd);
}

// Última mensagem trocada com um cliente.
function ultimaMsgCliente(clienteId) {
  const l = BD.mensagensCliente.filter(m => m.cliente_id === clienteId);
  return l[l.length - 1] || null;
}

// Redesenha a tela quando OUTRA aba altera o banco (ex.: mensagem enviada por outro usuário).
function aoMudarBanco(fn) {
  window.addEventListener('storage', e => {
    if (e.key === CHAVE_BANCO) { BD = carregarBanco(); fn(); }
  });
}

/* ---------- 7. Chat interno (entre usuários e grupos de equipe) ---------- */
// Monta as abas e os contatos de cada perfil. Contato: { tipo: 'g' (grupo) ou 'u' (usuário), id, nome, sub }.
function contatosInternos() {
  const usr = p => BD.usuarios.filter(u => u.perfil === p && u.id !== EU.id);
  const comoUsuario = u => ({ tipo: 'u', id: u.id, nome: u.nome, sub: PERFIS[u.perfil] + (u.equipe_id ? ' · ' + nomeEquipe(u.equipe_id) : '') });
  const comoGrupo = e => ({ tipo: 'g', id: e.id, nome: 'Grupo ' + e.nome, sub: 'Grupo da equipe' });
  if (EU.perfil === 'comercial') return [{
    titulo: 'Equipe',
    itens: [comoGrupo(BD.equipes.find(e => e.id === EU.equipe_id)), ...usr('supervisor').filter(u => u.equipe_id === EU.equipe_id).map(comoUsuario), ...usr('gestor').map(comoUsuario)]
  }];
  if (EU.perfil === 'supervisor') return [
    { titulo: 'Grupos', itens: BD.equipes.filter(e => e.id === EU.equipe_id).map(comoGrupo) },
    { titulo: 'Consultores', itens: usr('comercial').filter(u => u.equipe_id === EU.equipe_id).map(comoUsuario) },
    { titulo: 'Gestão', itens: [...usr('gestor'), ...usr('supervisor'), ...usr('financeiro')].map(comoUsuario) }
  ];
  // Gestor (e quem mais usar a tela) vê todas as equipes e consultores.
  return [
    { titulo: 'Grupos', itens: BD.equipes.map(comoGrupo) },
    { titulo: 'Consultores', itens: usr('comercial').map(comoUsuario) },
    { titulo: 'Supervisores', itens: [...usr('supervisor'), ...usr('financeiro'), ...usr('gestor')].map(comoUsuario) }
  ];
}

// Mensagens de uma conversa interna (grupo ou conversa entre dois usuários).
function msgsInternas(c) {
  return BD.mensagensInternas.filter(m => c.tipo === 'g'
    ? m.equipe_id === c.id
    : (m.de_id === EU.id && m.para_id === c.id) || (m.de_id === c.id && m.para_id === EU.id));
}

// Grava uma mensagem interna.
function enviarInterna(c, texto) {
  inserir('mensagensInternas', { de_id: EU.id, para_id: c.tipo === 'u' ? c.id : null, equipe_id: c.tipo === 'g' ? c.id : null, texto, criado_em: agora() });
}

// HTML dos balões de uma conversa. Cada item: { texto, meu (true = à direita), autor (opcional), criado_em }.
function baloes(lista) {
  let dia = '';
  return lista.map(m => {
    // Separador com a data sempre que o dia muda.
    const sep = m.criado_em.slice(0, 10) !== dia ? `<time>${dataBR(dia = m.criado_em.slice(0, 10))}</time>` : '';
    return sep + `<div class="m ${m.meu ? 'me' : ''}">${m.autor ? `<b>${esc(m.autor)}</b>` : ''}${esc(m.texto)}<small>${horaBR(m.criado_em)}</small></div>`;
  }).join('') || '<time>Nenhuma mensagem ainda. Diga olá!</time>';
}

/* ---------- 8. Gráficos (SVG) ---------- */
// Arredonda o maior valor do gráfico para um número "bonito" (ex.: 17 vira 20), com 4 divisões.
function escala(max) {
  if (max <= 0) return 4;
  const bruto = max / 4, mag = 10 ** Math.floor(Math.log10(bruto)), r = bruto / mag;
  return (r <= 1 ? 1 : r <= 2 ? 2 : r <= 2.5 ? 2.5 : r <= 5 ? 5 : 10) * mag * 4;
}

// Gráfico de colunas agrupadas. grupos = [{ rotulo, valores: [a, b] }], cores = ['#..', '#..'].
function graficoColunas(grupos, cores, fmt = v => v) {
  const W = 400, H = 170, ml = 34, mb = 22, mt = 6, alt = H - mb - mt;
  const max = escala(Math.max(...grupos.flatMap(g => g.valores)));
  const gw = (W - ml) / grupos.length, bw = Math.min(40, gw * 0.8 / cores.length);
  let s = '';
  for (let i = 0; i <= 4; i++) { // linhas de grade + números do eixo
    const y = mt + alt - alt * i / 4;
    s += `<line x1="${ml}" x2="${W}" y1="${y}" y2="${y}" class="gl"/><text x="${ml - 5}" y="${y + 4}" text-anchor="end">${fmt(max * i / 4)}</text>`;
  }
  grupos.forEach((g, i) => {
    const x0 = ml + gw * i + (gw - bw * cores.length - 4) / 2;
    g.valores.forEach((v, j) => {
      const h = alt * v / max;
      s += `<rect x="${x0 + j * (bw + 4)}" y="${mt + alt - h}" width="${bw}" height="${h}" fill="${cores[j]}" rx="2"><title>${esc(g.rotulo)}: ${fmt(v)}</title></rect>`;
    });
    s += `<text x="${ml + gw * i + gw / 2}" y="${H - 5}" text-anchor="middle">${esc(g.rotulo)}</text>`;
  });
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img">${s}</svg>`;
}

// Gráfico de barras deitadas. linhas = [{ rotulo, valores: [a, b] }].
function graficoBarras(linhas, cores, fmt = v => v) {
  const W = 400, ml = 50, mb = 20, lh = 32, H = linhas.length * lh + mb + 4;
  const max = escala(Math.max(...linhas.flatMap(l => l.valores)));
  const larg = W - ml - 10;
  let s = '';
  for (let i = 0; i <= 4; i++) {
    const x = ml + larg * i / 4;
    s += `<line x1="${x}" x2="${x}" y1="0" y2="${H - mb}" class="gl"/><text x="${x}" y="${H - 5}" text-anchor="middle">${fmt(max * i / 4)}</text>`;
  }
  linhas.forEach((l, i) => {
    const y0 = i * lh + 4;
    s += `<text x="${ml - 6}" y="${y0 + lh / 2}" text-anchor="end">${esc(l.rotulo)}</text>`;
    l.valores.forEach((v, j) => s += `<rect x="${ml}" y="${y0 + j * 12}" width="${larg * v / max}" height="10" fill="${cores[j]}"><title>${esc(l.rotulo)}: ${fmt(v)}</title></rect>`);
  });
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img">${s}</svg>`;
}

// Funil de vendas: etapas = [{ rotulo, pct }]. Cada faixa é um trapézio que afina a cada etapa.
function graficoFunil(etapas) {
  const cores = ['#6ae6ec', '#41b6d8', '#2c8abf', '#2f5f9e', '#2c3a7d', '#20255a'];
  const larg = etapas.map(e => Math.max(e.pct, 6));
  return etapas.map((e, i) => {
    const a = larg[i], b = i + 1 < larg.length ? larg[i + 1] : Math.max(a * 0.5, 3);
    const forma = `polygon(${(100 - a) / 2}% 0, ${(100 + a) / 2}% 0, ${(100 + b) / 2}% 100%, ${(100 - b) / 2}% 100%)`;
    return `<div><span>${esc(e.rotulo)}</span><i style="clip-path:${forma};background:${cores[i % cores.length]}"></i><span>${Math.round(e.pct)}%</span></div>`;
  }).join('');
}

/* ---------- 9. Avisos e formulários em janela ---------- */
// Mostra um aviso rápido no rodapé da tela.
function aviso(texto) {
  let t = $('#toast');
  if (!t) { t = document.createElement('div'); t.id = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
  t.textContent = texto;
  t.classList.add('on');
  clearTimeout(t._h);
  t._h = setTimeout(() => t.classList.remove('on'), 2600);
}

// Abre uma janela com formulário. campos = [{ id, rotulo, tipo, opcoes, valor, req }].
// Ao salvar, chama aoSalvar({ id: valor, ... }). Se aoSalvar devolver um texto, ele aparece como erro.
function abrirFormulario(titulo, campos, aoSalvar) {
  const d = document.createElement('dialog');
  d.className = 'dlg';
  d.innerHTML = `<form method="dialog"><h3>${esc(titulo)}</h3>` + campos.map(c => `<label>${esc(c.rotulo)}` + (c.tipo === 'select'
    ? `<select class="inp" name="${c.id}">${c.opcoes.map(o => `<option value="${esc(o[0])}">${esc(o[1])}</option>`).join('')}</select>`
    : `<input class="inp" name="${c.id}" type="${c.tipo || 'text'}" ${c.tipo === 'number' ? 'step="0.01" min="0"' : ''} ${c.req === false ? '' : 'required'}>`) + '</label>').join('') +
    `<p class="erro" role="alert"></p><div class="acts"><button type="button" class="btn red" value="x">Cancelar</button><button class="btn pri">Salvar</button></div></form>`;
  document.body.appendChild(d);
  campos.forEach(c => { if (c.valor != null) d.querySelector(`[name="${c.id}"]`).value = c.valor; });
  d.querySelector('[value="x"]').onclick = () => d.close();
  d.querySelector('form').onsubmit = e => {
    e.preventDefault();
    const v = {};
    campos.forEach(c => v[c.id] = d.querySelector(`[name="${c.id}"]`).value.trim());
    const erro = aoSalvar(v);
    if (erro) d.querySelector('.erro').textContent = erro;
    else d.close();
  };
  d.onclose = () => d.remove();
  d.showModal();
  d.querySelector('.inp').focus();
}
