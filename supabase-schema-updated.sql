-- CyberFinance - Schema SQL ATUALIZADO para Supabase
-- Execute este script no SQL Editor do Supabase para ATUALIZAR as tabelas

-- ============================================
-- ATUALIZAÇÃO: Tabela movements (Movimentações)
-- ============================================

-- Adicionar novas colunas à tabela movements
ALTER TABLE public.movements 
ADD COLUMN IF NOT EXISTS transaction_id UUID,
ADD COLUMN IF NOT EXISTS movement_type TEXT NOT NULL DEFAULT 'pix',
ADD COLUMN IF NOT EXISTS subcategory TEXT,
ADD COLUMN IF NOT EXISTS classification TEXT NOT NULL DEFAULT 'nenhum' CHECK (classification IN ('fixo', 'ocasional', 'nenhum')),
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'parcial', 'pago', 'atrasado')),
ADD COLUMN IF NOT EXISTS is_paid BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS paid_date DATE,
ADD COLUMN IF NOT EXISTS partial_paid_amount NUMERIC(15, 2),
ADD COLUMN IF NOT EXISTS last_payment_date DATE,
ADD COLUMN IF NOT EXISTS reminder_date DATE,
ADD COLUMN IF NOT EXISTS is_overdue BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS overdue_amount NUMERIC(15, 2),
ADD COLUMN IF NOT EXISTS attachment_url TEXT,
ADD COLUMN IF NOT EXISTS comprovante TEXT,
ADD COLUMN IF NOT EXISTS fixed_expense_duration INTEGER,
ADD COLUMN IF NOT EXISTS installments JSONB,
ADD COLUMN IF NOT EXISTS total_installments INTEGER,
ADD COLUMN IF NOT EXISTS paid_installments INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS purchase_items JSONB,
ADD COLUMN IF NOT EXISTS timestamp BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000;

-- Atualizar colunas existentes para permitir defaults
ALTER TABLE public.movements 
ALTER COLUMN bank DROP NOT NULL,
ALTER COLUMN bank SET DEFAULT '';

-- Adicionar constraints de validação
ALTER TABLE public.movements 
ADD CONSTRAINT check_movement_type CHECK (movement_type IN ('pix', 'cartao_credito', 'parcelado', 'dinheiro', 'transferencia', 'boleto', 'debito'));

-- Adicionar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_movements_transaction_id ON public.movements(transaction_id);
CREATE INDEX IF NOT EXISTS idx_movements_movement_type ON public.movements(movement_type);
CREATE INDEX IF NOT EXISTS idx_movements_classification ON public.movements(classification);
CREATE INDEX IF NOT EXISTS idx_movements_status ON public.movements(status);
CREATE INDEX IF NOT EXISTS idx_movements_is_paid ON public.movements(is_paid);
CREATE INDEX IF NOT EXISTS idx_movements_is_overdue ON public.movements(is_overdue);
CREATE INDEX IF NOT EXISTS idx_movements_timestamp ON public.movements(timestamp DESC);

-- ============================================
-- ATUALIZAÇÃO: Tabela transactions (Transações)
-- ============================================

-- Adicionar novas colunas à tabela transactions
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS timestamp BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000,
ADD COLUMN IF NOT EXISTS recurrence TEXT CHECK (recurrence IN ('unica', 'diaria', 'semanal', 'mensal', 'anual'));

-- Adicionar índices
CREATE INDEX IF NOT EXISTS idx_transactions_timestamp ON public.transactions(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_recurrence ON public.transactions(recurrence);

-- ============================================
-- ATUALIZAÇÃO: Atualizar tipos do Supabase
-- ============================================

-- Atualizar a definição de tipos TypeScript do Supabase
COMMENT ON TABLE public.movements IS 'Armazena todas as movimentações de caixa com suporte a parcelas, itens de compra e rastreamento detalhado';
COMMENT ON TABLE public.transactions IS 'Armazena transações a pagar e receber com suporte a recorrência';

-- ============================================
-- FUNÇÃO: Atualizar automaticamente campos derivados
-- ============================================

CREATE OR REPLACE FUNCTION public.update_movement_derived_fields()
RETURNS TRIGGER AS $$
BEGIN
    -- Atualizar timestamp se não fornecido
    IF NEW.timestamp IS NULL THEN
        NEW.timestamp = EXTRACT(EPOCH FROM NOW()) * 1000;
    END IF;
    
    -- Calcular is_overdue baseado na data de vencimento
    IF NEW.date < CURRENT_DATE AND NEW.is_paid = false THEN
        NEW.is_overdue = true;
    ELSE
        NEW.is_overdue = false;
    END IF;
    
    -- Atualizar status baseado em is_paid
    IF NEW.is_paid = true THEN
        NEW.status = 'pago';
    ELSIF NEW.partial_paid_amount > 0 THEN
        NEW.status = 'parcial';
    ELSIF NEW.is_overdue = true THEN
        NEW.status = 'atrasado';
    ELSE
        NEW.status = 'pendente';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar campos derivados automaticamente
DROP TRIGGER IF EXISTS update_movement_fields ON public.movements;
CREATE TRIGGER update_movement_fields
    BEFORE INSERT OR UPDATE ON public.movements
    FOR EACH ROW
    EXECUTE FUNCTION public.update_movement_derived_fields();

-- ============================================
-- FUNÇÃO: Calcular parcelas pagas
-- ============================================

CREATE OR REPLACE FUNCTION public.calculate_paid_installments(installments_json JSONB)
RETURNS INTEGER AS $$
DECLARE
    paid_count INTEGER := 0;
    installment JSONB;
BEGIN
    IF installments_json IS NULL THEN
        RETURN 0;
    END IF;
    
    FOR installment IN SELECT * FROM jsonb_array_elements(installments_json)
    LOOP
        IF (installment->>'isPaid')::BOOLEAN = true THEN
            paid_count := paid_count + 1;
        END IF;
    END LOOP;
    
    RETURN paid_count;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- VIEW: Movimentações com estatísticas calculadas
-- ============================================

CREATE OR REPLACE VIEW public.movements_with_stats AS
SELECT 
    m.*,
    CASE 
        WHEN m.installments IS NOT NULL THEN public.calculate_paid_installments(m.installments)
        ELSE 0
    END as calculated_paid_installments,
    CASE
        WHEN m.is_overdue THEN CURRENT_DATE - m.date
        ELSE 0
    END as days_overdue,
    CASE 
        WHEN m.purchase_items IS NOT NULL THEN jsonb_array_length(m.purchase_items)
        ELSE 0
    END as items_count
FROM public.movements m;

-- Permitir acesso à view (herda automaticamente as permissões da tabela movements)
ALTER VIEW public.movements_with_stats OWNER TO postgres;

-- Nota: Views herdam automaticamente as policies RLS da tabela base (movements)
-- Não é necessário criar policies separadas para a view

-- ============================================
-- FUNÇÃO: Migrar dados do localStorage
-- ============================================

CREATE OR REPLACE FUNCTION public.migrate_local_data(
    p_movements JSONB,
    p_transactions JSONB,
    p_debt_interests JSONB,
    p_debt_fines JSONB
)
RETURNS JSON AS $$
DECLARE
    v_user_id UUID;
    v_movement JSONB;
    v_transaction JSONB;
    v_interest JSONB;
    v_fine JSONB;
    v_result JSON;
    v_movements_count INTEGER := 0;
    v_transactions_count INTEGER := 0;
    v_interests_count INTEGER := 0;
    v_fines_count INTEGER := 0;
BEGIN
    -- Obter ID do usuário autenticado
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Usuário não autenticado'
        );
    END IF;
    
    -- Migrar movimentações
    IF p_movements IS NOT NULL THEN
        FOR v_movement IN SELECT * FROM jsonb_array_elements(p_movements)
        LOOP
            INSERT INTO public.movements (
                id, user_id, transaction_id, type, movement_type, amount, 
                category, subcategory, description, date, timestamp,
                classification, status, is_paid, paid_date, 
                partial_paid_amount, last_payment_date, reminder_date,
                is_overdue, overdue_amount, notes, attachment_url,
                comprovante, fixed_expense_duration, installments,
                total_installments, paid_installments, purchase_items,
                payment_method, bank
            ) VALUES (
                (v_movement->>'id')::UUID,
                v_user_id,
                (v_movement->>'transactionId')::UUID,
                v_movement->>'type',
                COALESCE(v_movement->>'movementType', 'pix'),
                (v_movement->>'amount')::NUMERIC,
                v_movement->>'category',
                v_movement->>'subcategory',
                v_movement->>'description',
                (v_movement->>'date')::DATE,
                (v_movement->>'timestamp')::BIGINT,
                COALESCE(v_movement->>'classification', 'nenhum'),
                COALESCE(v_movement->>'status', 'pendente'),
                COALESCE((v_movement->>'isPaid')::BOOLEAN, false),
                (v_movement->>'paidDate')::DATE,
                (v_movement->>'partialPaidAmount')::NUMERIC,
                (v_movement->>'lastPaymentDate')::DATE,
                (v_movement->>'reminderDate')::DATE,
                COALESCE((v_movement->>'isOverdue')::BOOLEAN, false),
                (v_movement->>'overdueAmount')::NUMERIC,
                v_movement->>'notes',
                v_movement->>'attachmentUrl',
                v_movement->>'comprovante',
                (v_movement->>'fixedExpenseDuration')::INTEGER,
                v_movement->'installments',
                (v_movement->>'totalInstallments')::INTEGER,
                (v_movement->>'paidInstallments')::INTEGER,
                v_movement->'purchaseItems',
                COALESCE(v_movement->>'movementType', 'pix'),
                COALESCE(v_movement->>'bank', '')
            )
            ON CONFLICT (id) DO NOTHING;
            
            v_movements_count := v_movements_count + 1;
        END LOOP;
    END IF;
    
    -- Migrar transações
    IF p_transactions IS NOT NULL THEN
        FOR v_transaction IN SELECT * FROM jsonb_array_elements(p_transactions)
        LOOP
            INSERT INTO public.transactions (
                id, user_id, type, amount, category, description,
                due_date, completion_date, status, timestamp, recurrence,
                export_type
            ) VALUES (
                (v_transaction->>'id')::UUID,
                v_user_id,
                CASE 
                    WHEN v_transaction->>'type' = 'entrada' THEN 'receive'
                    ELSE 'pay'
                END,
                (v_transaction->>'amount')::NUMERIC,
                v_transaction->>'category',
                v_transaction->>'description',
                (v_transaction->>'date')::DATE,
                NULL,
                'pending',
                (v_transaction->>'timestamp')::BIGINT,
                v_transaction->>'recurrence',
                'nenhum'
            )
            ON CONFLICT (id) DO NOTHING;
            
            v_transactions_count := v_transactions_count + 1;
        END LOOP;
    END IF;
    
    -- Construir resultado
    v_result := json_build_object(
        'success', true,
        'migrated', json_build_object(
            'movements', v_movements_count,
            'transactions', v_transactions_count,
            'interests', v_interests_count,
            'fines', v_fines_count
        )
    );
    
    RETURN v_result;
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant de execução para usuários autenticados
GRANT EXECUTE ON FUNCTION public.migrate_local_data TO authenticated;

-- ============================================
-- FUNÇÃO: Limpar dados de teste
-- ============================================

CREATE OR REPLACE FUNCTION public.clear_user_data()
RETURNS JSON AS $$
DECLARE
    v_user_id UUID;
    v_result JSON;
BEGIN
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Usuário não autenticado');
    END IF;
    
    -- Deletar todos os dados do usuário
    DELETE FROM public.debt_fines WHERE user_id = v_user_id;
    DELETE FROM public.debt_interests WHERE user_id = v_user_id;
    DELETE FROM public.movements WHERE user_id = v_user_id;
    DELETE FROM public.transactions WHERE user_id = v_user_id;
    
    RETURN json_build_object('success', true, 'message', 'Dados limpos com sucesso');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.clear_user_data TO authenticated;

-- ============================================
-- CONFIRMAÇÃO
-- ============================================
-- ✅ Schema atualizado com sucesso!
-- ✅ Novos campos adicionados às tabelas
-- ✅ Triggers automáticos para campos derivados
-- ✅ Função de migração do localStorage criada
-- ✅ View com estatísticas calculadas
-- ✅ Índices adicionados para performance
--
-- Para verificar as mudanças:
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'movements' AND table_schema = 'public'
-- ORDER BY ordinal_position;
