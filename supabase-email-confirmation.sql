-- ============================================
-- CONFIGURAÇÃO: Email obrigatório antes de criar perfil
-- Execute este script no SQL Editor do Supabase
-- ============================================

-- PASSO 1: Configurar no Dashboard do Supabase
-- Vá em: Authentication → Settings → Email Auth
-- Ative: "Confirm email" (Enable email confirmations)
-- Desative: "Enable double opt-in" (para facilitar)

-- ============================================
-- INSTRUÇÕES PARA O DASHBOARD DO SUPABASE
-- ============================================

/*
1. Acesse seu projeto no Supabase Dashboard
2. Vá em "Authentication" no menu lateral
3. Clique em "Settings"
4. Role até "Email Auth Provider"
5. Configure:
   
   ✅ ATIVAR:
   - "Enable email confirmations" = ON
   - "Secure email change" = ON
   
   ⚠️ IMPORTANTE:
   - "Double opt-in" = OFF (desativado para melhor UX)
   
6. Clique em "Save"

Pronto! Agora:
- Novos usuários precisam confirmar email antes de fazer login
- O login só funciona após clicar no link do email
- Tentativas de login sem confirmação retornam erro
*/

-- ============================================
-- VERIFICAR CONFIGURAÇÃO (Opcional)
-- Execute esta query para ver usuários não confirmados
-- ============================================

SELECT 
    id,
    email,
    email_confirmed_at,
    created_at,
    CASE 
        WHEN email_confirmed_at IS NULL THEN '❌ Não confirmado'
        ELSE '✅ Confirmado'
    END as status
FROM auth.users
ORDER BY created_at DESC;

-- ============================================
-- POLÍTICA RLS: Bloquear acesso sem confirmação
-- ============================================

-- Esta política garante que apenas usuários com email confirmado
-- possam criar/ver/editar dados nas tabelas

-- Atualizar política de INSERT para movements
DROP POLICY IF EXISTS "Usuários podem criar suas próprias movimentações" ON public.movements;
CREATE POLICY "Usuários podem criar suas próprias movimentações"
    ON public.movements FOR INSERT
    WITH CHECK (
        auth.uid() = user_id 
        AND auth.jwt() -> 'email_confirmed_at' IS NOT NULL
    );

-- Atualizar política de INSERT para transactions
DROP POLICY IF EXISTS "Usuários podem criar suas próprias transações" ON public.transactions;
CREATE POLICY "Usuários podem criar suas próprias transações"
    ON public.transactions FOR INSERT
    WITH CHECK (
        auth.uid() = user_id 
        AND auth.jwt() -> 'email_confirmed_at' IS NOT NULL
    );

-- Atualizar política de INSERT para debt_interests
DROP POLICY IF EXISTS "Usuários podem criar seus próprios juros" ON public.debt_interests;
CREATE POLICY "Usuários podem criar seus próprios juros"
    ON public.debt_interests FOR INSERT
    WITH CHECK (
        auth.uid() = user_id 
        AND auth.jwt() -> 'email_confirmed_at' IS NOT NULL
    );

-- Atualizar política de INSERT para debt_fines
DROP POLICY IF EXISTS "Usuários podem criar suas próprias multas" ON public.debt_fines;
CREATE POLICY "Usuários podem criar suas próprias multas"
    ON public.debt_fines FOR INSERT
    WITH CHECK (
        auth.uid() = user_id 
        AND auth.jwt() -> 'email_confirmed_at' IS NOT NULL
    );

-- ============================================
-- TRIGGER: Limpar usuários não confirmados após 7 dias (Opcional)
-- ============================================

CREATE OR REPLACE FUNCTION delete_unconfirmed_users()
RETURNS void AS $$
BEGIN
    DELETE FROM auth.users
    WHERE email_confirmed_at IS NULL
    AND created_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Para executar manualmente quando necessário:
-- SELECT delete_unconfirmed_users();

-- ============================================
-- MENSAGENS DE EMAIL PERSONALIZADAS
-- ============================================

/*
Para personalizar os emails de confirmação:

1. Vá em: Authentication → Email Templates
2. Edite "Confirm signup"
3. Use o template HTML do arquivo: email-confirmation-template.html
4. Copie todo o conteúdo HTML e cole no editor
5. A variável {{ .ConfirmationURL }} será substituída automaticamente pelo Supabase

IMPORTANTE: 
- Mantenha a variável {{ .ConfirmationURL }} no HTML
- Teste o email enviando para você mesmo antes de usar em produção
- Você pode personalizar cores, textos e layout conforme necessário

O template inclui:
✅ Design moderno e responsivo
✅ Compatível com todos clientes de email
✅ Botão de confirmação destacado
✅ Link alternativo caso o botão não funcione
✅ Lista de recursos do sistema
✅ Informações de expiração do link
✅ Footer profissional com marca
*/

-- ============================================
-- RESUMO DA CONFIGURAÇÃO
-- ============================================

/*
✅ FEITO:
1. Configure no Dashboard: Authentication → Settings → "Confirm email" = ON
2. Execute este SQL para adicionar políticas RLS (opcional mas recomendado)
3. Personalize emails se desejar (opcional)

✅ RESULTADO:
- Usuários só podem fazer login após confirmar email
- Dados só podem ser criados por usuários confirmados
- Sistema mais seguro e profissional

✅ FLUXO FINAL:
1. Usuário cria conta
2. Recebe email de confirmação
3. Clica no link do email
4. Pode fazer login normalmente
5. Acessa o sistema completo
*/
