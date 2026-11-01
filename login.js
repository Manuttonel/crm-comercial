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

// Apaga tudo o que foi criado e volta aos dados de exemplo.
$('#rst').onclick = () => {
  if (!confirm('Apagar todas as alterações e voltar aos dados de exemplo?')) return;
  restaurarBanco();
  $('#err').textContent = 'Dados de exemplo restaurados.';
};
