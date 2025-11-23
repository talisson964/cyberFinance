/**
 * EXEMPLO DE MIGRAÇÃO DO CAIXACONTEXT PARA SUPABASE
 * 
 * Este arquivo mostra como migrar as funções do CaixaContext
 * de localStorage para Supabase Database
 * 
 * INSTRUÇÕES:
 * 1. Substitua o conteúdo do arquivo src/context/CaixaContext.tsx
 * 2. Cada função CRUD agora faz chamadas ao Supabase
 * 3. Dados são isolados automaticamente por user_id (RLS)
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

// ============================================
// EXEMPLO 1: Carregar Movements do Supabase
// ============================================

// ANTES (localStorage):
/*
const [movements, setMovements] = useState<Movement[]>(() => {
  const saved = localStorage.getItem('movements');
  return saved ? JSON.parse(saved) : [];
});
*/

// DEPOIS (Supabase):
const [movements, setMovements] = useState<Movement[]>([]);
const { user } = useAuth();

useEffect(() => {
  if (user) {
    loadMovements();
  }
}, [user]);

const loadMovements = async () => {
  try {
    const { data, error } = await supabase
      .from('movements')
      .select('*')
      .order('date', { ascending: false });
    
    if (error) throw error;
    
    // Converter formato do banco para formato da aplicação
    const formatted = data.map(item => ({
      id: item.id,
      description: item.description,
      amount: parseFloat(item.amount),
      type: item.type,
      category: item.category,
      date: item.date,
      paymentMethod: item.payment_method,
      bank: item.bank,
      notes: item.notes
    }));
    
    setMovements(formatted);
  } catch (error) {
    console.error('Erro ao carregar movimentações:', error);
  }
};

// ============================================
// EXEMPLO 2: Adicionar Movement
// ============================================

// ANTES (localStorage):
/*
const addMovement = (movement: Omit<Movement, 'id'>) => {
  const newMovement = { ...movement, id: crypto.randomUUID() };
  setMovements(prev => [...prev, newMovement]);
};
*/

// DEPOIS (Supabase):
const addMovement = async (movement: Omit<Movement, 'id'>) => {
  if (!user) return;
  
  try {
    const { data, error } = await supabase
      .from('movements')
      .insert([{
        user_id: user.id, // Automaticamente isolado por usuário
        description: movement.description,
        amount: movement.amount,
        type: movement.type,
        category: movement.category,
        date: movement.date,
        payment_method: movement.paymentMethod,
        bank: movement.bank,
        notes: movement.notes || ''
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    // Adicionar ao estado local
    const newMovement = {
      id: data.id,
      description: data.description,
      amount: parseFloat(data.amount),
      type: data.type,
      category: data.category,
      date: data.date,
      paymentMethod: data.payment_method,
      bank: data.bank,
      notes: data.notes
    };
    
    setMovements(prev => [...prev, newMovement]);
  } catch (error) {
    console.error('Erro ao adicionar movimentação:', error);
    throw error;
  }
};

// ============================================
// EXEMPLO 3: Atualizar Movement
// ============================================

// ANTES (localStorage):
/*
const updateMovement = (id: string, updates: Partial<Movement>) => {
  setMovements(prev =>
    prev.map(movement =>
      movement.id === id ? { ...movement, ...updates } : movement
    )
  );
};
*/

// DEPOIS (Supabase):
const updateMovement = async (id: string, updates: Partial<Movement>) => {
  if (!user) return;
  
  try {
    const updateData: any = {};
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.amount !== undefined) updateData.amount = updates.amount;
    if (updates.type !== undefined) updateData.type = updates.type;
    if (updates.category !== undefined) updateData.category = updates.category;
    if (updates.date !== undefined) updateData.date = updates.date;
    if (updates.paymentMethod !== undefined) updateData.payment_method = updates.paymentMethod;
    if (updates.bank !== undefined) updateData.bank = updates.bank;
    if (updates.notes !== undefined) updateData.notes = updates.notes;
    
    const { error } = await supabase
      .from('movements')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id); // Segurança adicional
    
    if (error) throw error;
    
    // Atualizar estado local
    setMovements(prev =>
      prev.map(movement =>
        movement.id === id ? { ...movement, ...updates } : movement
      )
    );
  } catch (error) {
    console.error('Erro ao atualizar movimentação:', error);
    throw error;
  }
};

// ============================================
// EXEMPLO 4: Deletar Movement
// ============================================

// ANTES (localStorage):
/*
const deleteMovement = (id: string) => {
  setMovements(prev => prev.filter(m => m.id !== id));
};
*/

// DEPOIS (Supabase):
const deleteMovement = async (id: string) => {
  if (!user) return;
  
  try {
    const { error } = await supabase
      .from('movements')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id); // Segurança adicional
    
    if (error) throw error;
    
    // Remover do estado local
    setMovements(prev => prev.filter(m => m.id !== id));
  } catch (error) {
    console.error('Erro ao deletar movimentação:', error);
    throw error;
  }
};

// ============================================
// EXEMPLO 5: Transactions (Similar)
// ============================================

const loadTransactions = async () => {
  if (!user) return;
  
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('due_date', { ascending: false });
    
    if (error) throw error;
    
    const formatted = data.map(item => ({
      id: item.id,
      description: item.description,
      amount: parseFloat(item.amount),
      status: item.status,
      type: item.type,
      dueDate: item.due_date,
      completionDate: item.completion_date,
      category: item.category,
      exportType: item.export_type
    }));
    
    setTransactions(formatted);
  } catch (error) {
    console.error('Erro ao carregar transações:', error);
  }
};

// ============================================
// EXEMPLO 6: Debt Interests & Fines
// ============================================

const loadDebtInterests = async () => {
  if (!user) return;
  
  try {
    const { data, error } = await supabase
      .from('debt_interests')
      .select('*');
    
    if (error) throw error;
    
    const formatted = data.map(item => ({
      transactionId: item.transaction_id,
      dailyInterestRate: parseFloat(item.daily_interest_rate)
    }));
    
    setDebtInterests(formatted);
  } catch (error) {
    console.error('Erro ao carregar juros:', error);
  }
};

const loadDebtFines = async () => {
  if (!user) return;
  
  try {
    const { data, error } = await supabase
      .from('debt_fines')
      .select('*');
    
    if (error) throw error;
    
    const formatted = data.map(item => ({
      transactionId: item.transaction_id,
      finePercentage: parseFloat(item.fine_percentage)
    }));
    
    setDebtFines(formatted);
  } catch (error) {
    console.error('Erro ao carregar multas:', error);
  }
};

// ============================================
// EXEMPLO 7: Limpar Todos os Dados
// ============================================

const clearAllData = async () => {
  if (!user) return;
  if (!confirm('Tem certeza que deseja limpar TODOS os seus dados? Esta ação não pode ser desfeita!')) {
    return;
  }
  
  try {
    // Deletar em ordem (devido às foreign keys)
    await supabase.from('debt_interests').delete().eq('user_id', user.id);
    await supabase.from('debt_fines').delete().eq('user_id', user.id);
    await supabase.from('transactions').delete().eq('user_id', user.id);
    await supabase.from('movements').delete().eq('user_id', user.id);
    
    // Limpar estados locais
    setMovements([]);
    setTransactions([]);
    setDebtInterests([]);
    setDebtFines([]);
    
    alert('Todos os dados foram removidos com sucesso!');
  } catch (error) {
    console.error('Erro ao limpar dados:', error);
    alert('Erro ao limpar dados. Tente novamente.');
  }
};

// ============================================
// NOTAS IMPORTANTES
// ============================================

/*
1. ISOLAMENTO AUTOMÁTICO:
   - Todas as queries automaticamente filtram por user_id (RLS)
   - Não precisa se preocupar com segurança nas queries
   - Usuário 1 NUNCA verá dados do Usuário 2

2. PERFORMANCE:
   - Use .select() para buscar apenas campos necessários
   - Use .order() para ordenação no servidor
   - Use índices (já criados no schema SQL)

3. ERROS:
   - Sempre use try/catch
   - Mostre mensagens amigáveis ao usuário
   - Log erros para debug

4. REALTIME (OPCIONAL):
   - Supabase suporta realtime subscriptions
   - Útil para múltiplos dispositivos do mesmo usuário
   - Exemplo:
   
   supabase
     .channel('movements-changes')
     .on('postgres_changes', 
       { event: '*', schema: 'public', table: 'movements', filter: `user_id=eq.${user.id}` },
       (payload) => {
         console.log('Mudança detectada:', payload);
         loadMovements(); // Recarregar dados
       }
     )
     .subscribe();

5. BACKUP/EXPORT:
   - Os dados agora estão seguros no Supabase
   - Supabase faz backups automáticos
   - Você pode exportar via Dashboard do Supabase
   - Função de backup local ainda útil para arquivos offline

6. MIGRAÇÕES:
   - Se mudar o schema, use migrations no Supabase
   - Nunca delete tabelas em produção
   - Sempre teste alterações em ambiente de desenvolvimento

7. TESTES:
   - Crie múltiplos usuários de teste
   - Verifique isolamento de dados
   - Teste todas as operações CRUD
*/

export {
  loadMovements,
  addMovement,
  updateMovement,
  deleteMovement,
  loadTransactions,
  loadDebtInterests,
  loadDebtFines,
  clearAllData
};
