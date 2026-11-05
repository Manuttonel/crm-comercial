/* api/ia.js — função da Vercel que conversa com a IA (Claude, da Anthropic).
   A chave da API fica SÓ aqui, em variável de ambiente (nunca no código do site).
   O navegador manda os dados; esta função monta o pedido, chama a IA e devolve um JSON validado. */

const MODELO = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5';
const LIMITE_CORPO = 20000; // bytes aceitos no pedido (evita abuso)

/* ---------- Helpers de limpeza: só passa o que esperamos ---------- */
const num = v => (Number.isFinite(+v) ? Math.round(+v * 100) / 100 : 0);
const txt = (v, n = 60) => String(v ?? '').replace(/[\r\n]+/g, ' ').slice(0, n);
const lista = (v, n) => (Array.isArray(v) ? v.slice(0, n) : []);

/* ---------- Instruções (system) de cada tipo de análise ---------- */
const BASE = 'Responda em português do Brasil, com linguagem simples e direta. Use SOMENTE os números recebidos: não invente valores, taxas de mercado, leis ou jurisprudência. Responda SOMENTE com um JSON válido, sem nenhum texto fora do JSON e sem blocos de código.';

const SISTEMAS = {
  analise: `Você é um analista sênior de revisão de contratos de financiamento em um setor comercial revisional no Brasil. Você recebe os dados de UM contrato e os cálculos já feitos pelo sistema, e escreve um parecer de apoio ao consultor.
Regras: a única base legal que pode citar é o art. 51 do Código de Defesa do Consumidor (Lei 8.078/1990), e apenas como indício de possível abusividade, sem afirmar que ela está comprovada. Não prometa resultado nem prazo. O parecer é uma estimativa e deve ser validado pelo jurídico. Se não houver juros (total pago menor ou igual ao financiado), diga que não há indício e recomende não prosseguir com a revisão.
${BASE}
Formato: {"viabilidade":"alta|media|baixa","resumo":"até 300 caracteres","pontos_atencao":["até 4 itens curtos"],"argumentos":["até 3 itens curtos"],"proximo_passo":"1 frase","mensagem_cliente":"até 350 caracteres, tom cordial de WhatsApp, sem prometer resultado"}`,

  dashboard: `Você é um analista de performance comercial. Você recebe indicadores agregados de uma equipe (ou da empresa) e escreve uma análise curta para o supervisor ou gestor.
Regras: o mês atual ainda está em andamento (veja "dia_do_mes"), então não compare o total parcial com o mês anterior completo como se fosse queda real: avalie o ritmo. Não invente causas; quando os dados forem insuficientes, diga isso. Cite nomes de consultores apenas como aparecem nos dados.
${BASE}
Formato: {"resumo":"até 300 caracteres","destaques":["até 4 itens curtos"],"pontos_atencao":["até 4 itens curtos"],"recomendacoes":["até 4 ações práticas e curtas"]}`
};

/* ---------- Monta a mensagem do usuário só com os campos permitidos ---------- */
function montarDados(tipo, d) {
  if (tipo === 'analise') {
    return {
      tipo_financiamento: txt(d.tipo_financiamento, 20), financeira: txt(d.financeira), modelo: txt(d.modelo),
      valor_financiado: num(d.valor_financiado), meses: num(d.meses), parcela: num(d.parcela),
      qt_pagas: num(d.qt_pagas), qt_atrasadas: num(d.qt_atrasadas), divisao_dos_juros: num(d.divisao),
      juros_total: num(d.juros_total), taxa_mensal_implicita_pct: num(d.taxa_mensal_pct),
      situacao: txt(d.situacao, 30), nova_parcela: num(d.nova_parcela), reducao_por_parcela: num(d.reducao_parcela),
      estorno: num(d.estorno), reducao_total: num(d.reducao_total)
    };
  }
  return {
    escopo: txt(d.escopo, 40), lead: txt(d.lead, 20), mes: txt(d.mes, 20), dia_do_mes: num(d.dia_do_mes),
    faturamento_mes: num(d.faturamento_mes), vendas_mes: num(d.vendas_mes),
    faturamento_mes_anterior: num(d.faturamento_mes_anterior), vendas_mes_anterior: num(d.vendas_mes_anterior),
    funil_pct_por_etapa: lista(d.funil, 8).map(x => ({ etapa: txt(x.etapa, 20), pct: num(x.pct) })),
    vendas_por_financeira: lista(d.financeiras, 8).map(x => ({ financeira: txt(x.financeira), mes: num(x.mes), mes_anterior: num(x.mes_anterior) })),
    ligacoes_tempo_medio_min: lista(d.ligacoes, 12).map(x => ({ consultor: txt(x.consultor, 20), manual: num(x.manual), automatica: num(x.automatica) })),
    consultores: lista(d.consultores, 12).map(x => ({ nome: txt(x.nome, 20), vendas_mes: num(x.vendas_mes), faturamento_mes: num(x.faturamento_mes), meta_minima: num(x.meta_minima), meta_desafio: num(x.meta_desafio) }))
  };
}

/* ---------- Valida e limita a resposta da IA ---------- */
const itens = (v, n, max = 220) => lista(v, n).map(s => txt(s, max)).filter(Boolean);
function normalizar(tipo, o) {
  if (tipo === 'analise') {
    const v = ['alta', 'media', 'baixa'].includes(o.viabilidade) ? o.viabilidade : 'media';
    return { viabilidade: v, resumo: txt(o.resumo, 400), pontos_atencao: itens(o.pontos_atencao, 4), argumentos: itens(o.argumentos, 3), proximo_passo: txt(o.proximo_passo, 250), mensagem_cliente: txt(o.mensagem_cliente, 450) };
  }
  return { resumo: txt(o.resumo, 400), destaques: itens(o.destaques, 4), pontos_atencao: itens(o.pontos_atencao, 4), recomendacoes: itens(o.recomendacoes, 4) };
}

// A IA às vezes envolve o JSON em texto: pegamos do primeiro "{" ao último "}".
function extrairJSON(t) {
  const i = t.indexOf('{'), f = t.lastIndexOf('}');
  if (i < 0 || f < i) throw new Error('sem JSON');
  return JSON.parse(t.slice(i, f + 1));
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ erro: 'Use POST.' });
  if (!process.env.ANTHROPIC_API_KEY) return res.status(503).json({ erro: 'IA não configurada no servidor.' });

  try {
    const corpo = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    if (JSON.stringify(corpo).length > LIMITE_CORPO) return res.status(413).json({ erro: 'Pedido grande demais.' });
    const tipo = corpo.tipo;
    if (!SISTEMAS[tipo]) return res.status(400).json({ erro: 'Tipo inválido.' });

    const dados = montarDados(tipo, corpo.dados || {});
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: MODELO,
        max_tokens: 900,
        system: SISTEMAS[tipo],
        messages: [{ role: 'user', content: 'Dados para análise (JSON):\n' + JSON.stringify(dados) }]
      })
    });
    if (!r.ok) {
      console.error('Erro da API de IA:', r.status, (await r.text()).slice(0, 300));
      return res.status(502).json({ erro: 'A IA não respondeu agora.' });
    }
    const j = await r.json();
    const texto = (j.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
    return res.status(200).json({ resultado: normalizar(tipo, extrairJSON(texto)) });
  } catch (e) {
    console.error('Falha na função de IA:', e.message);
    return res.status(502).json({ erro: 'Não foi possível gerar a análise.' });
  }
};
