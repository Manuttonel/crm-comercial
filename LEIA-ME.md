# CRM Comercial

Sistema web de CRM para o setor comercial revisional (projeto de Engenharia de Software – UMC).

**Site publicado:** https://crm-comercial-umc.vercel.app · **Código:** https://github.com/Manuttonel/crm-comercial
Integra os setores **Comercial**, **Supervisão**, **Gestão** e **Financeiro**, com login, chats,
discadora, análise revisional, dashboards, gamificação/metas e controle financeiro.

Feito só com **HTML, CSS e JavaScript**: não precisa instalar nada nem rodar servidor.
Os dados ficam salvos no próprio navegador (`localStorage`).

---

## 1. Como abrir no computador

**Opção A (mais simples):** dê dois cliques no arquivo `index.html`.

**Opção B (recomendada no VS Code):** instale a extensão **Live Server**, clique com o botão
direito no `index.html` e escolha **Open with Live Server**.

## 2. Logins de teste

| Perfil      | E-mail                   | Senha        | Telas                                              |
|-------------|--------------------------|--------------|----------------------------------------------------|
| Consultor   | comercial@empresa.com    | comercial123 | Gamificação/Metas, Chats, Análises, Discadora      |
| Supervisor  | supervisor@empresa.com   | super123     | Dashboards, Chats, Discadora, Gamificação/Metas    |
| Gestor      | gestor@empresa.com       | gestor123    | Dashboards, Chats, Discadora, Gamificação/Metas    |
| Financeiro  | financeiro@empresa.com   | fin123       | Home, Configurações                                |

Outros consultores: `isabelli@`, `ana@`, `mayara@` (Equipe Alfa) e `kayllaine@`, `cassiana@`,
`milena@`, `beatriz@` (Equipe Beta), todos `@empresa.com` com a senha `comercial123`.
A supervisora da Equipe Beta é `paula@empresa.com` / `super123`.

**Criar conta:** na tela de login, clique em **Criar conta**, preencha nome, e-mail, senha (mínimo 6
caracteres), setor e equipe (para consultor e supervisor). A conta já entra no sistema e depois pode
fazer login normalmente. Consultor novo começa com meta de R$ 15.000 (o supervisor pode alterar).

Na tela de login, em **Acessos de demonstração**, clicar num perfil já preenche o e-mail e a senha.
O link **Restaurar dados de exemplo** apaga tudo o que foi alterado e volta ao estado inicial.

## 3. O que dá para fazer (os dados ficam salvos)

- **Consultor:** cadastrar cliente, conversar, registrar a resposta do cliente, mudar a situação e a
  etapa do funil, registrar venda, criar/mover/excluir tarefas no Kanban, fazer e salvar análises
  revisionais, ligar pela discadora (manual ou automática simulada) e conversar com a equipe (botão "Equipe").
- **Supervisor/Gestor:** dashboards com filtros, chat interno (grupos e pessoas), definir metas dos
  consultores, escolher o período e ver pontos de atenção calculados.
- **Financeiro:** faturamento, evolução mensal, ranking, cadastro/remoção de fornecedores, chargebacks e taxas.

**Dica para a apresentação:** abra duas abas (ou uma janela anônima), entre como **supervisor** em uma
e como **consultor** na outra. As mensagens do chat e as vendas aparecem na outra aba na hora.

> Importante: como os dados ficam no navegador, cada computador/navegador tem a sua própria cópia.
> Uma venda feita no seu computador não aparece no computador do professor. Para isso seria
> preciso um banco de dados online (veja a seção 6, Supabase, que é **opcional**).

## 4. Estrutura dos arquivos

| Arquivo | Para que serve |
|---|---|
| `index.html` + `login.js` | Tela de login |
| `dados.js` | "Banco de dados": tabelas, dados de exemplo e funções inserir/alterar/remover |
| `app.js` | Código compartilhado: sessão, menu por perfil, controle de acesso, gráficos, chat interno |
| `style.css` | Visual de todas as telas |
| `metas`, `chats-comercial`, `analises`, `discadora` (.html + .js) | Telas do consultor |
| `dashboards`, `chats`, `gamificacao` (.html + .js) | Telas do supervisor e do gestor |
| `financeiro`, `configuracoes` (.html + .js) | Telas do financeiro |

Cada tela tem um `.html` (estrutura) e um `.js` com o mesmo nome (lógica). Os comentários explicam o código.

---

## 5. Publicar no GitHub e na Vercel (passo a passo)

### 5.1 Subir para o GitHub
1. Entre em <https://github.com> e clique em **New** (novo repositório).
2. Nome: `crm-comercial` → deixe **Public** → clique em **Create repository**.
3. Na página do repositório vazio, clique em **uploading an existing file**.
4. Arraste **todos os arquivos desta pasta** (não a pasta, os arquivos de dentro) e clique em **Commit changes**.

   *Se preferir pelo terminal (com o Git instalado), dentro desta pasta:*
   ```bash
   git init
   git add .
   git commit -m "CRM Comercial"
   git branch -M main
   git remote add origin https://github.com/SEU-USUARIO/crm-comercial.git
   git push -u origin main
   ```

### 5.2 Publicar na Vercel
1. Entre em <https://vercel.com> com a conta do GitHub (**Continue with GitHub**).
2. Clique em **Add New… → Project**.
3. Ao lado do repositório `crm-comercial`, clique em **Import**.
4. Em **Framework Preset** deixe **Other**. Não precisa mudar Build Command nem Output Directory.
5. Clique em **Deploy**. Em cerca de 1 minuto a Vercel mostra o link (ex.: `crm-comercial-umc.vercel.app`).
6. Sempre que vocês alterarem algo no GitHub, a Vercel publica a nova versão sozinha.

**Não precisa de Supabase** para o sistema funcionar na Vercel: login, telas e dados funcionam normalmente.

---

## 6. (Opcional) Supabase: só se precisarem de dados compartilhados

Usem o Supabase **apenas** se o professor exigir que os dados sejam os mesmos em qualquer computador
(ex.: uma venda feita no celular aparecer no notebook). Se não for exigido, pulem esta parte.

### 6.1 Criar o banco
1. Entre em <https://supabase.com> → **Start your project** → entre com o GitHub.
2. **New project** → escolha um nome (`crm-comercial`), crie uma senha do banco (guarde-a) e a região
   **South America (São Paulo)** → **Create new project**. Espere uns 2 minutos.
3. No menu da esquerda, abra **SQL Editor** → **New query**, cole o código abaixo e clique em **Run**:
   ```sql
   -- Uma tabela que guarda o banco inteiro do sistema em formato JSON
   create table banco (
     id text primary key,
     dados jsonb not null,
     atualizado_em timestamptz default now()
   );

   -- Permite que o site leia e grave (aceitável para um trabalho acadêmico, não para produção)
   alter table banco enable row level security;
   create policy "acesso publico" on banco for all using (true) with check (true);
   ```
4. Vá em **Project Settings → API** e copie:
   - **Project URL** (ex.: `https://abcd1234.supabase.co`)
   - **anon public key** (uma chave longa que começa com `eyJ...`)

### 6.2 Ligar o sistema ao Supabase
1. Em **todos** os arquivos `.html`, logo **antes** da linha `<script src="dados.js"></script>`, adicione:
   ```html
   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js"></script>
   ```
2. No final do `dados.js`, adicione (trocando a URL e a chave pelas suas):
   ```js
   /* ---------- 6. Sincronização com o Supabase (opcional) ---------- */
   const SUPA = supabase.createClient('https://SEU-PROJETO.supabase.co', 'SUA-ANON-KEY');

   const CHAVE_VERSAO = 'crm-revisional-versao'; // quando foi a última gravação que este navegador conhece

   // Ao salvar no navegador, envia o banco também para o Supabase.
   const salvarLocal = salvarBanco;
   salvarBanco = function (b = BD) {
     salvarLocal(b);
     const versao = new Date().toISOString();
     localStorage.setItem(CHAVE_VERSAO, versao);
     SUPA.from('banco').upsert({ id: 'principal', dados: b, atualizado_em: versao }).then(() => {});
   };

   // Ao abrir uma tela, confere se o Supabase tem uma versão mais nova e, se tiver, baixa e recarrega.
   SUPA.from('banco').select('dados, atualizado_em').eq('id', 'principal').maybeSingle().then(({ data }) => {
     if (!data) return salvarBanco(BD); // primeira vez: envia os dados de exemplo
     if (new Date(data.atualizado_em).toISOString() !== localStorage.getItem(CHAVE_VERSAO)) {
       localStorage.setItem(CHAVE_BANCO, JSON.stringify(data.dados));
       localStorage.setItem(CHAVE_VERSAO, new Date(data.atualizado_em).toISOString());
       location.reload();
     }
   });
   ```
3. Envie as alterações para o GitHub. A Vercel publica sozinha.
4. Teste: registre uma venda em um computador, abra o link em outro e entre como financeiro.

Limitação dessa versão simples: se duas pessoas salvarem no mesmo segundo, vale a última gravação.
Para um trabalho acadêmico isso é suficiente.
