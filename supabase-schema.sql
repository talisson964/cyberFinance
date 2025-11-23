-- CyberFinance - Schema SQL para Supabase
-- Execute este script no SQL Editor do Supabase

-- Habilitar Row Level Security (RLS) por padrão
ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

-- ============================================
-- TABELA: user_profiles (Perfis de Usuários)
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    email TEXT NOT NULL,
    avatar_url TEXT,
    last_login TIMESTAMP WITH TIME ZONE,
    login_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_created_at ON public.user_profiles(created_at DESC);

-- RLS Policies para user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver apenas seu próprio perfil
CREATE POLICY "Usuários podem visualizar seu próprio perfil"
    ON public.user_profiles FOR SELECT
    USING (auth.uid() = id);

-- Usuários podem atualizar apenas seu próprio perfil
CREATE POLICY "Usuários podem atualizar seu próprio perfil"
    ON public.user_profiles FOR UPDATE
    USING (auth.uid() = id);

-- Permitir inserção de perfil ao criar conta
CREATE POLICY "Usuários podem criar seu próprio perfil"
    ON public.user_profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- ============================================
-- TRIGGER: Criar perfil automaticamente ao registrar
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger que executa após criar usuário
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- TRIGGER: Atualizar contador de login
-- ============================================
CREATE OR REPLACE FUNCTION public.update_user_login()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.user_profiles
    SET 
        last_login = NOW(),
        login_count = login_count + 1,
        updated_at = NOW()
    WHERE id = NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger que executa ao fazer login (quando auth.users é atualizado)
DROP TRIGGER IF EXISTS on_user_login ON auth.users;
CREATE TRIGGER on_user_login
    AFTER UPDATE OF last_sign_in_at ON auth.users
    FOR EACH ROW
    WHEN (OLD.last_sign_in_at IS DISTINCT FROM NEW.last_sign_in_at)
    EXECUTE FUNCTION public.update_user_login();

-- ============================================
-- FUNÇÃO: Atualizar timestamp updated_at automaticamente
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at em user_profiles
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- TABELA: movements (Movimentações de Caixa)
-- ============================================
CREATE TABLE IF NOT EXISTS public.movements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('entrada', 'saida')),
    category TEXT NOT NULL,
    date DATE NOT NULL,
    payment_method TEXT NOT NULL,
    bank TEXT NOT NULL,
    notes TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_movements_user_id ON public.movements(user_id);
CREATE INDEX IF NOT EXISTS idx_movements_date ON public.movements(date DESC);
CREATE INDEX IF NOT EXISTS idx_movements_type ON public.movements(type);
CREATE INDEX IF NOT EXISTS idx_movements_category ON public.movements(category);

-- RLS Policies para movements
ALTER TABLE public.movements ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver apenas suas próprias movimentações
CREATE POLICY "Usuários podem visualizar suas próprias movimentações"
    ON public.movements FOR SELECT
    USING (auth.uid() = user_id);

-- Usuários podem inserir apenas suas próprias movimentações
CREATE POLICY "Usuários podem criar suas próprias movimentações"
    ON public.movements FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Usuários podem atualizar apenas suas próprias movimentações
CREATE POLICY "Usuários podem atualizar suas próprias movimentações"
    ON public.movements FOR UPDATE
    USING (auth.uid() = user_id);

-- Usuários podem deletar apenas suas próprias movimentações
CREATE POLICY "Usuários podem deletar suas próprias movimentações"
    ON public.movements FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- TABELA: transactions (Transações a Pagar/Receber)
-- ============================================
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'overdue')),
    type TEXT NOT NULL CHECK (type IN ('receive', 'pay')),
    due_date DATE NOT NULL,
    completion_date DATE,
    category TEXT NOT NULL,
    export_type TEXT NOT NULL CHECK (export_type IN ('contabil', 'boleto', 'nenhum')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_due_date ON public.transactions(due_date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON public.transactions(type);

-- RLS Policies para transactions
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem visualizar suas próprias transações"
    ON public.transactions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar suas próprias transações"
    ON public.transactions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas próprias transações"
    ON public.transactions FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar suas próprias transações"
    ON public.transactions FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- TABELA: debt_interests (Juros de Dívidas)
-- ============================================
CREATE TABLE IF NOT EXISTS public.debt_interests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
    daily_interest_rate NUMERIC(8, 6) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(transaction_id)
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_debt_interests_user_id ON public.debt_interests(user_id);
CREATE INDEX IF NOT EXISTS idx_debt_interests_transaction_id ON public.debt_interests(transaction_id);

-- RLS Policies para debt_interests
ALTER TABLE public.debt_interests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem visualizar seus próprios juros"
    ON public.debt_interests FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar seus próprios juros"
    ON public.debt_interests FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus próprios juros"
    ON public.debt_interests FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seus próprios juros"
    ON public.debt_interests FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- TABELA: debt_fines (Multas de Dívidas)
-- ============================================
CREATE TABLE IF NOT EXISTS public.debt_fines (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
    fine_percentage NUMERIC(8, 6) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(transaction_id)
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_debt_fines_user_id ON public.debt_fines(user_id);
CREATE INDEX IF NOT EXISTS idx_debt_fines_transaction_id ON public.debt_fines(transaction_id);

-- RLS Policies para debt_fines
ALTER TABLE public.debt_fines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem visualizar suas próprias multas"
    ON public.debt_fines FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar suas próprias multas"
    ON public.debt_fines FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas próprias multas"
    ON public.debt_fines FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar suas próprias multas"
    ON public.debt_fines FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- FUNÇÕES AUXILIARES
-- ============================================

-- Função para atualizar automaticamente o status de transações atrasadas
CREATE OR REPLACE FUNCTION update_overdue_transactions()
RETURNS void AS $$
BEGIN
    UPDATE public.transactions
    SET status = 'overdue'
    WHERE status = 'pending'
    AND due_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant de execução para usuários autenticados
GRANT EXECUTE ON FUNCTION update_overdue_transactions() TO authenticated;

-- ============================================
-- COMENTÁRIOS DAS TABELAS (Documentação)
-- ============================================

COMMENT ON TABLE public.user_profiles IS 'Armazena perfis e informações de login dos usuários';
COMMENT ON TABLE public.movements IS 'Armazena todas as movimentações de caixa dos usuários';
COMMENT ON TABLE public.transactions IS 'Armazena transações a pagar e receber dos usuários';
COMMENT ON TABLE public.debt_interests IS 'Armazena configurações de juros para dívidas';
COMMENT ON TABLE public.debt_fines IS 'Armazena configurações de multas para dívidas';

-- ============================================
-- VIEW: Estatísticas de Usuários (Admin)
-- ============================================
CREATE OR REPLACE VIEW public.user_stats AS
SELECT 
    up.id,
    up.email,
    up.full_name,
    up.created_at as registro_em,
    up.last_login as ultimo_login,
    up.login_count as total_logins,
    au.email_confirmed_at as email_confirmado_em,
    CASE 
        WHEN au.email_confirmed_at IS NULL THEN 'Não confirmado'
        ELSE 'Confirmado'
    END as status_email,
    COALESCE(
        (SELECT COUNT(*) FROM public.movements WHERE user_id = up.id), 0
    ) as total_movimentacoes,
    COALESCE(
        (SELECT COUNT(*) FROM public.transactions WHERE user_id = up.id), 0
    ) as total_transacoes
FROM public.user_profiles up
LEFT JOIN auth.users au ON up.id = au.id
ORDER BY up.created_at DESC;

-- Comentário da view
COMMENT ON VIEW public.user_stats IS 'Estatísticas consolidadas de usuários (apenas para administração)';

-- ============================================
-- CONFIRMAÇÃO
-- ============================================
-- Se tudo foi executado com sucesso, você verá uma mensagem "Completed successfully"
-- Suas tabelas estão prontas e protegidas por Row Level Security!
-- Cada usuário terá acesso apenas aos seus próprios dados.
--
-- NOVA FUNCIONALIDADE:
-- ✅ Tabela user_profiles criada
-- ✅ Trigger automático ao criar usuário
-- ✅ Contador de logins implementado
-- ✅ View de estatísticas disponível
--
-- Para visualizar usuários registrados:
-- SELECT * FROM public.user_profiles ORDER BY created_at DESC;
--
-- Para visualizar estatísticas completas:
-- SELECT * FROM public.user_stats;
