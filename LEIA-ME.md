# CRM Comercial

**Site publicado:** https://sistema-crm-comercial.vercel.app · **Código:** https://github.com/Manuttonel/crm-comercial

Sistema web de CRM para o setor comercial revisional (projeto de Engenharia de Software – UMC).
Integra os setores **Comercial**, **Supervisão**, **Gestão** e **Financeiro**, com login, chats,
discadora, análise revisional, dashboards, gamificação/metas, controle financeiro e **inteligência
artificial** para apoiar as análises (veja a seção 7).

Feito só com **HTML, CSS e JavaScript**: não precisa instalar nada nem rodar servidor.
Os dados ficam salvos no próprio navegador (`localStorage`).

---

## 1. Como abrir no computador

**Opção A (mais simples):** dê dois cliques no arquivo `index.html` da raiz do projeto.

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
- **Inteligência artificial:** na tela **Análises**, o botão **Analisar com IA** escreve um parecer sobre o
  financiamento (viabilidade, pontos de atenção, argumentos e uma mensagem pronta para o cliente). Nos
  **Dashboards**, o botão **Analisar com IA** resume os números do painel e sugere ações.

**Dica para a apresentação:** abra duas abas (ou uma janela anônima), entre como **supervisor** em uma
e como **consultor** na outra. As mensagens do chat e as vendas aparecem na outra aba na hora.

> Importante: como os dados ficam no navegador, cada computador/navegador tem a sua própria cópia.
> Uma venda feita no seu computador não aparece no computador do professor. Para isso seria
> preciso um banco de dados online (veja a seção 6, Supabase, que é **opcional**).

## 4. Estrutura dos arquivos

O projeto foi organizado por responsabilidade. Cada tela tem sua própria pasta, com HTML e JavaScript. Os recursos compartilhados ficam em `assets/`.

```text
crm-comercial/
├── index.html                 # Entrada: encaminha para o login
├── assets/
│   ├── css/global.css         # Estilos compartilhados
│   └── js/                   # Dados, sessão, navegação e IA
├── telas/
│   ├── login/                # index.html e script.js
│   ├── metas/
│   ├── chats-comercial/
│   ├── analises/
│   ├── discadora/
│   ├── dashboards/
│   ├── chats/
│   ├── gamificacao/
│   ├── financeiro/
│   └── configuracoes/
├── api/ia.js                 # Função da Vercel que chama a IA
├── vercel.json
└── LEIA-ME.md
```

**Como a organização funciona:**
- `telas/<nome>/index.html`: estrutura visual e carregamento dos arquivos da tela.
- `telas/<nome>/script.js`: regras e interações exclusivas daquela tela.
- `assets/css/global.css`: identidade visual e componentes compartilhados.
- `assets/js/`: funções e dados utilizados por mais de uma tela.

Os JavaScripts receberam comentários de identificação e responsabilidade; os comentários que já existiam foram preservados.

---

## 5. Publicar no GitHub e na Vercel (passo a passo)

### 5.1 Subir para o GitHub
1. Entre em <https://github.com> e clique em **New** (novo repositório).
2. Nome: `crm-comercial` → deixe **Public** → clique em **Create repository**.
3. Na página do repositório vazio, clique em **uploading an existing file**.
4. Arraste **todos os arquivos e pastas desta pasta** e clique em **Commit changes**.

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
5. Clique em **Deploy**. Em cerca de 1 minuto a Vercel mostra o link (ex.: `sistema-crm-comercial.vercel.app`).
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


---

## 7. Inteligência artificial (análises com IA)

**O que faz.** Duas telas ganharam o botão **Analisar com IA**:
- **Análises (consultor):** a IA recebe os dados do financiamento e os cálculos do sistema e escreve um
  parecer: viabilidade (alta, média ou baixa), resumo, pontos de atenção, argumentos, próximo passo e uma
  mensagem sugerida ao cliente (com botão **Copiar mensagem**). O parecer é salvo junto com a análise.
- **Dashboards (supervisor e gestor):** a IA lê os números do painel (já com os filtros escolhidos) e escreve
  destaques, pontos de atenção e recomendações.

**Como funciona.** O navegador manda os dados para `/api/ia` (função da Vercel). Só essa função conhece a
chave da IA; ela monta o pedido, chama a IA, valida a resposta e devolve o resultado. Nunca coloque a chave
dentro de um arquivo `.js` ou `.html` do site: qualquer pessoa conseguiria vê-la.

### 7.1 Ativar na Vercel
1. Crie uma chave de API em <https://console.anthropic.com> (menu **API Keys**). Aproveite para definir um
   **limite de gasto mensal** (menu **Limits**).
2. Na Vercel, abra o projeto → **Settings → Environment Variables** e crie:
   - `ANTHROPIC_API_KEY` = a chave criada (marque Production, Preview e Development);
   - (opcional) `ANTHROPIC_MODEL` = o nome do modelo, se quiserem trocar o padrão (`claude-sonnet-5-5`).
3. Envie os arquivos novos para o GitHub (incluindo a pasta `api` e o `vercel.json`) e, se o projeto já
   estava publicado, faça **Deployments → ⋯ → Redeploy**: as variáveis só valem em publicações novas.
4. Teste: entre como consultor → **Análises** → preencha valor financiado, meses e parcela → **Analisar com IA**.

### 7.2 Se a IA não estiver disponível
Sem a chave, sem internet, com a IA fora do ar ou abrindo o sistema direto do computador (sem a Vercel), o
botão mostra uma **análise automática por regras**, marcada com a etiqueta **AUTO**. Assim a apresentação
nunca fica sem resposta. Quando a IA responde, a etiqueta é **IA**.

### 7.3 Privacidade e cuidados
- **Nome e CPF do cliente não são enviados** à IA: vão só os dados do financiamento (valores, meses,
  parcelas, financeira). No Dashboard vão só totais e o primeiro nome dos consultores.
- O parecer é **apoio à decisão**: é uma estimativa e deve ser validada pelo jurídico. A IA é instruída a não
  prometer resultado nem citar lei além do art. 51 do CDC (já usado na tela).
- Como o site é público, qualquer pessoa com o link poderia chamar `/api/ia` e gastar créditos. Por isso o
  limite de gasto do passo 1 é importante. Em um sistema real, a função deveria exigir um login de verdade.
