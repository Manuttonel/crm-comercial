/* INTEGRAÇÃO DE IA NO NAVEGADOR
 * Envia dados permitidos à função /api/ia e apresenta o parecer recebido.
 * Mantém uma alternativa local quando a API não está disponível.
 */
/* ia-cliente.js — parte do navegador da inteligência artificial.
   1) pedirIA(): manda os dados para /api/ia (função da Vercel) e devolve o parecer.
   2) parecerLocal() e dashLocal(): análise por regras, usada se a IA estiver fora do ar
      (ou se o sistema for aberto direto do computador, sem a Vercel). Fica marcada como "automática".
   3) Funções que desenham o resultado na tela. */

/* ---------- 1. Pedido à IA ---------- */
async function pedirIA(tipo, dados) {
  const ctrl = new AbortController();
  const limite = setTimeout(() => ctrl.abort(), 30000); // desiste após 30 s
  try {
    const r = await fetch('/api/ia', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tipo, dados }), signal: ctrl.signal
    });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const j = await r.json();
    if (!j || !j.resultado) throw new Error('resposta vazia');
    return { ...j.resultado, origem: 'ia' };
  } finally { clearTimeout(limite); }
}

/* ---------- 2. Cálculos de apoio ---------- */
// Taxa de juros mensal escondida nas parcelas (tabela Price), achada por tentativa (bisseção).
function taxaMensal(vf, n, p) {
  if (!(vf > 0 && n > 0 && p > 0) || n * p <= vf) return 0;
  let lo = 0, hi = 1;
  for (let k = 0; k < 60; k++) {
    const i = (lo + hi) / 2;
    const pmt = vf * i / (1 - Math.pow(1 + i, -n));
    if (pmt > p) hi = i; else lo = i;
  }
  return (lo + hi) / 2;
}

/* ---------- 3. Análise local (sem IA), por regras simples ---------- */
function parecerLocal(a, r, taxaPct) {
  const juros = a.meses * a.parcela - a.valor_financiado;
  const redPct = a.parcela ? r.red / a.parcela * 100 : 0;
  let v = 'baixa';
  if (juros > 0) v = (taxaPct >= 2.5 || redPct >= 20) ? 'alta' : 'media';
  const pontos = [];
  if (a.qt_atrasadas > 0) pontos.push(`Há ${a.qt_atrasadas} parcela(s) em atraso: confirme multas e encargos antes de seguir.`);
  if (a.qt_pagas === 0) pontos.push('Nenhuma parcela paga: não há estorno a recuperar, só redução das parcelas futuras.');
  if (juros > 0) pontos.push(`Taxa mensal implícita de ${taxaPct.toFixed(2).replace('.', ',')}% ao mês.`);
  return {
    origem: 'local', viabilidade: v,
    resumo: juros > 0
      ? `Total pago supera o financiado em ${brl(juros)}. A correção reduziria a parcela em ${brl(r.red)} (${redPct.toFixed(0)}%), com redução total de ${brl(r.total)}.`
      : 'O total das parcelas não supera o valor financiado: não há indício de juros abusivos.',
    pontos_atencao: pontos,
    argumentos: juros > 0 ? ['Juros acima do financiado indicam possível abusividade (art. 51 do CDC), a ser confirmada pelo jurídico.'] : [],
    proximo_passo: juros > 0 ? 'Reunir contrato e comprovantes e encaminhar ao jurídico para validação.' : 'Informar ao cliente que, com estes dados, a revisão não compensa.',
    mensagem_cliente: juros > 0
      ? `Olá! Analisamos seu financiamento e há indício de que as parcelas podem ser reduzidas em cerca de ${brl(r.red)}. Podemos conversar para dar o próximo passo?`
      : 'Olá! Analisamos seu financiamento e, com os dados atuais, não encontramos indício de juros abusivos. Qualquer dúvida, estamos à disposição.'
  };
}

/* ---------- 4. Análise local do dashboard ---------- */
function dashLocal(d) {
  const dest = [], aten = [], rec = [];
  const brlC = n => brl(n);
  if (d.faturamento_mes_anterior > 0) {
    const ritmo = d.faturamento_mes / Math.max(d.dia_do_mes, 1) * 30; // projeção simples do mês
    const dif = (ritmo / d.faturamento_mes_anterior - 1) * 100;
    (dif >= 0 ? dest : aten).push(`Ritmo projetado de ${brlC(ritmo)} no mês (${dif >= 0 ? '+' : ''}${dif.toFixed(0)}% contra o mês passado).`);
  }
  const abaixo = d.consultores.filter(c => c.meta_minima > 0 && c.faturamento_mes < c.meta_minima);
  if (abaixo.length) aten.push(`${abaixo.length} consultor(es) abaixo da meta mínima: ${abaixo.slice(0, 3).map(c => c.nome).join(', ')}.`);
  const acima = d.consultores.filter(c => c.meta_desafio > 0 && c.faturamento_mes >= c.meta_desafio);
  if (acima.length) dest.push(`${acima.length} consultor(es) já bateram a meta desafio: ${acima.slice(0, 3).map(c => c.nome).join(', ')}.`);
  // Maior queda entre uma etapa do funil e a seguinte.
  let pior = null;
  d.funil.forEach((e, i) => { if (i) { const q = d.funil[i - 1].pct - e.pct; if (!pior || q > pior.q) pior = { q, de: d.funil[i - 1].etapa, para: e.etapa }; } });
  if (pior && pior.q > 0) { aten.push(`Maior perda no funil entre "${pior.de}" e "${pior.para}" (${pior.q.toFixed(0)} pontos percentuais).`); rec.push(`Revisar a abordagem na passagem de "${pior.de}" para "${pior.para}".`); }
  if (abaixo.length) rec.push('Acompanhar de perto os consultores abaixo da meta, com feedback semanal.');
  return {
    origem: 'local',
    resumo: `${d.vendas_mes} venda(s) e ${brlC(d.faturamento_mes)} em ${d.mes} (dia ${d.dia_do_mes}).`,
    destaques: dest, pontos_atencao: aten, recomendacoes: rec
  };
}

/* ---------- 5. Desenho do resultado na tela ---------- */
const ul = l => l && l.length ? `<ul>${l.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : '';
const secao = (t, l) => l && l.length ? `<h4>${t}</h4>${ul(l)}` : '';
const rodapeIA = (o, aviso) => o.origem === 'ia'
  ? `<small class="ia-rod">Gerado por inteligência artificial como apoio. ${aviso}</small>`
  : '<small class="ia-rod">Análise automática por regras (a IA não respondeu agora). Tente de novo em instantes.</small>';
const cabecaIA = (titulo, o) => `<div class="ia-head"><span class="ia-tag">${o.origem === 'ia' ? 'IA' : 'AUTO'}</span><b>${titulo}</b>${o.viabilidade ? `<span class="ia-vi ${o.viabilidade}">Viabilidade ${{ alta: 'alta', media: 'média', baixa: 'baixa' }[o.viabilidade]}</span>` : ''}</div>`;

function htmlParecer(o) {
  return `${cabecaIA('Parecer da análise', o)}<p>${esc(o.resumo)}</p>
    ${secao('Pontos de atenção', o.pontos_atencao)}${secao('Argumentos', o.argumentos)}
    ${o.proximo_passo ? `<h4>Próximo passo</h4><p>${esc(o.proximo_passo)}</p>` : ''}
    ${o.mensagem_cliente ? `<h4>Mensagem sugerida ao cliente</h4><p class="ia-msg" id="iaMsg">${esc(o.mensagem_cliente)}</p><button class="btn" id="iaCopiar">Copiar mensagem</button>` : ''}
    ${rodapeIA(o, 'É uma estimativa e deve ser validada pelo jurídico antes de qualquer decisão.')}`;
}

function htmlDash(o) {
  return `${cabecaIA('Resumo do período', o)}<p>${esc(o.resumo)}</p>
    ${secao('Destaques', o.destaques)}${secao('Pontos de atenção', o.pontos_atencao)}${secao('Recomendações', o.recomendacoes)}
    ${rodapeIA(o, 'Baseado só nos números do painel: confirme antes de decidir.')}`;
}
