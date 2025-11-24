import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { useMovements, useTransactions, useMigrateLocalStorage } from '../hooks/useSupabaseData';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Toast';
import type { 
  Transaction, 
  TransactionType, 
  Movement, 
  MovementType, 
  ExpenseClassification,
  Installment,
  PaymentStatus,
  CashFlowReport,
  OverdueAnalysis,
  FutureFlowForecast,
  DebtInterest,
  DebtFine,
  PurchaseItem,
  DashboardStats,
  MonthlySummary
} from '../types';

interface CaixaContextType {
  transactions: Transaction[];
  movements: Movement[];
  loading: boolean;
  
  // TRANSAÇÕES
  addTransaction: (
    type: TransactionType, 
    amount: number, 
    category: string, 
    description: string,
    date?: string,
    recurrence?: 'unica' | 'diaria' | 'semanal' | 'mensal' | 'anual'
  ) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  editTransaction: (
    id: string, 
    amount: number, 
    category: string, 
    description: string,
    date?: string,
    recurrence?: 'unica' | 'diaria' | 'semanal' | 'mensal' | 'anual'
  ) => Promise<void>;

  // MOVIMENTAÇÕES
  addMovement: (
    type: TransactionType,
    movementType: MovementType,
    amount: number,
    category: string,
    description: string,
    classification: ExpenseClassification,
    date?: string,
    totalInstallments?: number,
    firstInstallmentDate?: string,
    notes?: string,
    fixedExpenseDuration?: number,
    purchaseItems?: PurchaseItem[]
  ) => Promise<{ merged: boolean; itemCount?: number }>;
  
  addMultipleMovements: (movements: Array<{
    type: TransactionType;
    movementType: MovementType;
    amount: number;
    category: string;
    description: string;
    classification: ExpenseClassification;
    date?: string;
    totalInstallments?: number;
    firstInstallmentDate?: string;
    notes?: string;
    paidInstallments?: number;
    shouldMarkAsPaid?: boolean;
    purchaseItems?: PurchaseItem[];
  }>) => Promise<void>;
  
  deleteMovement: (id: string) => Promise<void>;
  editMovement: (
    id: string,
    movementType: MovementType,
    amount: number,
    category: string,
    description: string,
    classification: ExpenseClassification,
    date?: string,
    notes?: string
  ) => Promise<void>;

  // PAGAMENTOS E PARCELAS
  markMovementAsPaid: (id: string, paidDate: string) => Promise<void>;
  markInstallmentAsPaid: (movementId: string, installmentNumber: number, paidDate: string) => Promise<void>;
  markInstallmentAsPartiallyPaid: (movementId: string, installmentNumber: number, amount: number) => Promise<void>;
  payPartialMovement: (id: string, amount: number, paidDate: string) => Promise<void>;
  undoLastInstallmentPayment: (movementId: string) => Promise<void>;
  undoMarkAsPaid: (movementId: string) => Promise<void>;
  
  // CONSULTAS E FILTROS
  getTransactionsByMonth: (monthYear: string) => Transaction[];
  getMovementsByMonth: (monthYear: string) => Movement[];
  getPendingMovements: () => Movement[];
  getOverdueMovements: () => Movement[];
  getMovementsByStatus: (status: PaymentStatus) => Movement[];
  getMovementsByCategory: (category: string) => Movement[];
  getMovementsByDateRange: (startDate: string, endDate: string) => Movement[];
  
  // RELATÓRIOS E ANÁLISES
  getCashFlowReport: (startDate: string, endDate: string) => CashFlowReport;
  getOverdueAnalysis: () => OverdueAnalysis;
  getFutureFlowForecast: (months: number) => FutureFlowForecast[];
  
  // JUROS E MULTAS
  debtInterests: DebtInterest[];
  debtFines: DebtFine[];
  addDebtInterest: (movementId: string, interestRate: number, periodType: 'day' | 'month') => void;
  addDebtFine: (movementId: string, fineRate: number, fineType: 'percentage' | 'fixed') => void;
  removeDebtInterest: (movementId: string) => void;
  removeDebtFine: (movementId: string) => void;
  updateDebtInterest: (movementId: string, interestRate: number, periodType: 'day' | 'month') => void;
  updateDebtFine: (movementId: string, fineRate: number, fineType: 'percentage' | 'fixed') => void;
  getAllDebtInterests: () => DebtInterest[];
  getAllDebtFines: () => DebtFine[];
  calculateInterestAmount: (movementId: string) => number;
  calculateFineAmount: (movementId: string) => number;
  getMovementWithAccruedInterestAndFine: (movementId: string) => {
    movement: Movement | undefined;
    accruedInterest: number;
    accruedFine: number;
    totalAmount: number;
  };

  // ESTATÍSTICAS
  getMonthlyStats: () => DashboardStats;
  getMonthlySummary: (startDate: string, endDate: string) => MonthlySummary[];
  getNextDueInstallments: (days?: number) => Array<{ movement: Movement; installment: Installment }>;
  
  // MIGRAÇÃO
  migrateFromLocalStorage: () => Promise<any>;
  migrationStatus: { completed: boolean; result: any | null };
}

const CaixaContext = createContext<CaixaContextType | undefined>(undefined);

export const useCaixa = () => {
  const context = useContext(CaixaContext);
  if (!context) {
    throw new Error('useCaixa deve ser usado dentro de um CaixaProvider');
  }
  return context;
};

export const CaixaProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const {
    movements,
    loading: loadingMovements,
    addMovement: addMovementHook,
    updateMovement: updateMovementHook,
    deleteMovement: deleteMovementHook
  } = useMovements();  const {
    transactions,
    loading: loadingTransactions,
    addTransaction: addTransactionHook,
    updateTransaction: updateTransactionHook,
    deleteTransaction: deleteTransactionHook
  } = useTransactions();  const { migrateData, migrating, migrationResult } = useMigrateLocalStorage();
  const { showSuccess, showError } = useToast();

  const [debtInterests, setDebtInterests] = useState<DebtInterest[]>([]);
  const [debtFines, setDebtFines] = useState<DebtFine[]>([]);
  const [migrationCompleted, setMigrationCompleted] = useState(false);

  const loading = loadingMovements || loadingTransactions || migrating;

  // Verificar se já houve migração
  useEffect(() => {
    const migrationStatus = localStorage.getItem('migration_completed');
    if (migrationStatus === 'true') {
      setMigrationCompleted(true);
    } else if (user) {
      // Verificar se há dados no localStorage para migrar
      const hasLocalData = 
        localStorage.getItem('caixa_movements') || 
        localStorage.getItem('caixa_transactions');
      
      if (hasLocalData) {
        // Auto-migrar dados
        migrateData().then(() => {
          setMigrationCompleted(true);
        }).catch(err => {
          console.error('Erro na migração automática:', err);
        });
      } else {
        setMigrationCompleted(true);
      }
    }
  }, [user]);

  // FUNÇÕES DE TRANSAÇÃO
  const addTransaction = useCallback(async (
    type: TransactionType,
    amount: number,
    category: string,
    description: string,
    date?: string,
    recurrence?: 'unica' | 'diaria' | 'semanal' | 'mensal' | 'anual'
  ) => {
    try {
      const transactionDate = date || new Date().toISOString().split('T')[0];
      const timestamp = new Date(transactionDate).getTime();

      await addTransactionHook({
        type,
        amount,
        category,
        description,
        date: transactionDate,
        timestamp,
        recurrence,
      });
      showSuccess('Transação adicionada com sucesso!');
    } catch (error) {
      console.error('Erro ao adicionar transação:', error);
      showError('Erro ao adicionar transação. Tente novamente.');
      throw error;
    }
  }, [addTransactionHook, showSuccess, showError]);

  const deleteTransaction = useCallback(async (id: string) => {
    try {
      await deleteTransactionHook(id);
      showSuccess('Transação deletada com sucesso!');
    } catch (error) {
      console.error('Erro ao deletar transação:', error);
      showError('Erro ao deletar transação. Tente novamente.');
      throw error;
    }
  }, [deleteTransactionHook]);

  const editTransaction = useCallback(async (
    id: string,
    amount: number,
    category: string,
    description: string,
    date?: string,
    recurrence?: 'unica' | 'diaria' | 'semanal' | 'mensal' | 'anual'
  ) => {
    try {
      await updateTransactionHook(id, {
        amount,
        category,
        description,
        ...(date && { date }),
        ...(recurrence && { recurrence }),
      });
      showSuccess('Transação atualizada com sucesso!');
    } catch (error) {
      console.error('Erro ao editar transação:', error);
      showError('Erro ao atualizar transação. Tente novamente.');
      throw error;
    }
  }, [updateTransactionHook, showSuccess, showError]);

  // FUNÇÕES DE MOVIMENTAÇÃO
  const addMovement = useCallback(async (
    type: TransactionType,
    movementType: MovementType,
    amount: number,
    category: string,
    description: string,
    classification: ExpenseClassification,
    date?: string,
    totalInstallments?: number,
    firstInstallmentDate?: string,
    notes?: string,
    fixedExpenseDuration?: number,
    purchaseItems?: PurchaseItem[]
  ): Promise<{ merged: boolean; itemCount?: number }> => {
    const movementDate = date || new Date().toISOString().split('T')[0];
    const timestamp = new Date(movementDate).getTime();
    const movementId = crypto.randomUUID();
    const transactionId = crypto.randomUUID();

    // Verificar se deve mesclar com movimentação existente (categoria fornecedores com itens)
    if (category === 'fornecedores' && purchaseItems && purchaseItems.length > 0) {
      const existingMovement = movements.find(m => 
        m.date === movementDate &&
        m.category === 'fornecedores' &&
        m.description === description &&
        m.type === type
      );

      if (existingMovement) {
        const mergedItems = [...(existingMovement.purchaseItems || []), ...purchaseItems];
        const mergedAmount = mergedItems.reduce((sum, item) => sum + item.total, 0);

        await updateMovementHook(existingMovement.id, {
          purchaseItems: mergedItems,
          amount: mergedAmount,
        });

        return { 
          merged: true, 
          itemCount: mergedItems.length 
        };
      }
    }

    // Marca como pago automaticamente se for PIX ou Débito
    const shouldMarkAsPaid = movementType === 'pix' || movementType === 'debito';
    const paidDate = shouldMarkAsPaid ? movementDate : undefined;

    // Criar parcelas se necessário
    let installments: Installment[] | undefined;
    if (totalInstallments && totalInstallments > 1) {
      installments = [];
      const installmentDate = firstInstallmentDate ? new Date(firstInstallmentDate) : new Date(movementDate);
      const installmentAmount = amount / totalInstallments;

      for (let i = 0; i < totalInstallments; i++) {
        const dueDate = new Date(installmentDate);
        dueDate.setMonth(dueDate.getMonth() + i);
        const dueDateStr = dueDate.toISOString().split('T')[0];
        const isPastDue = new Date(dueDateStr) < new Date();
        
        installments.push({
          id: `${movementId}-installment-${i + 1}`,
          number: i + 1,
          totalInstallments,
          amount: installmentAmount,
          dueDate: dueDateStr,
          isPaid: false,
          daysPastDue: isPastDue ? Math.floor((new Date().getTime() - new Date(dueDateStr).getTime()) / (1000 * 60 * 60 * 24)) : 0,
        });
      }
    }

    const newMovement: Omit<Movement, 'id'> = {
      transactionId,
      type,
      movementType,
      amount,
      category,
      description,
      date: movementDate,
      timestamp,
      classification,
      isPaid: shouldMarkAsPaid,
      status: shouldMarkAsPaid ? 'pago' : 'pendente',
      isOverdue: false,
      notes,
      fixedExpenseDuration,
      purchaseItems,
      ...(shouldMarkAsPaid && { paidDate }),
      ...(installments && {
        installments,
        totalInstallments,
        paidInstallments: 0,
      }),
    };

    await addMovementHook(newMovement);
    
    return { merged: false };
  }, [movements, addMovementHook, updateMovementHook]);

  const addMultipleMovements = useCallback(async (movementData: Array<{
    type: TransactionType;
    movementType: MovementType;
    amount: number;
    category: string;
    description: string;
    classification: ExpenseClassification;
    date?: string;
    totalInstallments?: number;
    firstInstallmentDate?: string;
    notes?: string;
    paidInstallments?: number;
    shouldMarkAsPaid?: boolean;
    purchaseItems?: PurchaseItem[];
  }>) => {
    for (const data of movementData) {
      await addMovement(
        data.type,
        data.movementType,
        data.amount,
        data.category,
        data.description,
        data.classification,
        data.date,
        data.totalInstallments,
        data.firstInstallmentDate,
        data.notes,
        undefined,
        data.purchaseItems
      );
    }
  }, [addMovement]);

  const deleteMovement = useCallback(async (id: string) => {
    try {
      await deleteMovementHook(id);
      showSuccess('Movimentação deletada com sucesso!');
    } catch (error) {
      console.error('Erro ao deletar movimentação:', error);
      showError('Erro ao deletar movimentação. Tente novamente.');
      throw error;
    }
  }, [deleteMovementHook, showSuccess, showError]);

  const editMovement = useCallback(async (
    id: string,
    movementType: MovementType,
    amount: number,
    category: string,
    description: string,
    classification: ExpenseClassification,
    date?: string,
    notes?: string
  ) => {
    try {
      await updateMovementHook(id, {
        movementType,
        amount,
        category,
        description,
        classification,
        ...(date && { date }),
        ...(notes && { notes }),
      });
      showSuccess('Movimentação atualizada com sucesso!');
    } catch (error) {
      console.error('Erro ao editar movimentação:', error);
      showError('Erro ao atualizar movimentação. Tente novamente.');
      throw error;
    }
  }, [updateMovementHook, showSuccess, showError]);

  // FUNÇÕES DE PAGAMENTO
  const markMovementAsPaid = useCallback(async (id: string, paidDate: string) => {
    await updateMovementHook(id, {
      isPaid: true,
      paidDate,
      status: 'pago',
      isOverdue: false,
    });
  }, [updateMovementHook]);

  const markInstallmentAsPaid = useCallback(async (movementId: string, installmentNumber: number, paidDate: string) => {
    const movement = movements.find(m => m.id === movementId);
    if (!movement || !movement.installments) return;

    const updatedInstallments = movement.installments.map(inst => 
      inst.number === installmentNumber
        ? { ...inst, isPaid: true, paidDate }
        : inst
    );

    const paidCount = updatedInstallments.filter(inst => inst.isPaid).length;
    const allPaid = paidCount === updatedInstallments.length;

    await updateMovementHook(movementId, {
      installments: updatedInstallments,
      paidInstallments: paidCount,
      isPaid: allPaid,
      status: allPaid ? 'pago' : paidCount > 0 ? 'parcial' : 'pendente',
      lastPaymentDate: paidDate,
      ...(allPaid && { paidDate }),
    });
  }, [movements, updateMovementHook]);

  const markInstallmentAsPartiallyPaid = useCallback(async (movementId: string, _installmentNumber: number, amount: number) => {
    // Implementar lógica de pagamento parcial
    const movement = movements.find(m => m.id === movementId);
    if (!movement) return;

    await updateMovementHook(movementId, {
      partialPaidAmount: (movement.partialPaidAmount || 0) + amount,
      status: 'parcial',
    });
  }, [movements, updateMovementHook]);

  const payPartialMovement = useCallback(async (id: string, amount: number, paidDate: string) => {
    const movement = movements.find(m => m.id === id);
    if (!movement) return;

    const totalPaid = (movement.partialPaidAmount || 0) + amount;
    const isPaid = totalPaid >= movement.amount;

    await updateMovementHook(id, {
      partialPaidAmount: totalPaid,
      isPaid,
      status: isPaid ? 'pago' : 'parcial',
      lastPaymentDate: paidDate,
      ...(isPaid && { paidDate }),
    });
  }, [movements, updateMovementHook]);

  const undoLastInstallmentPayment = useCallback(async (movementId: string) => {
    const movement = movements.find(m => m.id === movementId);
    if (!movement || !movement.installments) return;

    // Encontrar última parcela paga
    const lastPaidIndex = movement.installments.map((inst, idx) => inst.isPaid ? idx : -1)
      .filter(idx => idx !== -1)
      .pop();

    if (lastPaidIndex === undefined) return;

    const updatedInstallments = movement.installments.map((inst, idx) =>
      idx === lastPaidIndex
        ? { ...inst, isPaid: false, paidDate: undefined }
        : inst
    );

    const paidCount = updatedInstallments.filter(inst => inst.isPaid).length;

    await updateMovementHook(movementId, {
      installments: updatedInstallments,
      paidInstallments: paidCount,
      isPaid: false,
      status: paidCount > 0 ? 'parcial' : 'pendente',
    });
  }, [movements, updateMovementHook]);

  const undoMarkAsPaid = useCallback(async (movementId: string) => {
    await updateMovementHook(movementId, {
      isPaid: false,
      paidDate: undefined,
      status: 'pendente',
      partialPaidAmount: 0,
    });
  }, [updateMovementHook]);

  // CONSULTAS E FILTROS
  const getTransactionsByMonth = useCallback((monthYear: string) => {
    return transactions.filter(t => {
      const transactionMonth = t.date.substring(0, 7); // YYYY-MM
      return transactionMonth === monthYear;
    });
  }, [transactions]);

  const getMovementsByMonth = useCallback((monthYear: string) => {
    return movements.filter(m => {
      const movementMonth = m.date.substring(0, 7);
      return movementMonth === monthYear;
    });
  }, [movements]);

  const getPendingMovements = useCallback(() => {
    return movements.filter(m => m.status === 'pendente');
  }, [movements]);

  const getOverdueMovements = useCallback(() => {
    return movements.filter(m => m.isOverdue || m.status === 'atrasado');
  }, [movements]);

  const getMovementsByStatus = useCallback((status: PaymentStatus) => {
    return movements.filter(m => m.status === status);
  }, [movements]);

  const getMovementsByCategory = useCallback((category: string) => {
    return movements.filter(m => m.category === category);
  }, [movements]);

  const getMovementsByDateRange = useCallback((startDate: string, endDate: string) => {
    return movements.filter(m => m.date >= startDate && m.date <= endDate);
  }, [movements]);

  // RELATÓRIOS E ANÁLISES
  const getCashFlowReport = useCallback((startDate: string, endDate: string): CashFlowReport => {
    const filteredMovements = getMovementsByDateRange(startDate, endDate);
    const totalIncome = filteredMovements
      .filter(m => m.type === 'entrada' && m.isPaid)
      .reduce((sum, m) => sum + m.amount, 0);
    const totalExpense = filteredMovements
      .filter(m => m.type === 'saida' && m.isPaid)
      .reduce((sum, m) => sum + m.amount, 0);
    const pendingIncome = filteredMovements
      .filter(m => m.type === 'entrada' && !m.isPaid)
      .reduce((sum, m) => sum + m.amount, 0);
    const pendingExpense = filteredMovements
      .filter(m => m.type === 'saida' && !m.isPaid)
      .reduce((sum, m) => sum + m.amount, 0);

    return {
      period: `${startDate} - ${endDate}`,
      openingBalance: 0,
      totalIncome,
      totalExpense,
      closingBalance: totalIncome - totalExpense,
      pendingIncome,
      pendingExpense,
      projectedBalance: totalIncome - totalExpense + pendingIncome - pendingExpense,
    };
  }, [getMovementsByDateRange]);

  const getOverdueAnalysis = useCallback((): OverdueAnalysis => {
    const overdueItems = getOverdueMovements();
    const totalOverdueAmount = overdueItems.reduce((sum, m) => sum + m.amount, 0);
    const oldestOverdueDate = overdueItems.length > 0
      ? overdueItems.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0].date
      : '';

    return {
      totalOverdueAmount,
      numberOfOverdueItems: overdueItems.length,
      oldestOverdueDate,
      overdueItems,
    };
  }, [getOverdueMovements]);

  const getFutureFlowForecast = useCallback((months: number): FutureFlowForecast[] => {
    // Implementação simplificada
    const forecasts: FutureFlowForecast[] = [];
    const today = new Date();

    for (let i = 0; i < months; i++) {
      const forecastDate = new Date(today);
      forecastDate.setMonth(forecastDate.getMonth() + i);
      const dateStr = forecastDate.toISOString().split('T')[0];

      forecasts.push({
        date: dateStr,
        projectedBalance: 0,
        expectedIncome: 0,
        expectedExpense: 0,
        criticalDates: [],
      });
    }

    return forecasts;
  }, []);

  // JUROS E MULTAS (localStorage temporário)
  const addDebtInterest = useCallback((movementId: string, interestRate: number, periodType: 'day' | 'month') => {
    setDebtInterests(prev => [...prev, { movementId, interestRate, periodType }]);
  }, []);

  const addDebtFine = useCallback((movementId: string, fineRate: number, fineType: 'percentage' | 'fixed') => {
    setDebtFines(prev => [...prev, { movementId, fineRate, fineType }]);
  }, []);

  const removeDebtInterest = useCallback((movementId: string) => {
    setDebtInterests(prev => prev.filter(di => di.movementId !== movementId));
  }, []);

  const removeDebtFine = useCallback((movementId: string) => {
    setDebtFines(prev => prev.filter(df => df.movementId !== movementId));
  }, []);

  const getMovementWithAccruedInterestAndFine = useCallback((movementId: string) => {
    const movement = movements.find(m => m.id === movementId);
    if (!movement) {
      return { movement: undefined, accruedInterest: 0, accruedFine: 0, totalAmount: 0 };
    }

    // Implementação simplificada
    return {
      movement,
      accruedInterest: 0,
      accruedFine: 0,
      totalAmount: movement.amount,
    };
  }, [movements]);

  // ESTATÍSTICAS
  const getMonthlyStats = useCallback((): DashboardStats => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const monthMovements = getMovementsByMonth(currentMonth);

    const totalEntrada = monthMovements
      .filter(m => m.type === 'entrada')
      .reduce((sum, m) => sum + m.amount, 0);
    
    const totalSaida = monthMovements
      .filter(m => m.type === 'saida')
      .reduce((sum, m) => sum + m.amount, 0);

    const fixoSaida = monthMovements
      .filter(m => m.type === 'saida' && m.classification === 'fixo')
      .reduce((sum, m) => sum + m.amount, 0);

    const ocasionalSaida = monthMovements
      .filter(m => m.type === 'saida' && m.classification === 'ocasional')
      .reduce((sum, m) => sum + m.amount, 0);

    const fixoEntrada = monthMovements
      .filter(m => m.type === 'entrada' && m.classification === 'fixo')
      .reduce((sum, m) => sum + m.amount, 0);

    const ocasionalEntrada = monthMovements
      .filter(m => m.type === 'entrada' && m.classification === 'ocasional')
      .reduce((sum, m) => sum + m.amount, 0);

    const atrasado = monthMovements
      .filter(m => m.isOverdue)
      .reduce((sum, m) => sum + m.amount, 0);

    const pendente = monthMovements
      .filter(m => m.status === 'pendente')
      .reduce((sum, m) => sum + m.amount, 0);

    const aReceber = monthMovements
      .filter(m => m.type === 'entrada' && !m.isPaid)
      .reduce((sum, m) => sum + m.amount, 0);

    const aPagar = monthMovements
      .filter(m => m.type === 'saida' && !m.isPaid)
      .reduce((sum, m) => sum + m.amount, 0);

    return {
      totalEntrada,
      totalSaida,
      liquido: totalEntrada - totalSaida,
      lucro: totalEntrada - totalSaida,
      fixoSaida,
      ocasionalSaida,
      fixoEntrada,
      ocasionalEntrada,
      atrasado,
      pendente,
      aReceber,
      aPagar,
    };
  }, [getMovementsByMonth]);

  const getMonthlySummary = useCallback((_startDate: string, _endDate: string): MonthlySummary[] => {
    // Implementação simplificada
    return [];
  }, []);

  // MÉTODOS ADICIONAIS
  const getNextDueInstallments = useCallback((days = 7) => {
    const result: Array<{ movement: Movement; installment: Installment }> = [];
    const today = new Date();
    const futureDate = new Date(today);
    futureDate.setDate(futureDate.getDate() + days);

    movements.forEach(m => {
      if (m.installments && Array.isArray(m.installments)) {
        m.installments.forEach(inst => {
          if (!inst.isPaid) {
            const instDate = new Date(inst.dueDate);
            if (instDate >= today && instDate <= futureDate) {
              result.push({ movement: m, installment: inst });
            }
          }
        });
      }
    });

    return result.sort((a, b) => new Date(a.installment.dueDate).getTime() - new Date(b.installment.dueDate).getTime());
  }, [movements]);

  const updateDebtInterest = useCallback((movementId: string, interestRate: number, periodType: 'day' | 'month') => {
    setDebtInterests(prev => {
      const existing = prev.find(di => di.movementId === movementId);
      if (existing) {
        return prev.map(di =>
          di.movementId === movementId
            ? { ...di, interestRate, periodType }
            : di
        );
      } else {
        return [...prev, { movementId, interestRate, periodType }];
      }
    });
  }, []);

  const getAllDebtInterests = useCallback((): DebtInterest[] => {
    return debtInterests;
  }, [debtInterests]);

  const calculateInterestAmount = useCallback((movementId: string): number => {
    const movement = movements.find(m => m.id === movementId);
    const interest = debtInterests.find(di => di.movementId === movementId);

    if (!movement || !interest || movement.isPaid) return 0;

    const movementDate = new Date(movement.date);
    const today = new Date();
    const daysPastDue = Math.max(0, Math.floor((today.getTime() - movementDate.getTime()) / (1000 * 60 * 60 * 24)));

    if (daysPastDue <= 0) return 0;

    const principal = movement.amount;
    
    if (interest.periodType === 'day') {
      return principal * (interest.interestRate / 100) * daysPastDue;
    } else {
      const monthsPastDue = daysPastDue / 30;
      return principal * (interest.interestRate / 100) * monthsPastDue;
    }
  }, [movements, debtInterests]);

  const updateDebtFine = useCallback((movementId: string, fineRate: number, fineType: 'percentage' | 'fixed') => {
    setDebtFines(prev => {
      const existing = prev.find(df => df.movementId === movementId);
      if (existing) {
        return prev.map(df =>
          df.movementId === movementId
            ? { ...df, fineRate, fineType }
            : df
        );
      } else {
        return [...prev, { movementId, fineRate, fineType }];
      }
    });
  }, []);

  const getAllDebtFines = useCallback((): DebtFine[] => {
    return debtFines;
  }, [debtFines]);

  const calculateFineAmount = useCallback((movementId: string): number => {
    const movement = movements.find(m => m.id === movementId);
    const fine = debtFines.find(df => df.movementId === movementId);

    if (!movement || !fine || movement.isPaid) return 0;

    const movementDate = new Date(movement.date);
    const today = new Date();
    const isPastDue = today > movementDate;

    if (!isPastDue) return 0;

    if (fine.fineType === 'fixed') {
      return fine.fineRate;
    } else {
      return movement.amount * (fine.fineRate / 100);
    }
  }, [movements, debtFines]);

  // MIGRAÇÃO
  const migrateFromLocalStorage = useCallback(async () => {
    try {
      const result = await migrateData();
      setMigrationCompleted(true);
      return result;
    } catch (err) {
      console.error('Erro na migração:', err);
      throw err;
    }
  }, [migrateData]);

  const value: CaixaContextType = {
    transactions,
    movements,
    loading,
    
    // Transações
    addTransaction,
    deleteTransaction,
    editTransaction,
    
    // Movimentações
    addMovement,
    addMultipleMovements,
    deleteMovement,
    editMovement,
    
    // Pagamentos
    markMovementAsPaid,
    markInstallmentAsPaid,
    markInstallmentAsPartiallyPaid,
    payPartialMovement,
    undoLastInstallmentPayment,
    undoMarkAsPaid,
    
    // Consultas
    getTransactionsByMonth,
    getMovementsByMonth,
    getPendingMovements,
    getOverdueMovements,
    getMovementsByStatus,
    getMovementsByCategory,
    getMovementsByDateRange,
    
    // Relatórios
    getCashFlowReport,
    getOverdueAnalysis,
    getFutureFlowForecast,
    
    // Juros e Multas
    debtInterests,
    debtFines,
    addDebtInterest,
    addDebtFine,
    removeDebtInterest,
    removeDebtFine,
    updateDebtInterest,
    updateDebtFine,
    getAllDebtInterests,
    getAllDebtFines,
    calculateInterestAmount,
    calculateFineAmount,
    getMovementWithAccruedInterestAndFine,
    
    // Estatísticas
    getMonthlyStats,
    getMonthlySummary,
    getNextDueInstallments,
    
    // Migração
    migrateFromLocalStorage,
    migrationStatus: {
      completed: migrationCompleted,
      result: migrationResult,
    },
  };

  return <CaixaContext.Provider value={value}>{children}</CaixaContext.Provider>;
};
