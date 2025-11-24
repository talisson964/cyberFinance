import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
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
  PurchaseItem
} from '../types';

interface CaixaContextType {
  transactions: Transaction[];
  movements: Movement[];
  
  // TRANSAÇÕES
  addTransaction: (
    type: TransactionType, 
    amount: number, 
    category: string, 
    description: string,
    date?: string,
    recurrence?: 'unica' | 'diaria' | 'semanal' | 'mensal' | 'anual'
  ) => void;
  deleteTransaction: (id: string) => void;
  editTransaction: (
    id: string, 
    amount: number, 
    category: string, 
    description: string,
    date?: string,
    recurrence?: 'unica' | 'diaria' | 'semanal' | 'mensal' | 'anual'
  ) => void;

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
  ) => { merged: boolean; itemCount?: number };
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
  }>) => void;
  deleteMovement: (id: string) => void;
  editMovement: (
    id: string,
    movementType: MovementType,
    amount: number,
    category: string,
    description: string,
    classification: ExpenseClassification,
    date?: string,
    notes?: string
  ) => void;

  // PAGAMENTOS E PARCELAS
  markMovementAsPaid: (id: string, paidDate: string) => void;
  markInstallmentAsPaid: (movementId: string, installmentNumber: number, paidDate: string) => void;
  markInstallmentAsPartiallyPaid: (movementId: string, installmentNumber: number, amount: number) => void;
  payPartialMovement: (id: string, amount: number, paidDate: string) => void;
  undoLastInstallmentPayment: (movementId: string) => void;
  undoMarkAsPaid: (movementId: string) => void;
  
  // CONSULTAS E FILTROS
  getTransactionsByMonth: (monthYear: string) => Transaction[];
  getMovementsByMonth: (monthYear: string) => Movement[];
  getPendingMovements: () => Movement[];
  getOverdueMovements: () => Movement[];
  getMovementsByStatus: (status: PaymentStatus) => Movement[];
  getMovementsByCategory: (category: string) => Movement[];
  getMovementsByDateRange: (startDate: string, endDate: string) => Movement[];
  
  // RELATÓRIOS E ANÁLISES
  getCashFlowReport: (monthYear?: string) => CashFlowReport;
  getOverdueAnalysis: () => OverdueAnalysis;
  getFutureFlowForecast: (days?: number) => FutureFlowForecast[];
  getInstallmentProgressByMovement: (movementId: string) => { paid: number; total: number; percentage: number };
  getNextDueInstallments: (days?: number) => Array<{ movement: Movement; installment: Installment }>;
  
  // GESTÃO DE JUROS EM DÍVIDAS
  addDebtInterest: (movementId: string, interestRate: number, periodType: 'day' | 'month') => void;
  removeDebtInterest: (movementId: string) => void;
  updateDebtInterest: (movementId: string, interestRate: number, periodType: 'day' | 'month') => void;
  getDebtInterest: (movementId: string) => DebtInterest | undefined;
  calculateInterestAmount: (movementId: string) => number;
  getAllDebtInterests: () => DebtInterest[];
  
  // GESTÃO DE MULTAS EM DÍVIDAS
  addDebtFine: (movementId: string, fineRate: number, fineType: 'percentage' | 'fixed') => void;
  removeDebtFine: (movementId: string) => void;
  updateDebtFine: (movementId: string, fineRate: number, fineType: 'percentage' | 'fixed') => void;
  getDebtFine: (movementId: string) => DebtFine | undefined;
  calculateFineAmount: (movementId: string) => number;
  getAllDebtFines: () => DebtFine[];
  
  // LEMBRETES
  addReminder: (movementId: string, reminderDate: string) => void;
  removeReminder: (movementId: string) => void;
  getDueReminders: () => Movement[];
  
  // ANOTAÇÕES
  addNotes: (movementId: string, notes: string) => void;
  
  // BUSCAS AVANÇADAS
  searchMovements: (query: string) => Movement[];
  getMovementsNearDueDate: (daysThreshold?: number) => Movement[];
  getRecurringTransactions: () => Transaction[];
  
  // LIMPEZA E BACKUP DE DADOS
  clearAllData: () => void;
  exportAllData: () => string;
  importAllData: (jsonData: string) => { success: boolean; error?: string };
  getDataSummary: () => { 
    totalMovements: number; 
    totalTransactions: number; 
    dataSize: string;
    lastUpdate: string;
  };
}

const CaixaContext = createContext<CaixaContextType | undefined>(undefined);

export const CaixaProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('caixa_transactions');
    return saved ? JSON.parse(saved) : [];
  });

  const [movements, setMovements] = useState<Movement[]>(() => {
    const saved = localStorage.getItem('caixa_movements');
    return saved ? JSON.parse(saved) : [];
  });

  const [debtInterests, setDebtInterests] = useState<DebtInterest[]>(() => {
    const saved = localStorage.getItem('caixa_debt_interests');
    return saved ? JSON.parse(saved) : [];
  });

  const [debtFines, setDebtFines] = useState<DebtFine[]>(() => {
    const saved = localStorage.getItem('caixa_debt_fines');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('caixa_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('caixa_movements', JSON.stringify(movements));
  }, [movements]);

  useEffect(() => {
    localStorage.setItem('caixa_debt_interests', JSON.stringify(debtInterests));
  }, [debtInterests]);

  useEffect(() => {
    localStorage.setItem('caixa_debt_fines', JSON.stringify(debtFines));
  }, [debtFines]);

  // FUNÇÕES DE TRANSAÇÃO
  const addTransaction = (
    type: TransactionType,
    amount: number,
    category: string,
    description: string,
    date?: string,
    recurrence?: 'unica' | 'diaria' | 'semanal' | 'mensal' | 'anual'
  ) => {
    const newTransaction: Transaction = {
      id: `${Date.now()}-${Math.random()}`,
      type,
      amount,
      category,
      description,
      date: date || new Date().toISOString().split('T')[0],
      timestamp: Date.now(),
      recurrence: recurrence || 'unica',
    };
    setTransactions([newTransaction, ...transactions]);
  };

  const deleteTransaction = (id: string) => {
    setTransactions(transactions.filter(t => t.id !== id));
  };

  const editTransaction = (
    id: string,
    amount: number,
    category: string,
    description: string,
    date?: string,
    recurrence?: 'unica' | 'diaria' | 'semanal' | 'mensal' | 'anual'
  ) => {
    setTransactions(transactions.map(t =>
      t.id === id 
        ? { 
            ...t, 
            amount, 
            category, 
            description,
            date: date || t.date,
            recurrence: recurrence || t.recurrence
          } 
        : t
    ));
  };

  // FUNÇÕES DE MOVIMENTAÇÃO
  const generateInstallments = (
    movementId: string,
    amount: number,
    totalInstallments: number,
    firstInstallmentDate: string
  ): Installment[] => {
    const installments: Installment[] = [];
    const firstDate = new Date(firstInstallmentDate);

    for (let i = 1; i <= totalInstallments; i++) {
      const dueDate = new Date(firstDate);
      dueDate.setMonth(dueDate.getMonth() + (i - 1));
      
      const now = new Date();
      const daysPastDue = dueDate < now ? Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;

      installments.push({
        id: `${movementId}-installment-${i}`,
        number: i,
        totalInstallments,
        amount: amount / totalInstallments,
        dueDate: dueDate.toISOString().split('T')[0],
        isPaid: false,
        daysPastDue,
      });
    }

    return installments;
  };

  const calculatePaymentStatus = (movement: Movement): PaymentStatus => {
    if (!movement.installments || !Array.isArray(movement.installments)) {
      return movement.isPaid ? 'pago' : (movement.partialPaidAmount ? 'parcial' : 'pendente');
    }

    const totalInstallments = movement.installments.length;
    const paidInstallments = movement.installments.filter(i => i.isPaid).length;

    if (paidInstallments === totalInstallments) return 'pago';
    if (paidInstallments > 0) return 'parcial';
    
    const hasOverdue = movement.installments.some(i => !i.isPaid && i.daysPastDue > 0);
    return hasOverdue ? 'atrasado' : 'pendente';
  };

  const calculateIsOverdue = (movement: Movement): boolean => {
    if (movement.isPaid) return false;
    
    if (movement.installments && Array.isArray(movement.installments)) {
      return movement.installments.some(i => !i.isPaid && i.daysPastDue > 0);
    }

    const now = new Date();
    const dueDate = new Date(movement.date);
    return dueDate < now && !movement.isPaid;
  };

  // Função para verificar se uma movimentação é similar a outra
  const isSimilarMovement = (mov1: Movement, mov2: Partial<Movement>): boolean => {
    // Extrair banco do cartão das notas se existir
    const extractBank = (notes?: string): string | null => {
      if (!notes) return null;
      const bankMatch = notes.match(/Banco:\s*([^\n]+)/);
      return bankMatch ? bankMatch[1].trim() : null;
    };

    const bank1 = extractBank(mov1.notes);
    const bank2 = extractBank(mov2.notes);

    return (
      mov1.type === 'saida' &&
      mov2.type === 'saida' &&
      mov1.date === mov2.date &&
      mov1.category === mov2.category &&
      mov1.movementType === mov2.movementType &&
      mov1.classification === mov2.classification &&
      mov1.totalInstallments === mov2.totalInstallments &&
      mov1.paidInstallments === mov2.paidInstallments &&
      bank1 === bank2
    );
  };

  // Função para mesclar movimentações similares
  const mergeSimilarMovements = (
    existingMovement: Movement,
    newAmount: number,
    newDescription: string
  ): Movement => {
    // Criar item da movimentação existente se ainda não tiver itens
    let existingItems: PurchaseItem[] = existingMovement.purchaseItems || [];
    
    if (existingItems.length === 0) {
      // Converter a movimentação existente em um item
      existingItems = [{
        id: `${Date.now()}-${Math.random()}`,
        name: existingMovement.description,
        quantity: 1,
        unitPrice: existingMovement.amount,
        total: existingMovement.amount,
      }];
    }

    // Adicionar novo item
    const newItem: PurchaseItem = {
      id: `${Date.now()}-${Math.random()}`,
      name: newDescription,
      quantity: 1,
      unitPrice: newAmount,
      total: newAmount,
    };

    const updatedItems = [...existingItems, newItem];
    const totalAmount = updatedItems.reduce((sum, item) => sum + item.total, 0);

    // Atualizar parcelas se existirem
    let updatedInstallments = existingMovement.installments;
    if (updatedInstallments && Array.isArray(updatedInstallments)) {
      const installmentAmount = totalAmount / updatedInstallments.length;
      updatedInstallments = updatedInstallments.map((inst) => ({
        ...inst,
        amount: installmentAmount,
      }));
    }

    return {
      ...existingMovement,
      amount: totalAmount,
      purchaseItems: updatedItems,
      installments: updatedInstallments,
      description: `Compra com ${updatedItems.length} itens`,
    };
  };

  const addMovement = (
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
  ): { merged: boolean; itemCount?: number } => {
    const movementId = `${Date.now()}-${Math.random()}`;
    const movementDate = date || new Date().toISOString().split('T')[0];
    
    const installments = totalInstallments && totalInstallments > 1 && firstInstallmentDate
      ? generateInstallments(movementId, amount, totalInstallments, firstInstallmentDate)
      : undefined;

    const newMovementData: Partial<Movement> = {
      type,
      movementType,
      amount,
      category,
      description,
      date: movementDate,
      classification,
      totalInstallments,
      paidInstallments: 0,
      notes,
    };

    // Verificar se existe uma movimentação similar recente (categoria fornecedores)
    if (type === 'saida' && category.includes('Fornecedores')) {
      const similarMovement = movements.find(mov => isSimilarMovement(mov, newMovementData));
      
      if (similarMovement) {
        // Mesclar com movimentação existente
        const mergedMovement = mergeSimilarMovements(similarMovement, amount, description);
        
        // Atualizar lista de movimentações
        setMovements(movements.map(mov => 
          mov.id === similarMovement.id ? mergedMovement : mov
        ));
        
        return { 
          merged: true, 
          itemCount: mergedMovement.purchaseItems?.length || 0 
        };
      }
    }

    // Criar nova movimentação normalmente
    // Marca como pago automaticamente se for PIX ou Débito
    const shouldMarkAsPaid = movementType === 'pix' || movementType === 'debito';
    const paidDate = shouldMarkAsPaid ? movementDate : undefined;

    const newMovement: Movement = {
      id: movementId,
      transactionId: `${Date.now()}-${Math.random()}`,
      type,
      movementType,
      amount,
      category,
      description,
      date: movementDate,
      timestamp: Date.now(),
      classification,
      installments,
      totalInstallments,
      paidInstallments: 0,
      isPaid: shouldMarkAsPaid,
      isOverdue: false,
      notes,
      status: shouldMarkAsPaid ? 'pago' : 'pendente',
      fixedExpenseDuration,
      purchaseItems,
      ...(shouldMarkAsPaid && { paidDate }),
    };

    setMovements([newMovement, ...movements]);
    
    return { merged: false };
  };

  const addMultipleMovements = (movementsToAdd: Array<{
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
    const newMovements = movementsToAdd.map((item) => {
      const movementId = `${Date.now()}-${Math.random()}`;
      const movementDate = item.date || new Date().toISOString().split('T')[0];
      
      let installments = item.totalInstallments && item.totalInstallments > 1 && item.firstInstallmentDate
        ? generateInstallments(movementId, item.amount, item.totalInstallments, item.firstInstallmentDate)
        : undefined;

      // Se houver parcelas pagas, marcar as primeiras como pagas
      if (installments && item.paidInstallments && item.paidInstallments > 0) {
        const paidCount = item.paidInstallments;
        installments = installments.map((inst, index) => 
          index < paidCount
            ? { ...inst, isPaid: true, paidDate: new Date().toISOString().split('T')[0] }
            : inst
        );
      }

      const totalPaid = installments ? installments.filter(inst => inst.isPaid).length : 0;
      const allInstallmentsPaid = installments ? totalPaid === installments.length : false;
      
      // Marcar como pago se shouldMarkAsPaid for true (PIX, Débito)
      // ou se todas as parcelas forem pagas
      const shouldBePaid = item.shouldMarkAsPaid || allInstallmentsPaid;
      const paidDate = shouldBePaid ? item.date || new Date().toISOString().split('T')[0] : undefined;

      return {
        id: movementId,
        transactionId: `${Date.now()}-${Math.random()}`,
        type: item.type,
        movementType: item.movementType,
        amount: item.amount,
        category: item.category,
        description: item.description,
        date: movementDate,
        timestamp: Date.now(),
        classification: item.classification,
        installments,
        totalInstallments: item.totalInstallments,
        paidInstallments: totalPaid,
        isPaid: shouldBePaid,
        isOverdue: false,
        notes: item.notes,
        status: shouldBePaid ? 'pago' : 'pendente',
        purchaseItems: item.purchaseItems,
        ...(shouldBePaid && { paidDate }),
      } as Movement;
    });

    setMovements([...newMovements, ...movements]);
  };

  const deleteMovement = (id: string) => {
    setMovements(movements.filter(m => m.id !== id));
  };

  const editMovement = (
    id: string,
    movementType: MovementType,
    amount: number,
    category: string,
    description: string,
    classification: ExpenseClassification,
    date?: string,
    notes?: string
  ) => {
    setMovements(movements.map(m =>
      m.id === id
        ? {
            ...m,
            movementType,
            amount,
            category,
            description,
            classification,
            date: date || m.date,
            notes: notes !== undefined ? notes : m.notes,
          }
        : m
    ));
  };

  // MARCAÇÃO DE PAGAMENTOS
  const markMovementAsPaid = (id: string, paidDate: string) => {
    setMovements(movements.map(m =>
      m.id === id
        ? {
            ...m,
            isPaid: true,
            paidDate,
            lastPaymentDate: paidDate,
            status: 'pago' as PaymentStatus,
            partialPaidAmount: undefined,
            isOverdue: false,
          }
        : m
    ));
  };

  const markInstallmentAsPaid = (movementId: string, installmentNumber: number, paidDate: string) => {
    setMovements(movements.map(m =>
      m.id === movementId && m.installments
        ? {
            ...(() => {
              const updatedInstallments = m.installments!.map((inst) =>
                inst.number === installmentNumber
                  ? { ...inst, isPaid: true, paidDate }
                  : inst
              );
              
              const paidCount = updatedInstallments.filter(inst => inst.isPaid).length;
              const totalCount = updatedInstallments.length;
              const allPaid = paidCount === totalCount;

              return {
                ...m,
                installments: updatedInstallments,
                paidInstallments: paidCount,
                isPaid: allPaid,
                status: allPaid ? ('pago' as PaymentStatus) : calculatePaymentStatus({
                  ...m,
                  installments: updatedInstallments,
                }),
                lastPaymentDate: paidDate,
                ...(allPaid && { paidDate }),
              };
            })()
          }
        : m
    ));
  };

  const markInstallmentAsPartiallyPaid = (movementId: string, installmentNumber: number, amount: number) => {
    setMovements(movements.map(m =>
      m.id === movementId && m.installments && Array.isArray(m.installments)
        ? {
            ...m,
            installments: m.installments.map(inst =>
              inst.number === installmentNumber
                ? { ...inst, amount: inst.amount - amount }
                : inst
            ),
            partialPaidAmount: (m.partialPaidAmount || 0) + amount,
            status: 'parcial' as PaymentStatus,
          }
        : m
    ));
  };

  const payPartialMovement = (id: string, amount: number, paidDate: string) => {
    setMovements(movements.map(m =>
      m.id === id
        ? {
            ...m,
            partialPaidAmount: (m.partialPaidAmount || 0) + amount,
            lastPaymentDate: paidDate,
            status: m.partialPaidAmount ? 'parcial' : 'pendente',
          }
        : m
    ));
  };

  // Função para desfazer último pagamento de parcela
  const undoLastInstallmentPayment = (movementId: string) => {
    const movement = movements.find(m => m.id === movementId);
    if (!movement || !movement.installments) return;

    // Encontra a última parcela paga
    const lastPaidIndex = [...movement.installments].reverse().findIndex(inst => inst.isPaid);
    if (lastPaidIndex === -1) return;

    const lastPaidInstallment = movement.installments[movement.installments.length - 1 - lastPaidIndex];

    // Desfaz o pagamento
    setMovements(movements.map(m =>
      m.id === movementId && m.installments && Array.isArray(m.installments)
        ? {
            ...m,
            installments: m.installments.map(inst =>
              inst.number === lastPaidInstallment.number
                ? { ...inst, isPaid: false, paidDate: undefined }
                : inst
            ),
            paidInstallments: (m.paidInstallments || 1) - 1,
            isPaid: false,
            status: 'pendente' as PaymentStatus,
          }
        : m
    ));
  };

  // Função para desfazer marcação como pago
  const undoMarkAsPaid = (movementId: string) => {
    const movement = movements.find(m => m.id === movementId);
    if (!movement) return;

    // Desfaz a marcação
    setMovements(movements.map(m =>
      m.id === movementId
        ? {
            ...m,
            isPaid: false,
            paidDate: undefined,
            status: 'pendente' as PaymentStatus,
            isOverdue: false,
          }
        : m
    ));
  };

  // CONSULTAS E FILTROS
  const getTransactionsByMonth = (monthYear: string) => {
    return transactions.filter(t => t.date.substring(0, 7) === monthYear);
  };

  const getMovementsByMonth = (monthYear: string) => {
    return movements.filter(m => m.date.substring(0, 7) === monthYear);
  };

  const getPendingMovements = () => {
    return movements.filter(m => !m.isPaid);
  };

  const getOverdueMovements = () => {
    return movements.filter(m => calculateIsOverdue(m));
  };

  const getMovementsByStatus = (status: PaymentStatus) => {
    return movements.filter(m => calculatePaymentStatus(m) === status);
  };

  const getMovementsByCategory = (category: string) => {
    return movements.filter(m => m.category === category);
  };

  const getMovementsByDateRange = (startDate: string, endDate: string) => {
    return movements.filter(m => m.date >= startDate && m.date <= endDate);
  };

  // RELATÓRIOS E ANÁLISES
  const getCashFlowReport = (monthYear?: string): CashFlowReport => {
    const month = monthYear || new Date().toISOString().substring(0, 7);
    const monthTransactions = [...getTransactionsByMonth(month), ...getMovementsByMonth(month)];

    const totalIncome = monthTransactions
      .filter(t => 'type' in t && t.type === 'entrada')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = monthTransactions
      .filter(t => 'type' in t && t.type === 'saida')
      .reduce((sum, t) => sum + t.amount, 0);

    const pendingMovements = getPendingMovements();
    const pendingIncome = pendingMovements
      .filter(m => m.type === 'entrada')
      .reduce((sum, m) => sum + (m.amount - (m.partialPaidAmount || 0)), 0);

    const pendingExpense = pendingMovements
      .filter(m => m.type === 'saida')
      .reduce((sum, m) => sum + (m.amount - (m.partialPaidAmount || 0)), 0);

    return {
      period: month,
      openingBalance: 0,
      totalIncome,
      totalExpense,
      closingBalance: totalIncome - totalExpense,
      pendingIncome,
      pendingExpense,
      projectedBalance: (totalIncome - totalExpense) + (pendingIncome - pendingExpense),
    };
  };

  const getOverdueAnalysis = (): OverdueAnalysis => {
    const overdueMovements = getOverdueMovements();

    const totalOverdueAmount = overdueMovements.reduce((sum, m) => {
      const remainingAmount = m.amount - (m.partialPaidAmount || 0);
      return sum + remainingAmount;
    }, 0);

    const oldestOverdueDate = overdueMovements.length > 0
      ? overdueMovements.reduce((oldest: string, m: Movement) => m.date < oldest ? m.date : oldest, overdueMovements[0].date)
      : new Date().toISOString().split('T')[0];

    return {
      totalOverdueAmount,
      numberOfOverdueItems: overdueMovements.length,
      oldestOverdueDate,
      overdueItems: overdueMovements,
    };
  };

  const getFutureFlowForecast = (days = 30): FutureFlowForecast[] => {
    const forecast: FutureFlowForecast[] = [];
    const today = new Date();

    for (let i = 0; i < days; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];

      const dueDates = movements.filter(m => {
        if (m.installments && Array.isArray(m.installments)) {
          return m.installments.some(inst => inst.dueDate === dateStr && !inst.isPaid);
        }
        return m.date === dateStr && !m.isPaid;
      });

      const expectedIncome = dueDates
        .filter(m => m.type === 'entrada')
        .reduce((sum, m) => sum + m.amount, 0);

      const expectedExpense = dueDates
        .filter(m => m.type === 'saida')
        .reduce((sum, m) => sum + m.amount, 0);

      if (dueDates.length > 0) {
        forecast.push({
          date: dateStr,
          projectedBalance: 0,
          expectedIncome,
          expectedExpense,
          criticalDates: dueDates.map(m => m.date),
        });
      }
    }

    return forecast;
  };

  const getInstallmentProgressByMovement = (movementId: string) => {
    const movement = movements.find(m => m.id === movementId);
    if (!movement || !movement.installments || !Array.isArray(movement.installments)) {
      return { paid: 0, total: 0, percentage: 0 };
    }

    const paid = movement.installments.filter(i => i.isPaid).length;
    const total = movement.installments.length;

    return {
      paid,
      total,
      percentage: total > 0 ? (paid / total) * 100 : 0,
    };
  };

  const getNextDueInstallments = (days = 7) => {
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
  };

  // LEMBRETES
  const addReminder = (movementId: string, reminderDate: string) => {
    setMovements(movements.map(m =>
      m.id === movementId ? { ...m, reminderDate } : m
    ));
  };

  const removeReminder = (movementId: string) => {
    setMovements(movements.map(m =>
      m.id === movementId ? { ...m, reminderDate: undefined } : m
    ));
  };

  const getDueReminders = () => {
    const today = new Date().toISOString().split('T')[0];
    return movements.filter(m => m.reminderDate && m.reminderDate <= today);
  };

  // ANOTAÇÕES
  const addNotes = (movementId: string, notes: string) => {
    setMovements(movements.map(m =>
      m.id === movementId ? { ...m, notes } : m
    ));
  };

  // BUSCAS AVANÇADAS
  const searchMovements = (query: string) => {
    const lowerQuery = query.toLowerCase();
    return movements.filter(m =>
      m.description.toLowerCase().includes(lowerQuery) ||
      m.category.toLowerCase().includes(lowerQuery) ||
      m.notes?.toLowerCase().includes(lowerQuery)
    );
  };

  const getMovementsNearDueDate = (daysThreshold = 7) => {
    const today = new Date();
    const threshold = new Date(today);
    threshold.setDate(threshold.getDate() + daysThreshold);

    return movements.filter(m => {
      if (m.isPaid) return false;

      if (m.installments && Array.isArray(m.installments)) {
        return m.installments.some(inst => {
          const instDate = new Date(inst.dueDate);
          return instDate >= today && instDate <= threshold && !inst.isPaid;
        });
      }

      const mDate = new Date(m.date);
      return mDate >= today && mDate <= threshold;
    });
  };

  const getRecurringTransactions = () => {
    return transactions.filter(t => t.recurrence !== 'unica');
  };

  const clearAllData = () => {
    setTransactions([]);
    setMovements([]);
    setDebtInterests([]);
    setDebtFines([]);
    localStorage.removeItem('caixa_transactions');
    localStorage.removeItem('caixa_movements');
    localStorage.removeItem('caixa_debt_interests');
    localStorage.removeItem('caixa_debt_fines');
  };

  const exportAllData = (): string => {
    const dataToExport = {
      version: '1.0.0',
      exportDate: new Date().toISOString(),
      transactions,
      movements,
      debtInterests,
      debtFines
    };
    return JSON.stringify(dataToExport, null, 2);
  };

  const importAllData = (jsonData: string): { success: boolean; error?: string } => {
    try {
      const data = JSON.parse(jsonData);
      
      // Validar estrutura básica
      if (!data.transactions || !data.movements) {
        return { success: false, error: 'Formato de dados inválido' };
      }

      // Importar dados
      setTransactions(data.transactions || []);
      setMovements(data.movements || []);
      setDebtInterests(data.debtInterests || []);
      setDebtFines(data.debtFines || []);

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro ao importar dados' 
      };
    }
  };

  const getDataSummary = () => {
    const dataSize = new Blob([
      JSON.stringify({ transactions, movements, debtInterests, debtFines })
    ]).size;
    
    const formatBytes = (bytes: number) => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    return {
      totalMovements: movements.length,
      totalTransactions: transactions.length,
      dataSize: formatBytes(dataSize),
      lastUpdate: new Date().toLocaleString('pt-BR')
    };
  };

  // FUNÇÕES DE GESTÃO DE JUROS EM DÍVIDAS
  const addDebtInterest = (movementId: string, interestRate: number, periodType: 'day' | 'month') => {
    const existing = debtInterests.find(d => d.movementId === movementId);
    if (existing) {
      setDebtInterests(debtInterests.map(d => 
        d.movementId === movementId ? { movementId, interestRate, periodType } : d
      ));
    } else {
      setDebtInterests([...debtInterests, { movementId, interestRate, periodType }]);
    }
  };

  const removeDebtInterest = (movementId: string) => {
    setDebtInterests(debtInterests.filter(d => d.movementId !== movementId));
  };

  const updateDebtInterest = (movementId: string, interestRate: number, periodType: 'day' | 'month') => {
    setDebtInterests(debtInterests.map(d => 
      d.movementId === movementId ? { movementId, interestRate, periodType } : d
    ));
  };

  const getDebtInterest = (movementId: string): DebtInterest | undefined => {
    return debtInterests.find(d => d.movementId === movementId);
  };

  const getAllDebtInterests = (): DebtInterest[] => {
    return debtInterests;
  };

  const calculateInterestAmount = (movementId: string): number => {
    const movement = movements.find(m => m.id === movementId);
    const interest = debtInterests.find(d => d.movementId === movementId);

    if (!movement || !interest) return 0;

    const now = new Date();
    const movementDate = new Date(movement.date);
    
    let periodsPassed = 0;
    if (interest.periodType === 'month') {
      const monthDiff = (now.getFullYear() - movementDate.getFullYear()) * 12;
      periodsPassed = monthDiff + (now.getMonth() - movementDate.getMonth());
    } else {
      const timeDiff = now.getTime() - movementDate.getTime();
      periodsPassed = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    }

    const totalInterestRate = (interest.interestRate * periodsPassed) / 100;
    return movement.amount * totalInterestRate;
  };

  // FUNÇÕES DE GESTÃO DE MULTAS EM DÍVIDAS
  const addDebtFine = (movementId: string, fineRate: number, fineType: 'percentage' | 'fixed') => {
    const existing = debtFines.find(f => f.movementId === movementId);
    if (existing) {
      setDebtFines(debtFines.map(f => 
        f.movementId === movementId ? { movementId, fineRate, fineType, appliedDate: new Date().toISOString().split('T')[0] } : f
      ));
    } else {
      setDebtFines([...debtFines, { movementId, fineRate, fineType, appliedDate: new Date().toISOString().split('T')[0] }]);
    }
  };

  const removeDebtFine = (movementId: string) => {
    setDebtFines(debtFines.filter(f => f.movementId !== movementId));
  };

  const updateDebtFine = (movementId: string, fineRate: number, fineType: 'percentage' | 'fixed') => {
    setDebtFines(debtFines.map(f => 
      f.movementId === movementId ? { movementId, fineRate, fineType, appliedDate: f.appliedDate } : f
    ));
  };

  const getDebtFine = (movementId: string): DebtFine | undefined => {
    return debtFines.find(f => f.movementId === movementId);
  };

  const getAllDebtFines = (): DebtFine[] => {
    return debtFines;
  };

  const calculateFineAmount = (movementId: string): number => {
    const movement = movements.find(m => m.id === movementId);
    const fine = debtFines.find(f => f.movementId === movementId);

    if (!movement || !fine) return 0;

    if (fine.fineType === 'fixed') {
      return fine.fineRate;
    } else {
      return (movement.amount * fine.fineRate) / 100;
    }
  };

  const value: CaixaContextType = {
    transactions,
    movements,
    addTransaction,
    deleteTransaction,
    editTransaction,
    addMovement,
    addMultipleMovements,
    deleteMovement,
    editMovement,
    markMovementAsPaid,
    markInstallmentAsPaid,
    markInstallmentAsPartiallyPaid,
    payPartialMovement,
    undoLastInstallmentPayment,
    undoMarkAsPaid,
    getTransactionsByMonth,
    getMovementsByMonth,
    getPendingMovements,
    getOverdueMovements,
    getMovementsByStatus,
    getMovementsByCategory,
    getMovementsByDateRange,
    getCashFlowReport,
    getOverdueAnalysis,
    getFutureFlowForecast,
    getInstallmentProgressByMovement,
    getNextDueInstallments,
    addDebtInterest,
    removeDebtInterest,
    updateDebtInterest,
    getDebtInterest,
    calculateInterestAmount,
    getAllDebtInterests,
    addDebtFine,
    removeDebtFine,
    updateDebtFine,
    getDebtFine,
    calculateFineAmount,
    getAllDebtFines,
    addReminder,
    removeReminder,
    getDueReminders,
    addNotes,
    searchMovements,
    getMovementsNearDueDate,
    getRecurringTransactions,
    clearAllData,
    exportAllData,
    importAllData,
    getDataSummary,
  };

  return (
    <CaixaContext.Provider value={value}>
      {children}
    </CaixaContext.Provider>
  );
};

export const useCaixa = () => {
  const context = useContext(CaixaContext);
  if (!context) {
    throw new Error('useCaixa deve ser usado dentro do CaixaProvider');
  }
  return context;
};
