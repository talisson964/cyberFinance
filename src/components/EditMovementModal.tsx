import React, { useState, useEffect } from 'react';
import { useCaixa } from '../context/CaixaContextSupabase';
import { X } from 'lucide-react';
import { showNotification } from './CustomNotification';
import { capitalizeText, capitalizeMultiline } from '../utils/textFormat';
import styles from './EditMovementModal.module.css';
import type { Movement, MovementType } from '../types';

interface EditMovementModalProps {
  movement: Movement | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const EXPENSE_CATEGORIES: Record<MovementType, string[]> = {
  pix: ['Alimentação', 'Combustível', 'Transporte', 'Medicamentos', 'Serviços', 'Outros'],
  cartao_credito: ['Compras', 'Serviços', 'Subscriptions', 'Outros'],
  parcelado: ['Compras', 'Serviços', 'Eletrônicos', 'Outros'],
  dinheiro: ['Alimentação', 'Combustível', 'Pequenas Despesas', 'Outros'],
  transferencia: ['Transferências', 'Empréstimos', 'Outros'],
  debito: ['Compras', 'Retiradas', 'Pagamentos', 'Outros'],
  boleto: ['Aluguel', 'Contas', 'Financiamento', 'Seguros', 'Outros'],
};

export const EditMovementModal: React.FC<EditMovementModalProps> = ({
  movement,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { editMovement } = useCaixa();
  const [movementType, setMovementType] = useState<MovementType>('pix');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [classification, setClassification] = useState<'fixo' | 'ocasional' | 'nenhum'>('nenhum');
  const [notes, setNotes] = useState('');
  const [movementDate, setMovementDate] = useState('');

  useEffect(() => {
    if (movement && isOpen) {
      setMovementType(movement.movementType);
      setAmount(movement.amount.toString());
      setCategory(movement.category);
      setDescription(movement.description);
      setClassification(movement.classification);
      setNotes(movement.notes || '');
      setMovementDate(movement.date);
    }
  }, [movement, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!movement) return;

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      await showNotification('error', 'Por favor, insira um valor válido');
      return;
    }

    if (!description.trim()) {
      await showNotification('error', 'Por favor, insira uma descrição');
      return;
    }

    try {
      await editMovement(
        movement.id,
        movementType,
        numAmount,
        category,
        description.trim(),
        classification,
        movementDate,
        notes || undefined
      );

      setAmount('');
      setCategory('');
      setDescription('');
      setClassification('nenhum');
      setNotes('');
      setMovementDate(new Date().toISOString().split('T')[0]);

      onSuccess();
    } catch (error) {
      console.error('Erro ao editar movimentação:', error);
      await showNotification('error', 'Erro ao editar movimentação');
    }
  };

  const getCategories = (): string[] => {
    return EXPENSE_CATEGORIES[movementType] || [];
  };

  if (!isOpen || !movement) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Editar Movimentação</h2>
          <button
            className={styles.closeBtn}
            onClick={onClose}
            type="button"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Tipo de Pagamento */}
          <div className={styles.formGroup}>
            <label htmlFor="movementType">Tipo de Pagamento</label>
            <select
              id="movementType"
              value={movementType}
              onChange={(e) => {
                setMovementType(e.target.value as MovementType);
                setCategory('');
            }}
          >
            <option value="pix">PIX</option>
            <option value="cartao_credito">Cartão de Crédito</option>
            <option value="parcelado">Crédito Parcelado</option>
            <option value="dinheiro">Dinheiro</option>
            <option value="transferencia">Transferência</option>
            <option value="debito">Débito</option>
            <option value="boleto">Boleto</option>
          </select>
        </div>          {/* Valor */}
          <div className={styles.formGroup}>
            <label htmlFor="amount">Valor *</label>
            <input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
            />
          </div>

          {/* Data */}
          <div className={styles.formGroup}>
            <label htmlFor="movementDate">Data</label>
            <input
              id="movementDate"
              type="date"
              value={movementDate}
              onChange={(e) => setMovementDate(e.target.value)}
            />
          </div>

          {/* Categoria */}
          <div className={styles.formGroup}>
            <label htmlFor="category">Categoria</label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">Selecione uma categoria</option>
              {getCategories().map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Descrição */}
          <div className={styles.formGroup}>
            <label htmlFor="description">Descrição *</label>
            <input
              id="description"
              type="text"
              value={description}
              onChange={(e) => setDescription(capitalizeText(e.target.value))}
              onBlur={(e) => setDescription(capitalizeText(e.target.value))}
              placeholder="Ex: Almoço, Gasolina, Pagamento de aluguel..."
            />
          </div>

          {/* Classificação */}
          <div className={styles.formGroup}>
            <label htmlFor="classification">Classificação</label>
            <select
              id="classification"
              value={classification}
              onChange={(e) => setClassification(e.target.value as any)}
            >
              <option value="nenhum">Nenhum</option>
              <option value="fixo">Gasto Fixo</option>
              <option value="temporario">Gasto Temporário</option>
            </select>
          </div>

          {/* Notas */}
          <div className={styles.formGroup}>
            <label htmlFor="notes">Notas</label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={(e) => setNotes(capitalizeMultiline(e.target.value))}
              placeholder="Adicionar notas..."
              rows={3}
            />
          </div>

          {/* Botões */}
          <div className={styles.buttonGroup}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={onClose}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={styles.submitBtn}
            >
              Salvar Alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
