import React, { useState } from 'react';
import { useCaixa } from '../context/CaixaContextSupabase';
import type { Transaction } from '../types';
import { formatCurrency, formatDate } from '../utils/calculations';
import { Trash2, Edit2, Check, X } from 'lucide-react';
import { ConfirmDialog } from './ConfirmDialog';
import { useConfirm } from '../hooks/useConfirm';
import styles from './TransactionList.module.css';

interface EditingState {
  id: string | null;
  amount: string;
  category: string;
  description: string;
}

export const TransactionList: React.FC = () => {
  const { transactions, deleteTransaction, editTransaction } = useCaixa();
  const { confirm, confirmState, cancel } = useConfirm();
  const [editing, setEditing] = useState<EditingState>({ id: null, amount: '', category: '', description: '' });
  const [filter, setFilter] = useState<'all' | 'entrada' | 'saida'>('all');

  const handleDelete = async (id: string, description: string) => {
    const confirmed = await confirm({
      title: 'Confirmar Exclusão',
      message: `Tem certeza que deseja deletar a transação "${description}"? Esta ação não pode ser desfeita.`,
      confirmText: 'Deletar',
      cancelText: 'Cancelar',
      type: 'danger'
    });

    if (confirmed) {
      await deleteTransaction(id);
    }
  };

  const filteredTransactions = filter === 'all'
    ? transactions
    : transactions.filter(t => t.type === filter);

  const handleEdit = (transaction: Transaction) => {
    setEditing({
      id: transaction.id,
      amount: transaction.amount.toString(),
      category: transaction.category,
      description: transaction.description,
    });
  };

  const handleSaveEdit = () => {
    if (editing.id && editing.amount && editing.category && editing.description.trim()) {
      editTransaction(editing.id, parseFloat(editing.amount), editing.category, editing.description.trim());
      setEditing({ id: null, amount: '', category: '', description: '' });
    }
  };

  const handleCancelEdit = () => {
    setEditing({ id: null, amount: '', category: '', description: '' });
  };

  return (
    <div className={styles.container}>
      <h2>Histórico de Transações</h2>

      <div className={styles.filterButtons}>
        <button
          className={`${styles.filterBtn} ${filter === 'all' ? styles.active : ''}`}
          onClick={() => setFilter('all')}
        >
          Todas ({transactions.length})
        </button>
        <button
          className={`${styles.filterBtn} ${styles.entrada} ${filter === 'entrada' ? styles.active : ''}`}
          onClick={() => setFilter('entrada')}
        >
          Entradas ({transactions.filter(t => t.type === 'entrada').length})
        </button>
        <button
          className={`${styles.filterBtn} ${styles.saida} ${filter === 'saida' ? styles.active : ''}`}
          onClick={() => setFilter('saida')}
        >
          Saídas ({transactions.filter(t => t.type === 'saida').length})
        </button>
      </div>

      {filteredTransactions.length === 0 ? (
        <p className={styles.empty}>Nenhuma transação encontrada</p>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Data</th>
                <th>Tipo</th>
                <th>Categoria</th>
                <th>Descrição</th>
                <th>Valor</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map(transaction => (
                <tr key={transaction.id} className={`${styles.row} ${transaction.type === 'entrada' ? styles.entradaRow : styles.saidaRow}`}>
                  {editing.id === transaction.id ? (
                    <>
                      <td>{formatDate(transaction.date)}</td>
                      <td>{transaction.type === 'entrada' ? '💰' : '💸'}</td>
                      <td>
                        <input
                          type="text"
                          value={editing.category}
                          onChange={(e) => setEditing({ ...editing, category: e.target.value })}
                          className={styles.editInput}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={editing.description}
                          onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                          className={styles.editInput}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          step="0.01"
                          value={editing.amount}
                          onChange={(e) => setEditing({ ...editing, amount: e.target.value })}
                          className={styles.editInput}
                        />
                      </td>
                      <td className={styles.actions}>
                        <button onClick={handleSaveEdit} className={`${styles.actionBtn} ${styles.saveBtn}`} title="Salvar">
                          <Check size={18} />
                        </button>
                        <button onClick={handleCancelEdit} className={`${styles.actionBtn} ${styles.cancelBtn}`} title="Cancelar">
                          <X size={18} />
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td>{formatDate(transaction.date)}</td>
                      <td>{transaction.type === 'entrada' ? '💰' : '💸'}</td>
                      <td>{transaction.category}</td>
                      <td>{transaction.description}</td>
                      <td className={transaction.type === 'entrada' ? styles.positivo : styles.negativo}>
                        {transaction.type === 'entrada' ? '+' : '-'} {formatCurrency(transaction.amount)}
                      </td>
                      <td className={styles.actions}>
                        <button
                          onClick={() => handleEdit(transaction)}
                          className={`${styles.actionBtn} ${styles.editBtn}`}
                          title="Editar"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(transaction.id, transaction.description)}
                          className={`${styles.actionBtn} ${styles.deleteBtn}`}
                          title="Deletar"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      <ConfirmDialog
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        confirmText={confirmState.confirmText}
        cancelText={confirmState.cancelText}
        type={confirmState.type}
        onConfirm={confirmState.onConfirm}
        onCancel={cancel}
      />
    </div>
  );
};
