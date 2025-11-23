import React, { useState } from 'react';
import { useCaixa } from '../context/CaixaContext';
import { showNotification } from './CustomNotification';
import { capitalizeText } from '../utils/textFormat';
import styles from './TransactionForm.module.css';

const ENTRADA_CATEGORIES = ['Venda', 'Serviço', 'Devolução', 'Outro'];
const SAIDA_CATEGORIES = ['Compra', 'Fornecedor', 'Aluguel', 'Salário', 'Transporte', 'Outro'];

export const TransactionForm: React.FC = () => {
  const { addTransaction } = useCaixa();
  const [type, setType] = useState<'entrada' | 'saida'>('entrada');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');

  const categories = type === 'entrada' ? ENTRADA_CATEGORIES : SAIDA_CATEGORIES;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !category || !description.trim()) {
      await showNotification('error', 'Preencha todos os campos');
      return;
    }

    const numAmount = parseFloat(amount);
    if (numAmount <= 0) {
      await showNotification('error', 'O valor deve ser maior que zero');
      return;
    }

    addTransaction(type, numAmount, category, description.trim());
    setAmount('');
    setCategory('');
    setDescription('');
    await showNotification('success', 'Transação registrada com sucesso!');
  };

  return (
    <div className={styles.container}>
      <h2>Nova Transação</h2>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.typeSelector}>
          <button
            type="button"
            className={`${styles.typeBtn} ${type === 'entrada' ? styles.active : ''}`}
            onClick={() => {
              setType('entrada');
              setCategory('');
            }}
          >
            💰 Entrada
          </button>
          <button
            type="button"
            className={`${styles.typeBtn} ${type === 'saida' ? styles.active : ''}`}
            onClick={() => {
              setType('saida');
              setCategory('');
            }}
          >
            💸 Saída
          </button>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="amount">Valor (R$)</label>
          <input
            id="amount"
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="category">Categoria</label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
          >
            <option value="">Selecione uma categoria</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="description">Descrição</label>
          <input
            id="description"
            type="text"
            value={description}
            onChange={(e) => setDescription(capitalizeText(e.target.value))}
            onBlur={(e) => setDescription(capitalizeText(e.target.value))}
            placeholder="Descreva a transação"
            required
          />
        </div>

        <button type="submit" className={styles.submitBtn}>
          Registrar Transação
        </button>
      </form>
    </div>
  );
};
