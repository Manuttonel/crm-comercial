/* TELA: LOGIN
 * Responsabilidade: Valida credenciais, alterna entre login e cadastro e inicia a sessão.
 * Contém a lógica específica desta tela.
 */
/* login.js — lógica da tela de login (index.html). Usa BD (dados.js) e NAV/FILE (app.js). */

// Leva o usuário para a tela inicial do seu perfil (replace não deixa o login no histórico).
const entrar = u => location.replace(FILE[NAV[u.perfil][0]]);

// Se já existe um login ativo, pula a tela de login.
if (EU) entrar(EU);

// Executa quando o formulário é enviado (botão Login ou tecla Enter).
$('#lf').onsubmit = e => {
  e.preventDefault(); // impede a página de recarregar
  // Procura o e-mail digitado (sem espaços, em minúsculas) na tabela de usuários.
  const email = $('#em').value.trim().toLowerCase();
  const u = BD.usuarios.find(x => x.email === email);
  // E-mail não existe OU senha diferente: mostra erro e pede a senha novamente.
  if (!u || u.senha !== $('#pw').value) {
    $('#err').textContent = 'E-mail ou senha incorretos. Digite novamente.';
    $('#pw').value = '';
    $('#pw').focus();
    return;
  }
  // Login correto: guarda o id do usuário. "Lembrar" marcado = continua logado ao fechar o navegador.
  try {
    const onde = $('#lb').checked ? localStorage : sessionStorage;
    onde.setItem(CHAVE_SESSAO, JSON.stringify({ uid: u.id }));
  } catch (x) {}
  entrar(u);
};

// "Esqueceu a senha?": no sistema real o gestor redefine a senha.
$('#esq').onclick = () => $('#err').textContent = 'Fale com o gestor da sua equipe para redefinir a senha.';

// Lista de acessos de teste: um usuário de cada perfil. Clicar preenche o formulário.
const exemplos = ['comercial', 'supervisor', 'gestor', 'financeiro'].map(p => BD.usuarios.find(u => u.perfil === p)).filter(Boolean);
$('#demo').innerHTML = exemplos.map(u => `<button type="button" data-id="${u.id}"><b>${PERFIS[u.perfil]}</b> ${esc(u.email)}</button>`).join('');
$$('#demo button').forEach(b => b.onclick = () => {
  const u = BD.usuarios.find(x => x.id === +b.dataset.id);
  $('#em').value = u.email;
  $('#pw').value = u.senha;
  $('#err').textContent = '';
});

/* ---------- Criar conta ---------- */
// Troca entre o formulário de login e o de cadastro.
function mostrar(cadastro) {
  $('#lf').hidden = cadastro;
  $('#cf').hidden = !cadastro;
  $('#err').textContent = $('#cErr').textContent = '';
  (cadastro ? $('#cNome') : $('#em')).focus();
}
$('#irCad').onclick = () => mostrar(true);
$('#irLogin').onclick = () => mostrar(false);

// Opções de setor e de equipe.
$('#cPf').innerHTML = '<option value="">Setor...</option>' + Object.keys(PERFIS).map(p => `<option value="${p}">${PERFIS[p]}</option>`).join('');
$('#cEq').innerHTML = BD.equipes.map(e => `<option value="${e.id}">${esc(e.nome)}</option>`).join('');
// Só consultor e supervisor pertencem a uma equipe.
const temEquipe = () => ['comercial', 'supervisor'].includes($('#cPf').value);
$('#cPf').onchange = () => $('#cEqL').hidden = !temEquipe();
$('#cEqL').hidden = true;

$('#cf').onsubmit = e => {
  e.preventDefault();
  const nome = $('#cNome').value.trim(), email = $('#cEm').value.trim().toLowerCase(), perfil = $('#cPf').value;
  const erro = t => { $('#cErr').textContent = t; };
  // Validações: nome, e-mail novo, senha confirmada e setor escolhido.
  if (nome.length < 3) return erro('Digite seu nome completo.');
  if (BD.usuarios.some(u => u.email === email)) return erro('Já existe uma conta com este e-mail.');
  if ($('#cPw').value.length < 6) return erro('A senha precisa ter pelo menos 6 caracteres.');
  if ($('#cPw').value !== $('#cPw2').value) return erro('As senhas não são iguais.');
  if (!perfil) return erro('Escolha o seu setor.');
  // Grava o novo usuário. Consultor novo já ganha uma meta inicial (o supervisor pode mudar depois).
  const u = inserir('usuarios', { nome, email, senha: $('#cPw').value, perfil, equipe_id: temEquipe() ? +$('#cEq').value : null });
  if (perfil === 'comercial') { BD.metas.push({ usuario_id: u.id, minimo: 15000, desafio: 25000 }); salvarBanco(); }
  // Já entra no sistema com a conta nova.
  try { sessionStorage.setItem(CHAVE_SESSAO, JSON.stringify({ uid: u.id })); } catch (x) {}
  entrar(u);
};

// Apaga tudo o que foi criado e volta aos dados de exemplo.
$('#rst').onclick = () => {
  if (!confirm('Apagar todas as alterações e voltar aos dados de exemplo?')) return;
  restaurarBanco();
  $('#err').textContent = 'Dados de exemplo restaurados.';
};
