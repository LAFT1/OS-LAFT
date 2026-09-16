# Ordens de Serviço — versão autônoma (fora do Claude.ai)

Esta é a mesma aplicação de Ordens de Serviço, adaptada para rodar fora do Claude.ai:
- O armazenamento (`window.storage`) foi trocado por um banco de dados real no **Supabase** (gratuito).
- Foi adicionada uma tela de **login** (Supabase Auth) — só quem tiver uma conta criada consegue entrar.
- O restante do app (formulário de OS, geração de PDF, dashboard etc.) é **exatamente o mesmo código** já testado.

Siga os passos abaixo na ordem. Leva uns 15–20 minutos na primeira vez.

## 1. Criar o projeto no Supabase (banco de dados + login)

1. Acesse [supabase.com](https://supabase.com) e crie uma conta gratuita.
2. Clique em **New project**. Escolha um nome (ex: `os-empresa`) e uma senha de banco (guarde-a, mas você não vai precisar dela no dia a dia).
3. Aguarde o projeto ser criado (leva 1–2 minutos).

## 2. Criar a tabela de dados

1. No menu lateral do projeto, abra **SQL Editor**.
2. Clique em **New query**.
3. Abra o arquivo `supabase-schema.sql` (nesta pasta), copie todo o conteúdo, cole no editor e clique em **Run**.
4. Isso cria a tabela `kv_store` (onde ficam as OS e os dados da empresa) e as regras de acesso (só usuários logados podem ler/gravar).

## 3. Pegar as chaves do projeto

1. No menu lateral, vá em **Project Settings > API**.
2. Copie a **Project URL** e a chave **anon public**.

## 4. Configurar o projeto localmente

1. Copie o arquivo `.env.example` para um novo arquivo chamado `.env`.
2. Cole a URL e a chave que você copiou no passo anterior:
   ```
   VITE_SUPABASE_URL=https://seu-projeto.supabase.co
   VITE_SUPABASE_ANON_KEY=sua-chave-aqui
   ```
3. Instale as dependências:
   ```
   npm install
   ```
4. Teste localmente:
   ```
   npm run dev
   ```
   Abra o endereço mostrado no terminal (algo como `http://localhost:5173`). Você deve ver a tela de login.

## 5. Criar os usuários da equipe (sem cadastro público)

Por segurança, o cadastro público está desabilitado — só entra quem você convidar.

1. No Supabase, vá em **Authentication > Users**.
2. Clique em **Add user > Invite user** (ou **Create new user**, se preferir definir a senha você mesmo em vez de enviar convite por e-mail).
3. Repita para cada pessoa da equipe que vai usar o sistema.
4. Confirme que o cadastro público está desligado em **Authentication > Sign In / Providers** (a opção de "permitir novos cadastros" deve estar desmarcada) — assim só quem você convidou consegue entrar.

## 6. Subir o projeto para o GitHub

1. Crie um repositório novo no GitHub (pode ser público ou privado).
2. Suba esta pasta inteira para esse repositório (pela interface web do GitHub, arrastando os arquivos, ou via `git push` se preferir linha de comando).

## 7. Cadastrar as chaves do Supabase como "Secrets" do repositório

O build acontece dentro do GitHub (via GitHub Actions), então ele precisa das chaves do passo 3 cadastradas ali — **não** no arquivo `.env` (esse arquivo é só para rodar localmente e nunca é enviado ao GitHub, por causa do `.gitignore`).

1. No repositório, vá em **Settings > Secrets and variables > Actions**.
2. Clique em **New repository secret** e crie:
   - `VITE_SUPABASE_URL` → a Project URL do passo 3.
   - `VITE_SUPABASE_ANON_KEY` → a chave anon public do passo 3.

## 8. Ativar o GitHub Pages

1. No repositório, vá em **Settings > Pages**.
2. Em **Source**, selecione **GitHub Actions**.

Isso é tudo. O repositório já vem com um workflow pronto (`.github/workflows/deploy.yml`) que builda o projeto e publica automaticamente toda vez que houver um push na branch `main`. Vá na aba **Actions** do repositório para acompanhar — quando o job "Deploy para GitHub Pages" terminar com ✅, seu link estará disponível em **Settings > Pages** (algo como `https://seu-usuario.github.io/nome-do-repo/`).

Se você acabou de ativar o Pages pela primeira vez e nenhum workflow rodou ainda, vá em **Actions > Deploy para GitHub Pages > Run workflow** para disparar manualmente.

## 9. Distribuir o link

Envie o link final para a equipe. Cada pessoa faz login com a conta que você criou/convidou no passo 5.

---

## Avisos importantes

- **Dados separados do Claude.ai:** este app usa seu próprio banco de dados agora. As OS que já existiam na versão dentro do Claude.ai **não são migradas automaticamente** — é uma base nova, começando do zero.
- **Camada gratuita do Supabase:** o projeto gratuito "pausa" depois de 7 dias sem nenhum acesso. Se isso acontecer, basta abrir o painel do Supabase e clicar para reativar — nenhum dado é perdido.
- **Segurança:** a política de acesso criada no passo 2 permite que qualquer usuário logado veja e edite todos os dados (é um modelo de "confiança da equipe", igual ao que já existia). Se no futuro vocês quiserem permissões diferentes por pessoa (ex: só admins editam configurações da empresa), isso dá pra evoluir depois.
