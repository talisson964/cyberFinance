-- Correção do Trigger de Atualização Automática de is_overdue
-- Este script corrige o trigger para usar due_date quando disponível

-- Remover a função antiga COM CASCADE para remover triggers dependentes
DROP FUNCTION IF EXISTS public.update_movement_derived_fields() CASCADE;

-- Criar nova função que usa due_date corretamente
CREATE OR REPLACE FUNCTION public.update_movement_derived_fields()
RETURNS TRIGGER AS $$
BEGIN
    -- Atualizar timestamp se não fornecido
    IF NEW.timestamp IS NULL THEN
        NEW.timestamp = EXTRACT(EPOCH FROM NOW()) * 1000;
    END IF;
    
    -- Calcular is_overdue baseado na data de vencimento (due_date) ou data da movimentação
    -- IMPORTANTE: Só marca como atrasado se NÃO estiver pago E a data de vencimento JÁ PASSOU
    IF NEW.is_paid = false THEN
        -- Se tem due_date, usar essa data para verificar atraso
        IF NEW.due_date IS NOT NULL THEN
            NEW.is_overdue = (NEW.due_date < CURRENT_DATE);
        -- Se não tem due_date mas tem parcelas, não marcar como atrasado automaticamente
        -- (o frontend vai calcular baseado nas parcelas)
        ELSIF NEW.installments IS NOT NULL THEN
            -- Manter o valor existente, não sobrescrever
            NEW.is_overdue = COALESCE(NEW.is_overdue, false);
        -- Se não tem nem due_date nem parcelas, não marcar como atrasado automaticamente
        ELSE
            NEW.is_overdue = false;
        END IF;
    ELSE
        -- Se está pago, nunca está atrasado
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

-- Criar trigger atualizado
CREATE TRIGGER trigger_update_movement_derived_fields
    BEFORE INSERT OR UPDATE ON public.movements
    FOR EACH ROW
    EXECUTE FUNCTION public.update_movement_derived_fields();

-- Comentário explicativo
COMMENT ON FUNCTION public.update_movement_derived_fields() IS 
'Atualiza automaticamente campos derivados: is_overdue (usando due_date quando disponível), status baseado em pagamento e timestamp';
