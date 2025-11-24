# 🚀 Guia de Deploy - CyberFinance

## ✅ Build Pronto
- **Status**: Build concluído com sucesso
- **Tamanho**: 1.77 MB (546 KB gzipped)
- **Diretório**: `dist/`

## 📋 Pré-requisitos

### 1. Configurar Supabase
Antes de fazer deploy, execute o schema SQL no Supabase:

1. Acesse [Supabase Dashboard](https://supabase.com/dashboard)
2. Vá em **SQL Editor**
3. Execute o arquivo `supabase-schema-updated.sql`
4. Anote suas credenciais:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

### 2. Variáveis de Ambiente
Crie um arquivo `.env` (se ainda não existe) com:

```env
VITE_SUPABASE_URL=sua_url_aqui
VITE_SUPABASE_ANON_KEY=sua_key_aqui
```

## 🌐 Opções de Deploy

### Opção 1: Vercel (Recomendado) ⭐

#### Via CLI
```bash
# Instalar Vercel CLI
npm i -g vercel

# Fazer deploy
vercel

# Deploy para produção
vercel --prod
```

#### Via Dashboard
1. Acesse [vercel.com](https://vercel.com)
2. Clique em **New Project**
3. Importe o repositório do GitHub
4. Configure as variáveis de ambiente:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Clique em **Deploy**

**Configurações Automáticas:**
- Framework: Vite
- Build Command: `npm run build`
- Output Directory: `dist`

---

### Opção 2: Netlify

#### Via CLI
```bash
# Instalar Netlify CLI
npm i -g netlify-cli

# Fazer deploy
netlify deploy

# Deploy para produção
netlify deploy --prod
```

#### Via Dashboard
1. Acesse [netlify.com](https://netlify.com)
2. Clique em **New site from Git**
3. Conecte seu repositório
4. Configurações:
   - Build command: `npm run build`
   - Publish directory: `dist`
5. Adicione as variáveis de ambiente
6. Clique em **Deploy site**

---

### Opção 3: GitHub Pages

```bash
# Instalar gh-pages
npm install --save-dev gh-pages

# Adicionar scripts ao package.json
"predeploy": "npm run build",
"deploy": "gh-pages -d dist"

# Fazer deploy
npm run deploy
```

**Nota:** Ajuste o `base` no `vite.config.ts` para o nome do repositório.

---

### Opção 4: Cloudflare Pages

1. Acesse [Cloudflare Pages](https://pages.cloudflare.com)
2. Conecte seu repositório
3. Configurações:
   - Build command: `npm run build`
   - Build output directory: `dist`
4. Adicione variáveis de ambiente
5. Clique em **Save and Deploy**

---

## 🔧 Configuração Pós-Deploy

### 1. Testar Autenticação
- Crie uma conta de teste
- Verifique login/logout
- Confirme políticas RLS no Supabase

### 2. Configurar Domínio Customizado (Opcional)
- Vercel: Settings → Domains
- Netlify: Domain settings → Custom domains

### 3. Monitoramento
- Verifique logs de erro no dashboard
- Configure alertas de uptime
- Monitore uso do Supabase

## 📊 Otimizações Aplicadas

✅ **Build Otimizado**
- CSS minificado: 101 KB → 18 KB gzipped
- JS principal: 1.77 MB → 546 KB gzipped
- Código splitting automático

✅ **Performance**
- Lazy loading de componentes
- Debounce em edições (500ms)
- Realtime subscriptions otimizadas

✅ **SEO & PWA**
- Meta tags configuradas
- Favicon incluído
- Responsivo (mobile-first)

## 🛠️ Troubleshooting

### Erro: "VITE_SUPABASE_URL não definida"
**Solução:** Configure variáveis de ambiente no dashboard da plataforma

### Erro: "Failed to fetch"
**Solução:** Verifique CORS no Supabase Dashboard → Authentication → URL Configuration

### Erro 404 em rotas
**Solução:** Configure redirect rules (já incluído no `vercel.json`)

## 📱 URLs de Exemplo

Após deploy, sua aplicação estará disponível em:
- **Vercel**: `https://cyberfinance.vercel.app`
- **Netlify**: `https://cyberfinance.netlify.app`
- **Cloudflare**: `https://cyberfinance.pages.dev`

## 🎉 Deploy Completo!

Checklist final:
- ✅ Build sem erros
- ✅ Schema SQL executado no Supabase
- ✅ Variáveis de ambiente configuradas
- ✅ Deploy realizado
- ✅ Autenticação testada
- ✅ Dark mode funcionando
- ✅ Realtime sync ativo

**Suporte:** Em caso de dúvidas, consulte a documentação da plataforma escolhida.
