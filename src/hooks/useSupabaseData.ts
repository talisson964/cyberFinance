import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { 
  Movement, 
  Transaction,
  MovementType,
  TransactionType,
  ExpenseClassification,
  EntradaSubcategory,
  SaidaSubcategory
} from '../types';

// ============================================
// Hook: useMovements
// ============================================
export const useMovements = () => {
  const { user } = useAuth();
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Buscar todas as movimentações do usuário
  const fetchMovements = useCallback(async () => {
    if (!user) {
      setMovements([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('movements')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (fetchError) throw fetchError;

      // Transformar dados do Supabase para o formato da aplicação
      const formattedMovements: Movement[] = (data || []).map(item => ({
        id: item.id,
        transactionId: item.transaction_id,
        type: item.type as TransactionType,
        movementType: item.movement_type as MovementType,
        amount: parseFloat(item.amount),
        category: item.category,
        subcategory: item.subcategory as EntradaSubcategory | SaidaSubcategory | undefined,
        description: item.description,
        date: item.date,
        timestamp: item.timestamp,
        classification: item.classification as ExpenseClassification,
        status: item.status,
        isPaid: item.is_paid,
        paidDate: item.paid_date,
        partialPaidAmount: item.partial_paid_amount ? parseFloat(item.partial_paid_amount) : undefined,
        lastPaymentDate: item.last_payment_date,
        reminderDate: item.reminder_date,
        isOverdue: item.is_overdue,
        overdueAmount: item.overdue_amount ? parseFloat(item.overdue_amount) : undefined,
        notes: item.notes,
        attachmentUrl: item.attachment_url,
        comprovante: item.comprovante,
        fixedExpenseDuration: item.fixed_expense_duration,
        installments: item.installments,
        totalInstallments: item.total_installments,
        paidInstallments: item.paid_installments,
        purchaseItems: item.purchase_items,
      }));

      setMovements(formattedMovements);
      setError(null);
    } catch (err) {
      console.error('Erro ao buscar movimentações:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Adicionar nova movimentação
  const addMovement = useCallback(async (movement: Omit<Movement, 'id'>) => {
    if (!user) throw new Error('Usuário não autenticado');

    try {
      const { data, error: insertError } = await supabase
        .from('movements')
        .insert({
          user_id: user.id,
          transaction_id: movement.transactionId,
          type: movement.type,
          movement_type: movement.movementType,
          amount: movement.amount,
          category: movement.category,
          subcategory: movement.subcategory,
          description: movement.description,
          date: movement.date,
          timestamp: movement.timestamp,
          classification: movement.classification,
          status: movement.status,
          is_paid: movement.isPaid,
          paid_date: movement.paidDate,
          partial_paid_amount: movement.partialPaidAmount,
          last_payment_date: movement.lastPaymentDate,
          reminder_date: movement.reminderDate,
          is_overdue: movement.isOverdue,
          overdue_amount: movement.overdueAmount,
          notes: movement.notes,
          attachment_url: movement.attachmentUrl,
          comprovante: movement.comprovante,
          fixed_expense_duration: movement.fixedExpenseDuration,
          installments: movement.installments,
          total_installments: movement.totalInstallments,
          paid_installments: movement.paidInstallments,
          purchase_items: movement.purchaseItems,
          payment_method: movement.movementType,
          bank: '',
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Atualizar estado local
      await fetchMovements();
      return data;
    } catch (err) {
      console.error('Erro ao adicionar movimentação:', err);
      throw err;
    }
  }, [user, fetchMovements]);

  // Atualizar movimentação existente
  const updateMovement = useCallback(async (id: string, updates: Partial<Movement>) => {
    if (!user) throw new Error('Usuário não autenticado');

    try {
      const { error: updateError } = await supabase
        .from('movements')
        .update({
          ...(updates.transactionId && { transaction_id: updates.transactionId }),
          ...(updates.type && { type: updates.type }),
          ...(updates.movementType && { movement_type: updates.movementType }),
          ...(updates.amount !== undefined && { amount: updates.amount }),
          ...(updates.category && { category: updates.category }),
          ...(updates.subcategory && { subcategory: updates.subcategory }),
          ...(updates.description && { description: updates.description }),
          ...(updates.date && { date: updates.date }),
          ...(updates.classification && { classification: updates.classification }),
          ...(updates.status && { status: updates.status }),
          ...(updates.isPaid !== undefined && { is_paid: updates.isPaid }),
          ...(updates.paidDate && { paid_date: updates.paidDate }),
          ...(updates.partialPaidAmount !== undefined && { partial_paid_amount: updates.partialPaidAmount }),
          ...(updates.lastPaymentDate && { last_payment_date: updates.lastPaymentDate }),
          ...(updates.reminderDate && { reminder_date: updates.reminderDate }),
          ...(updates.isOverdue !== undefined && { is_overdue: updates.isOverdue }),
          ...(updates.overdueAmount !== undefined && { overdue_amount: updates.overdueAmount }),
          ...(updates.notes && { notes: updates.notes }),
          ...(updates.attachmentUrl && { attachment_url: updates.attachmentUrl }),
          ...(updates.comprovante && { comprovante: updates.comprovante }),
          ...(updates.fixedExpenseDuration !== undefined && { fixed_expense_duration: updates.fixedExpenseDuration }),
          ...(updates.installments && { installments: updates.installments }),
          ...(updates.totalInstallments !== undefined && { total_installments: updates.totalInstallments }),
          ...(updates.paidInstallments !== undefined && { paid_installments: updates.paidInstallments }),
          ...(updates.purchaseItems && { purchase_items: updates.purchaseItems }),
        })
        .eq('id', id)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      // Atualizar estado local
      await fetchMovements();
    } catch (err) {
      console.error('Erro ao atualizar movimentação:', err);
      throw err;
    }
  }, [user, fetchMovements]);

  // Deletar movimentação
  const deleteMovement = useCallback(async (id: string) => {
    if (!user) throw new Error('Usuário não autenticado');

    try {
      const { error: deleteError } = await supabase
        .from('movements')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      // Atualizar estado local
      await fetchMovements();
    } catch (err) {
      console.error('Erro ao deletar movimentação:', err);
      throw err;
    }
  }, [user, fetchMovements]);

  // Carregar dados ao montar ou quando o usuário mudar
  useEffect(() => {
    fetchMovements();
  }, [fetchMovements]);

  // Configurar realtime subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('movements_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'movements',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          // Recarregar dados quando houver mudanças
          fetchMovements();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchMovements]);

  return {
    movements,
    loading,
    error,
    addMovement,
    updateMovement,
    deleteMovement,
    refresh: fetchMovements,
  };
};

// ============================================
// Hook: useTransactions
// ============================================
export const useTransactions = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Buscar todas as transações do usuário
  const fetchTransactions = useCallback(async () => {
    if (!user) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('due_date', { ascending: false });

      if (fetchError) throw fetchError;

      // Transformar dados do Supabase para o formato da aplicação
      const formattedTransactions: Transaction[] = (data || []).map(item => ({
        id: item.id,
        type: item.type === 'receive' ? 'entrada' : 'saida',
        amount: parseFloat(item.amount),
        category: item.category,
        description: item.description,
        date: item.due_date,
        timestamp: item.timestamp,
        recurrence: item.recurrence as 'unica' | 'diaria' | 'semanal' | 'mensal' | 'anual' | undefined,
      }));

      setTransactions(formattedTransactions);
      setError(null);
    } catch (err) {
      console.error('Erro ao buscar transações:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Adicionar nova transação
  const addTransaction = useCallback(async (transaction: Omit<Transaction, 'id'>) => {
    if (!user) throw new Error('Usuário não autenticado');

    try {
      const { data, error: insertError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          type: transaction.type === 'entrada' ? 'receive' : 'pay',
          amount: transaction.amount,
          category: transaction.category,
          description: transaction.description,
          due_date: transaction.date,
          timestamp: transaction.timestamp,
          recurrence: transaction.recurrence,
          status: 'pending',
          export_type: 'nenhum',
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Atualizar estado local
      await fetchTransactions();
      return data;
    } catch (err) {
      console.error('Erro ao adicionar transação:', err);
      throw err;
    }
  }, [user, fetchTransactions]);

  // Atualizar transação existente
  const updateTransaction = useCallback(async (id: string, updates: Partial<Transaction>) => {
    if (!user) throw new Error('Usuário não autenticado');

    try {
      const { error: updateError } = await supabase
        .from('transactions')
        .update({
          ...(updates.type && { type: updates.type === 'entrada' ? 'receive' : 'pay' }),
          ...(updates.amount !== undefined && { amount: updates.amount }),
          ...(updates.category && { category: updates.category }),
          ...(updates.description && { description: updates.description }),
          ...(updates.date && { due_date: updates.date }),
          ...(updates.recurrence && { recurrence: updates.recurrence }),
        })
        .eq('id', id)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      // Atualizar estado local
      await fetchTransactions();
    } catch (err) {
      console.error('Erro ao atualizar transação:', err);
      throw err;
    }
  }, [user, fetchTransactions]);

  // Deletar transação
  const deleteTransaction = useCallback(async (id: string) => {
    if (!user) throw new Error('Usuário não autenticado');

    try {
      const { error: deleteError } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      // Atualizar estado local
      await fetchTransactions();
    } catch (err) {
      console.error('Erro ao deletar transação:', err);
      throw err;
    }
  }, [user, fetchTransactions]);

  // Carregar dados ao montar ou quando o usuário mudar
  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Configurar realtime subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('transactions_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          // Recarregar dados quando houver mudanças
          fetchTransactions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchTransactions]);

  return {
    transactions,
    loading,
    error,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    refresh: fetchTransactions,
  };
};

// ============================================
// Hook: useMigrateLocalStorage
// ============================================
export const useMigrateLocalStorage = () => {
  const { user } = useAuth();
  const [migrating, setMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState<any>(null);

  const migrateData = useCallback(async () => {
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    setMigrating(true);
    try {
      // Buscar dados do localStorage
      const localMovements = localStorage.getItem('caixa_movements');
      const localTransactions = localStorage.getItem('caixa_transactions');
      const localInterests = localStorage.getItem('caixa_debt_interests');
      const localFines = localStorage.getItem('caixa_debt_fines');

      // Chamar função de migração do Supabase
      const { data, error } = await supabase.rpc('migrate_local_data', {
        p_movements: localMovements ? JSON.parse(localMovements) : null,
        p_transactions: localTransactions ? JSON.parse(localTransactions) : null,
        p_debt_interests: localInterests ? JSON.parse(localInterests) : null,
        p_debt_fines: localFines ? JSON.parse(localFines) : null,
      });

      if (error) throw error;

      setMigrationResult(data);

      // Limpar localStorage após migração bem-sucedida
      if (data.success) {
        localStorage.removeItem('caixa_movements');
        localStorage.removeItem('caixa_transactions');
        localStorage.removeItem('caixa_debt_interests');
        localStorage.removeItem('caixa_debt_fines');
        
        // Marcar que a migração foi feita
        localStorage.setItem('migration_completed', 'true');
      }

      return data;
    } catch (err) {
      console.error('Erro na migração:', err);
      throw err;
    } finally {
      setMigrating(false);
    }
  }, [user]);

  return {
    migrateData,
    migrating,
    migrationResult,
  };
};
