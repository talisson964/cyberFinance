# 🎯 CyberFinance - Guia de Configuração

## 📋 Pré-requisitos

- Node.js 18+ instalado
- Conta no Supabase (gratuito)
- Git (opcional)

## 🚀 Configuração do Supabase

### Passo 1: Criar Projeto no Supabase

1. Acesse [https://supabase.com](https://supabase.com)
2. Faça login ou crie uma conta
3. Clique em "New Project"
4. Preencha os dados:
   - **Project Name**: cyberfinance (ou o nome que preferir)
   - **Database Password**: Anote essa senha (você precisará dela)
   - **Region**: Escolha a mais próxima (ex: South America - São Paulo)
5. Clique em "Create new project"
6. Aguarde alguns minutos até o projeto estar pronto

### Passo 2: Obter as Credenciais

1. No painel do seu projeto, vá em **Settings** (ícone de engrenagem) → **API**
2. Localize as seguintes informações:
   - **Project URL**: `https://seu-projeto.supabase.co`
   - **anon/public key**: Uma chave longa que começa com `eyJ...`
3. Copie essas informações

### Passo 3: Criar o Schema do Banco de Dados

1. No painel do Supabase, vá em **SQL Editor** (ícone de banco de dados)
2. Clique em "+ New query"
3. Abra o arquivo `supabase-schema.sql` deste projeto
4. Copie **TODO** o conteúdo do arquivo
5. Cole no SQL Editor do Supabase
6. Clique em "Run" (ou pressione `Ctrl+Enter`)
7. Aguarde a mensagem "Success. No rows returned"

✅ Pronto! Suas tabelas foram criadas com:
- Row Level Security (RLS) ativado
- Políticas de acesso por usuário
- Índices para performance
- Relacionamentos entre tabelas

### Passo 4: Configurar Confirmação de Email (OBRIGATÓRIO)

1. No painel do Supabase, vá em **Authentication** → **Settings**
2. Role até a seção **Email Auth Provider**
3. Ative as seguintes opções:
   - ✅ **"Enable email confirmations"** = ON
   - ✅ **"Secure email change"** = ON
   - ❌ **"Double opt-in"** = OFF (desativado para melhor experiência)
4. Clique em **"Save"**
5. (Opcional) Execute o script `supabase-email-confirmation.sql` para políticas RLS extras

✅ Agora os usuários só podem fazer login após confirmar o email!

## ⚙️ Configuração Local

### Passo 1: Instalar Dependências

```bash
npm install
```

### Passo 2: Configurar Variáveis de Ambiente

1. Na raiz do projeto, crie um arquivo `.env`:

```bash
# Windows (PowerShell)
Copy-Item .env.example .env

# Linux/Mac
cp .env.example .env
```

2. Abra o arquivo `.env` e preencha com suas credenciais do Supabase:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima-aqui
```

**⚠️ IMPORTANTE:**
- Substitua `seu-projeto` pela URL real do seu projeto
- Substitua `sua-chave-anonima-aqui` pela anon key que você copiou
- **NUNCA** commit o arquivo `.env` no Git (já está no `.gitignore`)

### Passo 3: Iniciar o Projeto

```bash
npm run dev
```

O sistema abrirá em `http://localhost:5173`

## 👥 Usando o Sistema

### Primeiro Acesso

1. Na tela de login, clique em **"Criar Conta"**
2. Preencha:
   - Nome completo
   - Email
   - Senha (mínimo 6 caracteres)
3. Clique em "Criar Conta"
4. **AGUARDE**: Uma tela de confirmação aparecerá com instruções
5. **Verifique seu email** - O Supabase enviará um link de confirmação
6. **Abra seu email** e clique no link de confirmação
7. **Retorne ao sistema** - Clique em "Voltar para Login"
8. Faça login com seu email e senha

⚠️ **IMPORTANTE**: Você não conseguirá fazer login até confirmar o email!

### Login

1. Digite seu email e senha
2. Clique em "Entrar"
3. Você será direcionado ao Dashboard

### Esqueci Minha Senha

1. Na tela de login, clique em **"Esqueci minha senha"**
2. Digite seu email
3. Clique em "Enviar Link de Recuperação"
4. Verifique seu email e clique no link
5. Defina uma nova senha
6. Retorne ao login e entre com a nova senha

### Isolamento de Dados

✅ **Cada usuário tem seus próprios dados:**
- Usuário 1 não vê os dados do Usuário 2
- Todos os dados são isolados automaticamente
- Segurança garantida pelo Row Level Security (RLS) do Supabase

## 📦 Deploy na Vercel

### Passo 1: Preparar para Deploy

1. Certifique-se que o código está funcionando localmente
2. Commit suas mudanças no Git:

```bash
git add .
git commit -m "Configuração inicial"
git push
```

### Passo 2: Deploy na Vercel

1. Acesse [https://vercel.com](https://vercel.com)
2. Faça login com GitHub/GitLab/Bitbucket
3. Clique em "Add New Project"
4. Importe seu repositório
5. **Configure as variáveis de ambiente:**
   - Clique em "Environment Variables"
   - Adicione:
     - `VITE_SUPABASE_URL` = `https://seu-projeto.supabase.co`
     - `VITE_SUPABASE_ANON_KEY` = `sua-chave-anonima`
6. Clique em "Deploy"

✅ Seu sistema estará online em alguns minutos!

### Atualizações Futuras

Toda vez que você fizer push no GitHub, a Vercel fará deploy automático! 🚀

## 🔒 Segurança

- ✅ Autenticação via Supabase Auth
- ✅ Row Level Security (RLS) ativado
- ✅ Cada usuário acessa apenas seus dados
- ✅ Senhas criptografadas
- ✅ Tokens JWT para sessões
- ✅ HTTPS obrigatório em produção

## 📊 Estrutura do Banco de Dados

### Tabelas:

- **movements**: Movimentações de caixa (entradas/saídas)
- **transactions**: Contas a pagar/receber
- **debt_interests**: Configuração de juros
- **debt_fines**: Configuração de multas

### Relacionamentos:

- Todas as tabelas têm `user_id` → Isolamento por usuário
- `debt_interests` e `debt_fines` → Relacionadas com `transactions`
- Cascade delete: Se um usuário for deletado, todos seus dados são removidos

## 🆘 Problemas Comuns

### "Supabase URL e Anon Key devem ser configurados"

- Certifique-se que o arquivo `.env` existe na raiz do projeto
- Verifique se as variáveis começam com `VITE_`
- Reinicie o servidor de desenvolvimento (`npm run dev`)

### "Invalid login credentials"

- Verifique se o email está correto
- Verifique se confirmou o email no link enviado
- Tente resetar a senha no Supabase Dashboard

### Dados não aparecem após login

- Abra o Console do navegador (F12)
- Verifique se há erros de conexão
- Confirme que as credenciais do `.env` estão corretas
- Verifique se o schema SQL foi executado completamente

### Erro de CORS

- No Supabase, vá em **Authentication** → **URL Configuration**
- Adicione a URL do seu site (localhost e produção)

## 📞 Suporte

Criado por **CyberLife**

Para problemas técnicos:
1. Verifique o console do navegador (F12)
2. Verifique os logs do Supabase Dashboard
3. Revise este README

## 🎉 Pronto!

Agora você tem o CyberFinance completo com:
- ✅ Autenticação de usuários
- ✅ Banco de dados na nuvem
- ✅ Isolamento de dados por usuário
- ✅ Deploy fácil na Vercel
- ✅ Segurança com RLS

Bom uso! 💰📊
