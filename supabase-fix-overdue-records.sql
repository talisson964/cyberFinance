-- Script para Corrigir Registros Atrasados Incorretamente
-- Execute este script DEPOIS de executar o supabase-fix-overdue-trigger.sql

-- 1. Corrigir registros com due_date no futuro que estão marcados como atrasados
UPDATE public.movements
SET is_overdue = false
WHERE due_date IS NOT NULL
AND due_date >= CURRENT_DATE
AND is_overdue = true;

-- 2. Corrigir registros com parcelas que não devem ser marcados como atrasados automaticamente
-- (o cálculo correto deve ser feito pelo frontend baseado em cada parcela)
UPDATE public.movements
SET is_overdue = false
WHERE installments IS NOT NULL
AND is_paid = false
AND is_overdue = true;

-- 3. Verificar resultados
SELECT 
    id,
    description,
    date as movement_date,
    due_date,
    is_overdue,
    is_paid,
    installments IS NOT NULL as has_installments,
    CASE 
        WHEN due_date IS NOT NULL THEN 
            CASE 
                WHEN due_date < CURRENT_DATE THEN 'Should be overdue'
                ELSE 'Should NOT be overdue'
            END
        WHEN installments IS NOT NULL THEN 'Check installments'
        ELSE 'No due date'
    END as calculated_status
FROM public.movements
WHERE is_paid = false
ORDER BY date DESC
LIMIT 50;
