import { useEffect } from 'react';
import { useCaixa } from '../context/CaixaContext';
import { showNotification } from './CustomNotification';

const LAST_WARNING_KEY = 'lastOverdueWarning';
const WARNING_INTERVAL = 12 * 60 * 60 * 1000; // 12 horas em milissegundos

export const OverdueWarningSystem = () => {
  const { movements } = useCaixa();

  useEffect(() => {
    const checkOverduePayments = () => {
      const now = Date.now();
      const lastWarning = localStorage.getItem(LAST_WARNING_KEY);
      const lastWarningTime = lastWarning ? parseInt(lastWarning) : 0;

      // Verifica se já passaram 12 horas desde o último aviso
      if (now - lastWarningTime < WARNING_INTERVAL) {
        return;
      }

      // Conta movimentações atrasadas
      const overdueMovements = movements.filter(m => m.isOverdue);
      
      if (overdueMovements.length > 0) {
        const totalOverdue = overdueMovements.reduce((sum, m) => {
          if (m.installments && m.installments.length > 0) {
            const overdueInstallments = m.installments.filter(inst => !inst.isPaid && inst.daysPastDue > 0);
            return sum + overdueInstallments.reduce((s, inst) => s + inst.amount, 0);
          }
          return sum + (m.overdueAmount || m.amount);
        }, 0);

        const formatCurrency = (value: number) => {
          return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
          }).format(value);
        };

        showNotification(
          'warning',
          `Você tem ${overdueMovements.length} ${overdueMovements.length === 1 ? 'pagamento atrasado' : 'pagamentos atrasados'} no valor total de ${formatCurrency(totalOverdue)}. Verifique o histórico de movimentações.`
        );

        // Atualiza o timestamp do último aviso
        localStorage.setItem(LAST_WARNING_KEY, now.toString());
      }
    };

    // Verifica imediatamente ao montar
    checkOverduePayments();

    // Configura verificação a cada 30 minutos
    const interval = setInterval(checkOverduePayments, 30 * 60 * 1000);

    return () => clearInterval(interval);
  }, [movements]);

  return null;
};
