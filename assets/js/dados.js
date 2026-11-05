/* BANCO DE DADOS LOCAL
 * Centraliza dados de demonstração e operações de leitura/gravação no localStorage.
 */
/* =====================================================================
   dados.js — "banco de dados" do sistema, guardado no navegador (localStorage).
   Na primeira vez que o sistema abre, ele cria dados de exemplo (semente).
   Tudo o que for criado ou alterado nas telas fica salvo aqui.
   Ordem: constantes > datas > semente > carregar/salvar > funções de tabela.
   ===================================================================== */

/* ---------- 1. Constantes usadas em várias telas ---------- */
// Nome da "gaveta" do localStorage onde o banco inteiro fica salvo (em JSON).
const CHAVE_BANCO = 'crm-revisional-banco-v1';
// Situações do cliente (botões da tela de Chats do comercial).
const CATEGORIAS = ['Já pagaram', 'Não querem mais', 'Já receberam a prestação de serviço', 'Ainda vão passar os dados para o procedimento ser realizado', 'Não responderam'];
// Etapas do funil de vendas (da primeira à última).
const ETAPAS = ['contatos', 'atenção', 'análise', 'contratos', 'promessas', 'vendas'];
// De onde o lead (cliente em potencial) veio. Usado no filtro "Lead".
const ORIGENS = ['WhatsApp', 'Instagram', 'Indicação', 'Site'];
// Nome mostrado para cada perfil de acesso.
const PERFIS = { comercial: 'Consultor', supervisor: 'Supervisor', gestor: 'Gestor', financeiro: 'Financeiro' };

/* ---------- 2. Datas em texto ---------- */
// As datas são guardadas como texto "2026-11-01" ou "2026-11-01T14:30", fáceis de comparar e ordenar.
const pad2 = n => String(n).padStart(2, '0');
const isoData = d => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const isoDataHora = d => `${isoData(d)}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
const agora = () => isoDataHora(new Date());

/* ---------- 3. Semente: dados de exemplo da primeira execução ---------- */
function semente() {
  // Gerador de números "aleatórios" sempre igual (mesma semente = mesmos dados em qualquer computador).
  let s = 20261;
  const rnd = () => (s = s * 16807 % 2147483647) / 2147483647;
  const int = (a, b) => a + Math.floor(rnd() * (b - a + 1)); // inteiro entre a e b
  const um = l => l[Math.floor(rnd() * l.length)];           // item qualquer de uma lista
  const hoje = new Date();
  // Data de "n dias atrás" em um horário comercial.
  const diasAtras = n => { const d = new Date(hoje); d.setDate(d.getDate() - n); d.setHours(int(8, 18), int(0, 59), 0, 0); return d; };

  // O banco: uma lista por tabela + "seq" (último id usado em cada tabela) + "config".
  const b = {
    seq: {}, config: {},
    equipes: [], usuarios: [], fornecedores: [], clientes: [], mensagensCliente: [], mensagensInternas: [],
    vendas: [], metas: [], tarefas: [], ligacoes: [], analises: [], chargebacks: [], taxas: []
  };
  // Insere um registro na tabela já com um id novo.
  const add = (t, o) => { o.id = b.seq[t] = (b.seq[t] || 0) + 1; b[t].push(o); return o; };

  // Equipes de vendas.
  add('equipes', { nome: 'Equipe Alfa' });
  add('equipes', { nome: 'Equipe Beta' });

  // Usuários: [nome, e-mail, senha, perfil, equipe].
  [
    ['Carla Mendes', 'gestor@empresa.com', 'gestor123', 'gestor', null],
    ['Marcos Lima', 'supervisor@empresa.com', 'super123', 'supervisor', 1],
    ['Paula Reis', 'paula@empresa.com', 'super123', 'supervisor', 2],
    ['Renata Alves', 'financeiro@empresa.com', 'fin123', 'financeiro', null],
    ['Nubia Celestino', 'comercial@empresa.com', 'comercial123', 'comercial', 1],
    ['Isabelli Vitória', 'isabelli@empresa.com', 'comercial123', 'comercial', 1],
    ['Ana Beatriz', 'ana@empresa.com', 'comercial123', 'comercial', 1],
    ['Mayara Vieira', 'mayara@empresa.com', 'comercial123', 'comercial', 1],
    ['Kayllaine Aparecida', 'kayllaine@empresa.com', 'comercial123', 'comercial', 2],
    ['Cassiana Barros', 'cassiana@empresa.com', 'comercial123', 'comercial', 2],
    ['Milena Cristina', 'milena@empresa.com', 'comercial123', 'comercial', 2],
    ['Beatriz Alves', 'beatriz@empresa.com', 'comercial123', 'comercial', 2]
  ].forEach(u => add('usuarios', { nome: u[0], email: u[1], senha: u[2], perfil: u[3], equipe_id: u[4] }));
  const consultores = b.usuarios.filter(u => u.perfil === 'comercial');

  // Financeiras (fornecedores) com quem os clientes têm contrato.
  ['Financeira Aurora', 'Banco Horizonte', 'Crédito Sul'].forEach(nome => add('fornecedores', { nome }));

  // Clientes de cada consultor, com conversas de exemplo.
  const NOMES = ['João', 'Maria', 'José', 'Ana', 'Carlos', 'Fernanda', 'Lucas', 'Juliana', 'Rafael', 'Patrícia', 'Bruno', 'Camila', 'Diego', 'Elisa', 'Fábio', 'Gabriela', 'Hugo', 'Larissa', 'Marcelo', 'Renata', 'Sérgio', 'Tatiane', 'Vinícius', 'Aline'];
  const SOBRENOMES = ['Silva', 'Souza', 'Oliveira', 'Santos', 'Pereira', 'Costa', 'Rodrigues', 'Almeida', 'Nascimento', 'Lima', 'Araújo', 'Ferreira', 'Rocha', 'Dias', 'Prado'];
  const CONVERSA = [
    [1, 'Olá! Vi o anúncio sobre revisão de financiamento. Como funciona?'],
    [0, 'Olá! Analisamos seu contrato e verificamos se há juros abusivos. Pode me enviar os dados do financiamento?'],
    [1, 'Posso sim. É um financiamento de veículo em 48 parcelas.'],
    [0, 'Perfeito! Já vou montar a análise e te envio ainda hoje.'],
    [1, 'Combinado, fico no aguardo.']
  ];
  consultores.forEach(c => {
    for (let i = 0; i < 9; i++) {
      const recente = i < 3; // os 3 primeiros são leads novos (últimos 7 dias)
      const categoria = recente ? 4 : i % 5; // espalha os demais pelas 5 situações
      // A etapa do funil combina com a situação do cliente.
      const etapa = recente ? int(0, 1) : [5, int(0, 3), 5, int(3, 4), int(0, 2)][categoria];
      const cli = add('clientes', {
        nome: um(NOMES) + ' ' + um(SOBRENOMES),
        cpf: `${int(100, 999)}.${int(100, 999)}.${int(100, 999)}-${pad2(int(0, 99))}`,
        telefone: `(11) 9${int(1000, 9999)}-${int(1000, 9999)}`,
        consultor_id: c.id,
        fornecedor_id: int(1, 3),
        origem: um(ORIGENS),
        categoria, etapa,
        criado_em: isoDataHora(diasAtras(recente ? int(0, 6) : int(10, 150)))
      });
      // Conversa: de 2 a 5 mensagens, as mais antigas primeiro.
      const qtd = int(2, 5);
      for (let k = 0; k < qtd; k++) {
        add('mensagensCliente', { cliente_id: cli.id, do_cliente: CONVERSA[k][0], texto: CONVERSA[k][1], criado_em: isoDataHora(diasAtras(qtd - k)) });
      }
      // Cliente que já fechou negócio (etapa "vendas") tem uma venda registrada.
      if (etapa === 5) {
        add('vendas', { consultor_id: c.id, cliente_id: cli.id, fornecedor_id: cli.fornecedor_id, origem: cli.origem, valor: int(20, 90) * 100, data: isoData(diasAtras(int(0, 60))) });
      }
    }
    // Histórico de vendas dos últimos 10 meses (clientes antigos), para os gráficos e o ranking.
    for (let m = 0; m < 10; m++) {
      const qtd = m === 0 ? int(1, 3) : int(2, 5);
      for (let k = 0; k < qtd; k++) {
        // m = 0 é o mês atual: a venda fica entre o dia 1 e hoje.
        const d = m === 0 ? diasAtras(int(0, hoje.getDate() - 1)) : new Date(hoje.getFullYear(), hoje.getMonth() - m, int(1, 28));
        add('vendas', { consultor_id: c.id, cliente_id: null, fornecedor_id: int(1, 3), origem: um(ORIGENS), valor: int(15, 90) * 100, data: isoData(d) });
      }
    }
    // Meta mensal: valor mínimo e valor de desafio.
    const minimo = c.equipe_id === 1 ? 15000 : 20000;
    b.metas.push({ usuario_id: c.id, minimo, desafio: minimo + 10000 });
    // Ligações dos últimos 30 dias (manuais e automáticas).
    const meus = b.clientes.filter(x => x.consultor_id === c.id);
    for (let k = 0; k < int(18, 30); k++) {
      const cli = um(meus);
      const status = um(['Atendeu', 'Atendeu', 'Caixa postal', 'Sem sinal']);
      add('ligacoes', {
        usuario_id: c.id, cliente_nome: cli.nome, telefone: cli.telefone, status,
        tipo: rnd() < 0.6 ? 'automatica' : 'manual',
        duracao: status === 'Atendeu' ? int(2, 16) : 0, // minutos
        criado_em: isoDataHora(diasAtras(int(0, 30)))
      });
    }
    // Tarefas do Kanban (coluna 0 = A fazer, 1 = Em andamento, 2 = Concluído).
    [['Ligar para clientes que não responderam', 0], ['Enviar análise para aprovação do supervisor', 1], ['Conferir documentos dos novos leads', 0], ['Atualizar situação dos clientes no chat', 2]]
      .forEach(t => add('tarefas', { usuario_id: c.id, titulo: t[0], coluna: t[1] }));
  });

  // Ligações dos supervisores.
  b.usuarios.filter(u => u.perfil === 'supervisor').forEach(u => {
    for (let k = 0; k < 6; k++) {
      const cli = um(b.clientes);
      add('ligacoes', { usuario_id: u.id, cliente_nome: cli.nome, telefone: cli.telefone, status: 'Atendeu', tipo: 'manual', duracao: int(3, 10), criado_em: isoDataHora(diasAtras(int(0, 15))) });
    }
  });

  // Conversas internas (entre usuários e em grupo de equipe).
  [
    [2, null, 1, 'Bom dia, equipe! Foco nas análises pendentes hoje.', 1],
    [5, null, 1, 'Bom dia! Já comecei pelas que vencem hoje.', 1],
    [5, 2, null, 'Marcos, enviei a análise de um cliente para você aprovar.', 0],
    [2, 5, null, 'Perfeito, Nubia. Vou revisar e te retorno.', 0],
    [1, 2, null, 'Marcos, preciso do fechamento da Equipe Alfa até sexta.', 2],
    [3, null, 2, 'Equipe Beta, lembrem de atualizar a situação dos clientes no chat.', 1],
    [4, 1, null, 'Carla, os chargebacks do mês já estão registrados no sistema.', 1]
  ].forEach(m => add('mensagensInternas', { de_id: m[0], para_id: m[1], equipe_id: m[2], texto: m[3], criado_em: isoDataHora(diasAtras(m[4])) }));

  // Exemplo de análise revisional já salva.
  add('analises', {
    consultor_id: 5, cliente: 'João Silva', cpf: '123.456.789-00', financeira: 'Financeira Aurora', modelo: 'Onix 1.0 2022',
    tipo: 'v', divisao: 4, valor_financiado: 60000, meses: 48, parcela: 1950, qt_pagas: 12, qt_atrasadas: 0,
    correcao: '26110101', criado_em: isoDataHora(diasAtras(2))
  });

  // Chargebacks (contestações de pagamento no cartão).
  for (let k = 0; k < 5; k++) {
    const cli = um(b.clientes);
    add('chargebacks', { cliente: cli.nome, telefone: cli.telefone, valor: int(5, 40) * 50, data: isoDataHora(diasAtras(int(0, 40))) });
  }

  // Taxas da maquininha por bandeira e número de parcelas (%).
  ['Visa', 'Mastercard', 'Elo', 'Hipercard'].forEach((bandeira, i) => {
    for (let p = 1; p <= 5; p++) b.taxas.push({ bandeira, parcelas: p, taxa: +(1.99 + i * 0.3 + (p - 1) * 1.1).toFixed(2) });
  });

  // Período de apuração das metas: o mês atual inteiro.
  b.config.periodo = {
    inicio: isoData(new Date(hoje.getFullYear(), hoje.getMonth(), 1)),
    fim: isoData(new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0))
  };
  return b;
}

/* ---------- 4. Carregar e salvar ---------- */
// Lê o banco do localStorage; se não existir (primeiro acesso), cria a semente e salva.
function carregarBanco() {
  try {
    const texto = localStorage.getItem(CHAVE_BANCO);
    if (texto) return JSON.parse(texto);
  } catch (e) {} // navegador bloqueou o armazenamento: segue com a semente em memória
  const novo = semente();
  salvarBanco(novo);
  return novo;
}

// Grava o banco inteiro no localStorage.
function salvarBanco(b = BD) {
  try { localStorage.setItem(CHAVE_BANCO, JSON.stringify(b)); } catch (e) {}
}

// Apaga tudo e volta aos dados de exemplo.
function restaurarBanco() {
  try { localStorage.removeItem(CHAVE_BANCO); } catch (e) {}
  BD = carregarBanco();
}

// BD = o banco em uso. Todas as telas leem e alteram esta variável.
let BD = carregarBanco();

/* ---------- 5. Funções de tabela (inserir, alterar, remover) ---------- */
// Insere um registro com id novo e salva. Ex.: inserir('tarefas', { titulo: 'Ligar', coluna: 0 })
function inserir(tabela, obj) {
  obj.id = BD.seq[tabela] = (BD.seq[tabela] || 0) + 1;
  BD[tabela].push(obj);
  salvarBanco();
  return obj;
}

// Altera os campos de um registro pelo id e salva.
function alterar(tabela, id, campos) {
  const reg = BD[tabela].find(r => r.id === id);
  if (reg) { Object.assign(reg, campos); salvarBanco(); }
  return reg;
}

// Remove um registro pelo id e salva.
function remover(tabela, id) {
  BD[tabela] = BD[tabela].filter(r => r.id !== id);
  salvarBanco();
}
