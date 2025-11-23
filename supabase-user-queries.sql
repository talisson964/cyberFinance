-- ============================================
-- QUERIES ÚTEIS PARA GERENCIAMENTO DE USUÁRIOS
-- CyberFinance - Supabase
-- ============================================

-- ============================================
-- 1. VISUALIZAR TODOS OS USUÁRIOS REGISTRADOS
-- ============================================
SELECT 
    id,
    email,
    full_name as nome_completo,
    created_at as cadastro_em,
    last_login as ultimo_login,
    login_count as total_logins
FROM public.user_profiles
ORDER BY created_at DESC;

-- ============================================
-- 2. VISUALIZAR ESTATÍSTICAS COMPLETAS
-- ============================================
SELECT * FROM public.user_stats;

-- ============================================
-- 3. USUÁRIOS COM EMAIL NÃO CONFIRMADO
-- ============================================
SELECT 
    up.email,
    up.full_name,
    up.created_at,
    'Aguardando confirmação' as status
FROM public.user_profiles up
LEFT JOIN auth.users au ON up.id = au.id
WHERE au.email_confirmed_at IS NULL
ORDER BY up.created_at DESC;

-- ============================================
-- 4. USUÁRIOS ATIVOS (últimos 30 dias)
-- ============================================
SELECT 
    email,
    full_name,
    last_login,
    login_count,
    DATE_PART('day', NOW() - last_login) as dias_desde_ultimo_login
FROM public.user_profiles
WHERE last_login >= NOW() - INTERVAL '30 days'
ORDER BY last_login DESC;

-- ============================================
-- 5. USUÁRIOS INATIVOS (mais de 30 dias)
-- ============================================
SELECT 
    email,
    full_name,
    last_login,
    DATE_PART('day', NOW() - last_login) as dias_inativo
FROM public.user_profiles
WHERE last_login < NOW() - INTERVAL '30 days'
   OR last_login IS NULL
ORDER BY last_login ASC NULLS FIRST;

-- ============================================
-- 6. TOP 10 USUÁRIOS MAIS ATIVOS (por logins)
-- ============================================
SELECT 
    email,
    full_name,
    login_count,
    last_login
FROM public.user_profiles
ORDER BY login_count DESC
LIMIT 10;

-- ============================================
-- 7. USUÁRIOS COM MAIS MOVIMENTAÇÕES
-- ============================================
SELECT 
    up.email,
    up.full_name,
    COUNT(m.id) as total_movimentacoes,
    SUM(CASE WHEN m.type = 'entrada' THEN m.amount ELSE 0 END) as total_entradas,
    SUM(CASE WHEN m.type = 'saida' THEN m.amount ELSE 0 END) as total_saidas
FROM public.user_profiles up
LEFT JOIN public.movements m ON up.id = m.user_id
GROUP BY up.id, up.email, up.full_name
HAVING COUNT(m.id) > 0
ORDER BY COUNT(m.id) DESC;

-- ============================================
-- 8. RESUMO GERAL DO SISTEMA
-- ============================================
SELECT 
    (SELECT COUNT(*) FROM public.user_profiles) as total_usuarios,
    (SELECT COUNT(*) FROM public.user_profiles WHERE last_login IS NOT NULL) as usuarios_que_logaram,
    (SELECT COUNT(*) FROM auth.users WHERE email_confirmed_at IS NOT NULL) as emails_confirmados,
    (SELECT COUNT(*) FROM auth.users WHERE email_confirmed_at IS NULL) as emails_pendentes,
    (SELECT COUNT(*) FROM public.movements) as total_movimentacoes,
    (SELECT COUNT(*) FROM public.transactions) as total_transacoes,
    (SELECT SUM(login_count) FROM public.user_profiles) as total_logins_sistema;

-- ============================================
-- 9. USUÁRIOS CRIADOS NOS ÚLTIMOS 7 DIAS
-- ============================================
SELECT 
    email,
    full_name,
    created_at,
    last_login,
    login_count
FROM public.user_profiles
WHERE created_at >= NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;

-- ============================================
-- 10. BUSCAR USUÁRIO POR EMAIL
-- ============================================
-- Substitua 'email@exemplo.com' pelo email desejado
SELECT 
    up.*,
    au.email_confirmed_at,
    (SELECT COUNT(*) FROM public.movements WHERE user_id = up.id) as movimentacoes,
    (SELECT COUNT(*) FROM public.transactions WHERE user_id = up.id) as transacoes
FROM public.user_profiles up
LEFT JOIN auth.users au ON up.id = au.id
WHERE up.email ILIKE '%email@exemplo.com%';

-- ============================================
-- 11. ATUALIZAR NOME DE USUÁRIO
-- ============================================
-- Substitua os valores conforme necessário
/*
UPDATE public.user_profiles
SET full_name = 'Novo Nome',
    updated_at = NOW()
WHERE email = 'email@exemplo.com';
*/

-- ============================================
-- 12. DELETAR USUÁRIO (CUIDADO!)
-- ============================================
-- Isso deletará o usuário e TODOS os seus dados (CASCADE)
/*
DELETE FROM auth.users
WHERE email = 'email@exemplo.com';
*/

-- ============================================
-- 13. RESETAR CONTADOR DE LOGIN DE UM USUÁRIO
-- ============================================
/*
UPDATE public.user_profiles
SET login_count = 0,
    updated_at = NOW()
WHERE email = 'email@exemplo.com';
*/

-- ============================================
-- 14. VERIFICAR ÚLTIMA ATIVIDADE DE UM USUÁRIO
-- ============================================
SELECT 
    up.email,
    up.full_name,
    up.last_login,
    (SELECT MAX(created_at) FROM public.movements WHERE user_id = up.id) as ultima_movimentacao,
    (SELECT MAX(created_at) FROM public.transactions WHERE user_id = up.id) as ultima_transacao
FROM public.user_profiles up
WHERE up.email = 'email@exemplo.com';

-- ============================================
-- 15. EXPORTAR LISTA DE EMAILS (para newsletter)
-- ============================================
SELECT 
    email,
    full_name
FROM public.user_profiles
WHERE last_login >= NOW() - INTERVAL '90 days'  -- Apenas usuários ativos
ORDER BY email;

-- ============================================
-- 16. USUÁRIOS QUE NUNCA FIZERAM LOGIN
-- ============================================
SELECT 
    email,
    full_name,
    created_at,
    DATE_PART('day', NOW() - created_at) as dias_desde_cadastro
FROM public.user_profiles
WHERE last_login IS NULL
ORDER BY created_at DESC;

-- ============================================
-- NOTAS IMPORTANTES
-- ============================================
/*
1. Todas as queries respeitam o RLS (Row Level Security)
2. Para executar queries administrativas, use a seção "SQL Editor" do Supabase
3. Nunca exponha essas queries no frontend
4. Sempre faça backup antes de deletar dados
5. Use transações para operações críticas:
   
   BEGIN;
   -- suas queries aqui
   COMMIT; -- ou ROLLBACK; para cancelar
*/

-- ============================================
-- EXEMPLOS DE ANÁLISE TEMPORAL
-- ============================================

-- Novos usuários por mês (últimos 6 meses)
SELECT 
    DATE_TRUNC('month', created_at) as mes,
    COUNT(*) as novos_usuarios
FROM public.user_profiles
WHERE created_at >= NOW() - INTERVAL '6 months'
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY mes DESC;

-- Logins por dia (última semana)
SELECT 
    DATE_TRUNC('day', last_login) as dia,
    COUNT(DISTINCT id) as usuarios_unicos
FROM public.user_profiles
WHERE last_login >= NOW() - INTERVAL '7 days'
GROUP BY DATE_TRUNC('day', last_login)
ORDER BY dia DESC;
