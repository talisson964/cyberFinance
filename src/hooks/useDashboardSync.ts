import { useEffect, useRef } from 'react';
import { useCaixa } from '../context/CaixaContextSupabase';

/**
 * Hook de sincronização em tempo real para o Dashboard
 * Monitora mudanças no histórico e força atualização do Dashboard
 */
export const useDashboardSync = () => {
  const { transactions, movements } = useCaixa();
  const prevTransactionsRef = useRef<typeof transactions | null>(null);
  const prevMovementsRef = useRef<typeof movements | null>(null);

  useEffect(() => {
    // Detecta mudanças nas transações
    if (
      prevTransactionsRef.current &&
      JSON.stringify(prevTransactionsRef.current) !== JSON.stringify(transactions)
    ) {
      // Dashboard vai recompilhar via useMemo devido à mudança na dependência
      console.log('🔄 Transações atualizadas - Dashboard sincronizado');
    }

    // Detecta mudanças nas movimentações
    if (
      prevMovementsRef.current &&
      JSON.stringify(prevMovementsRef.current) !== JSON.stringify(movements)
    ) {
      // Dashboard vai recompilhar via useMemo devido à mudança na dependência
      console.log('🔄 Movimentações atualizadas - Dashboard sincronizado');
    }

    // Atualiza referências
    prevTransactionsRef.current = transactions;
    prevMovementsRef.current = movements;
  }, [transactions, movements]);

  return {
    isDataUpdated: true,
    transactionCount: transactions.length,
    movementCount: movements.length,
  };
};
