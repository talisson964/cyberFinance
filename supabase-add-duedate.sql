-- Adicionar coluna due_date à tabela movements
-- Esta coluna armazenará a data de vencimento de cartões de crédito e boletos

ALTER TABLE movements 
ADD COLUMN IF NOT EXISTS due_date DATE;

-- Criar índice para melhorar performance em consultas por data de vencimento
CREATE INDEX IF NOT EXISTS idx_movements_due_date ON movements(due_date);

-- Comentário na coluna
COMMENT ON COLUMN movements.due_date IS 'Data de vencimento para cartões de crédito não parcelados e boletos';
