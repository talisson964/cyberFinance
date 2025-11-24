import React, { useMemo, useState } from 'react';
import { useCaixa } from '../context/CaixaContextSupabase';
import { formatCurrency, formatDate } from '../utils/calculations';
import styles from './DebtConfiguration.module.css';
import { Trash2, Edit2 } from 'lucide-react';

export const DebtConfiguration: React.FC = () => {
  const { getOverdueMovements, movements, addDebtInterest, removeDebtInterest, updateDebtInterest, getAllDebtInterests, calculateInterestAmount, addDebtFine, removeDebtFine, updateDebtFine, getAllDebtFines, calculateFineAmount } = useCaixa();
  const [selectedMovementId, setSelectedMovementId] = useState<string>('');
  const [interestRate, setInterestRate] = useState<number>(0);
  const [periodType, setPeriodType] = useState<'day' | 'month'>('month');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [debtTypeFilter, setDebtTypeFilter] = useState<'all' | 'receivable' | 'payable'>('all');
  
  // Estados para multas
  const [selectedFineMovementId, setSelectedFineMovementId] = useState<string>('');
  const [fineRate, setFineRate] = useState<number>(0);
  const [fineType, setFineType] = useState<'percentage' | 'fixed'>('percentage');
  const [editingFineId, setEditingFineId] = useState<string | null>(null);

  const overdueMovements = useMemo(() => getOverdueMovements(), [getOverdueMovements]);

  // Obter dívidas com juros configuradas
  const debtInterests = useMemo(() => getAllDebtInterests(), [getAllDebtInterests]);

  // Obter dívidas com multas configuradas
  const debtFines = useMemo(() => getAllDebtFines(), [getAllDebtFines]);

  // Filtrar movimentos atrasados por tipo
  const filteredOverdueMovements = useMemo(() => {
    if (debtTypeFilter === 'all') return overdueMovements;
    if (debtTypeFilter === 'receivable') return overdueMovements.filter(m => m.type === 'entrada');
    if (debtTypeFilter === 'payable') return overdueMovements.filter(m => m.type === 'saida');
    return overdueMovements;
  }, [overdueMovements, debtTypeFilter]);

  // Calcular juros para um movimento
  const calculateInterest = (movementId: string): number => {
    return calculateInterestAmount(movementId);
  };

  // Adicionar/editar juros
  const handleSaveInterest = () => {
    if (!selectedMovementId || interestRate < 0) return;

    if (editingId) {
      updateDebtInterest(selectedMovementId, interestRate, periodType);
      setEditingId(null);
    } else {
      addDebtInterest(selectedMovementId, interestRate, periodType);
    }

    setSelectedMovementId('');
    setInterestRate(0);
    setPeriodType('month');
  };

  // Editar juros
  const handleEditInterest = (debt: ReturnType<typeof getAllDebtInterests>[0]) => {
    setSelectedMovementId(debt.movementId);
    setInterestRate(debt.interestRate);
    setPeriodType(debt.periodType);
    setEditingId(debt.movementId);
  };

  // Remover juros
  const handleDeleteInterest = (movementId: string) => {
    removeDebtInterest(movementId);
  };

  // Adicionar/editar multa
  const handleSaveFine = () => {
    if (!selectedFineMovementId || fineRate < 0) return;

    if (editingFineId) {
      updateDebtFine(selectedFineMovementId, fineRate, fineType);
      setEditingFineId(null);
    } else {
      addDebtFine(selectedFineMovementId, fineRate, fineType);
    }

    setSelectedFineMovementId('');
    setFineRate(0);
    setFineType('percentage');
  };

  // Editar multa
  const handleEditFine = (fine: ReturnType<typeof getAllDebtFines>[0]) => {
    setSelectedFineMovementId(fine.movementId);
    setFineRate(fine.fineRate);
    setFineType(fine.fineType);
    setEditingFineId(fine.movementId);
  };

  // Remover multa
  const handleDeleteFine = (movementId: string) => {
    removeDebtFine(movementId);
  };

  // Obter movimento por ID
  const getMovementById = (id: string) => movements.find(m => m.id === id);

  return (
    <div className={styles.container}>
      <h1>💳 Configuração de Dívidas com Juros</h1>

      <div className={styles.configSection}>
        <div className={styles.configCard}>
          <h2>➕ Adicionar/Editar Juros</h2>

          {/* Filtro de tipo de dívida */}
          <div className={styles.filterGroup}>
            <label>Tipo de Dívida:</label>
            <div className={styles.filterButtons}>
              <button
                className={`${styles.filterBtn} ${debtTypeFilter === 'all' ? styles.active : ''}`}
                onClick={() => setDebtTypeFilter('all')}
              >
                📊 Todas ({overdueMovements.length})
              </button>
              <button
                className={`${styles.filterBtn} ${debtTypeFilter === 'receivable' ? styles.active : ''}`}
                onClick={() => setDebtTypeFilter('receivable')}
              >
                📥 A Receber ({overdueMovements.filter(m => m.type === 'entrada').length})
              </button>
              <button
                className={`${styles.filterBtn} ${debtTypeFilter === 'payable' ? styles.active : ''}`}
                onClick={() => setDebtTypeFilter('payable')}
              >
                📤 A Pagar ({overdueMovements.filter(m => m.type === 'saida').length})
              </button>
            </div>
          </div>
          
          <div className={styles.formGroup}>
            <label>Selecione a Dívida (Atrasada):</label>
            <select 
              value={selectedMovementId} 
              onChange={(e) => setSelectedMovementId(e.target.value)}
              className={styles.select}
            >
              <option value="">-- Selecione uma dívida --</option>
              {filteredOverdueMovements.map(m => (
                <option key={m.id} value={m.id}>
                  {m.type === 'entrada' ? '📥' : '📤'} {m.description} - {formatDate(m.date)} - {formatCurrency(m.amount)}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>Taxa de Juros (%):</label>
            <input 
              type="number" 
              min="0" 
              step="0.1"
              value={interestRate}
              onChange={(e) => setInterestRate(parseFloat(e.target.value) || 0)}
              className={styles.input}
              placeholder="Ex: 2.5"
            />
          </div>

          <div className={styles.formGroup}>
            <label>Período:</label>
            <div className={styles.periodButtons}>
              <button
                className={`${styles.periodBtn} ${periodType === 'day' ? styles.active : ''}`}
                onClick={() => setPeriodType('day')}
              >
                📅 Por Dia
              </button>
              <button
                className={`${styles.periodBtn} ${periodType === 'month' ? styles.active : ''}`}
                onClick={() => setPeriodType('month')}
              >
                📆 Por Mês
              </button>
            </div>
          </div>

          <button 
            className={styles.saveBtn}
            onClick={handleSaveInterest}
            disabled={!selectedMovementId || interestRate < 0}
          >
            {editingId ? '✏️ Atualizar' : '✅ Adicionar'}
          </button>

          {editingId && (
            <button 
              className={styles.cancelBtn}
              onClick={() => {
                setEditingId(null);
                setSelectedMovementId('');
                setInterestRate(0);
                setPeriodType('month');
              }}
            >
              ❌ Cancelar
            </button>
          )}
        </div>
      </div>

      <div className={styles.listSection}>
        <h2>📋 Dívidas com Juros Configurados</h2>

        {/* Filtro de exibição de dívidas */}
        {debtInterests.length > 0 && (
          <div className={styles.listFilterGroup}>
            <label>Filtrar por Tipo:</label>
            <div className={styles.listFilterButtons}>
              <button
                className={`${styles.listFilterBtn} ${debtTypeFilter === 'all' ? styles.active : ''}`}
                onClick={() => setDebtTypeFilter('all')}
              >
                📊 Todas
              </button>
              <button
                className={`${styles.listFilterBtn} ${debtTypeFilter === 'receivable' ? styles.active : ''}`}
                onClick={() => setDebtTypeFilter('receivable')}
              >
                📥 A Receber
              </button>
              <button
                className={`${styles.listFilterBtn} ${debtTypeFilter === 'payable' ? styles.active : ''}`}
                onClick={() => setDebtTypeFilter('payable')}
              >
                📤 A Pagar
              </button>
            </div>
          </div>
        )}

        {debtInterests.length === 0 ? (
          <p className={styles.empty}>Nenhuma dívida com juros configurada</p>
        ) : (
          <div className={styles.debtsList}>
            {debtInterests.map((debt: ReturnType<typeof getAllDebtInterests>[number]) => {
              const movement = getMovementById(debt.movementId);
              
              // Filtrar se necessário
              if (debtTypeFilter !== 'all') {
                if (debtTypeFilter === 'receivable' && movement?.type !== 'entrada') return null;
                if (debtTypeFilter === 'payable' && movement?.type !== 'saida') return null;
              }

              const calculatedInterest = calculateInterest(debt.movementId);
              const totalAmount = (movement?.amount || 0) + calculatedInterest;

              return (
                <div key={debt.movementId} className={styles.debtCard}>
                  <div className={styles.debtHeader}>
                    <div className={styles.debtInfo}>
                      <h3>
                        {movement?.type === 'entrada' ? '📥' : '📤'} {movement?.description}
                      </h3>
                      <p className={styles.debtDate}>📅 {formatDate(movement?.date || '')}</p>
                    </div>
                    <div className={styles.debtActions}>
                      <button 
                        className={styles.editBtn}
                        onClick={() => handleEditInterest(debt)}
                        title="Editar"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        className={styles.deleteBtn}
                        onClick={() => handleDeleteInterest(debt.movementId)}
                        title="Remover"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  <div className={styles.debtDetails}>
                    <div className={styles.detailItem}>
                      <span className={styles.label}>Valor Original:</span>
                      <span className={styles.value}>{formatCurrency(movement?.amount || 0)}</span>
                    </div>

                    <div className={styles.detailItem}>
                      <span className={styles.label}>Taxa de Juros:</span>
                      <span className={styles.value}>
                        {debt.interestRate}% por {debt.periodType === 'day' ? 'dia' : 'mês'}
                      </span>
                    </div>

                    <div className={styles.detailItem}>
                      <span className={styles.label}>Juros Acumulados:</span>
                      <span className={styles.interestValue}>{formatCurrency(calculatedInterest)}</span>
                    </div>

                    <div className={styles.detailItem}>
                      <span className={styles.label}>Total a Pagar:</span>
                      <span className={styles.totalValue}>{formatCurrency(totalAmount)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className={styles.configSection}>
        <div className={styles.configCard}>
          <h2>⚠️ Adicionar/Editar Multas</h2>

          {/* Filtro de tipo de dívida */}
          <div className={styles.filterGroup}>
            <label>Tipo de Dívida:</label>
            <div className={styles.filterButtons}>
              <button
                className={`${styles.filterBtn} ${debtTypeFilter === 'all' ? styles.active : ''}`}
                onClick={() => setDebtTypeFilter('all')}
              >
                📊 Todas ({overdueMovements.length})
              </button>
              <button
                className={`${styles.filterBtn} ${debtTypeFilter === 'receivable' ? styles.active : ''}`}
                onClick={() => setDebtTypeFilter('receivable')}
              >
                📥 A Receber ({overdueMovements.filter(m => m.type === 'entrada').length})
              </button>
              <button
                className={`${styles.filterBtn} ${debtTypeFilter === 'payable' ? styles.active : ''}`}
                onClick={() => setDebtTypeFilter('payable')}
              >
                📤 A Pagar ({overdueMovements.filter(m => m.type === 'saida').length})
              </button>
            </div>
          </div>
          
          <div className={styles.formGroup}>
            <label>Selecione a Dívida (Atrasada):</label>
            <select 
              value={selectedFineMovementId} 
              onChange={(e) => setSelectedFineMovementId(e.target.value)}
              className={styles.select}
            >
              <option value="">-- Selecione uma dívida --</option>
              {filteredOverdueMovements.map(m => (
                <option key={m.id} value={m.id}>
                  {m.type === 'entrada' ? '📥' : '📤'} {m.description} - {formatDate(m.date)} - {formatCurrency(m.amount)}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>Valor da Multa:</label>
            <input 
              type="number" 
              min="0" 
              step={fineType === 'percentage' ? '0.1' : '0.01'}
              value={fineRate}
              onChange={(e) => setFineRate(parseFloat(e.target.value) || 0)}
              className={styles.input}
              placeholder={fineType === 'percentage' ? 'Ex: 10 para 10%' : 'Ex: 50.00'}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Tipo de Multa:</label>
            <div className={styles.periodButtons}>
              <button
                className={`${styles.periodBtn} ${fineType === 'percentage' ? styles.active : ''}`}
                onClick={() => setFineType('percentage')}
              >
                📊 Percentual (%)
              </button>
              <button
                className={`${styles.periodBtn} ${fineType === 'fixed' ? styles.active : ''}`}
                onClick={() => setFineType('fixed')}
              >
                💰 Fixo (R$)
              </button>
            </div>
          </div>

          <button 
            className={styles.saveBtn}
            onClick={handleSaveFine}
            disabled={!selectedFineMovementId || fineRate < 0}
          >
            {editingFineId ? '✏️ Atualizar' : '✅ Adicionar'}
          </button>

          {editingFineId && (
            <button 
              className={styles.cancelBtn}
              onClick={() => {
                setEditingFineId(null);
                setSelectedFineMovementId('');
                setFineRate(0);
                setFineType('percentage');
              }}
            >
              ❌ Cancelar
            </button>
          )}
        </div>
      </div>

      <div className={styles.listSection}>
        <h2>📋 Dívidas com Multas Configuradas</h2>

        {/* Filtro de exibição de dívidas */}
        {debtFines.length > 0 && (
          <div className={styles.listFilterGroup}>
            <label>Filtrar por Tipo:</label>
            <div className={styles.listFilterButtons}>
              <button
                className={`${styles.listFilterBtn} ${debtTypeFilter === 'all' ? styles.active : ''}`}
                onClick={() => setDebtTypeFilter('all')}
              >
                📊 Todas
              </button>
              <button
                className={`${styles.listFilterBtn} ${debtTypeFilter === 'receivable' ? styles.active : ''}`}
                onClick={() => setDebtTypeFilter('receivable')}
              >
                📥 A Receber
              </button>
              <button
                className={`${styles.listFilterBtn} ${debtTypeFilter === 'payable' ? styles.active : ''}`}
                onClick={() => setDebtTypeFilter('payable')}
              >
                📤 A Pagar
              </button>
            </div>
          </div>
        )}

        {debtFines.length === 0 ? (
          <p className={styles.empty}>Nenhuma dívida com multa configurada</p>
        ) : (
          <div className={styles.debtsList}>
            {debtFines.map((fine: ReturnType<typeof getAllDebtFines>[number]) => {
              const movement = getMovementById(fine.movementId);
              
              // Filtrar se necessário
              if (debtTypeFilter !== 'all') {
                if (debtTypeFilter === 'receivable' && movement?.type !== 'entrada') return null;
                if (debtTypeFilter === 'payable' && movement?.type !== 'saida') return null;
              }

              const calculatedFine = calculateFineAmount(fine.movementId);
              const totalAmount = (movement?.amount || 0) + calculatedFine;

              return (
                <div key={fine.movementId} className={styles.debtCard}>
                  <div className={styles.debtHeader}>
                    <div className={styles.debtInfo}>
                      <h3>
                        {movement?.type === 'entrada' ? '📥' : '📤'} {movement?.description}
                      </h3>
                      <p className={styles.debtDate}>📅 {formatDate(movement?.date || '')}</p>
                    </div>
                    <div className={styles.debtActions}>
                      <button 
                        className={styles.editBtn}
                        onClick={() => handleEditFine(fine)}
                        title="Editar"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        className={styles.deleteBtn}
                        onClick={() => handleDeleteFine(fine.movementId)}
                        title="Remover"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  <div className={styles.debtDetails}>
                    <div className={styles.detailItem}>
                      <span className={styles.label}>Valor Original:</span>
                      <span className={styles.value}>{formatCurrency(movement?.amount || 0)}</span>
                    </div>

                    <div className={styles.detailItem}>
                      <span className={styles.label}>Multa:</span>
                      <span className={styles.value}>
                        {fineType === 'percentage' ? `${fine.fineRate}%` : `${formatCurrency(fine.fineRate)}`}
                      </span>
                    </div>

                    <div className={styles.detailItem}>
                      <span className={styles.label}>Multa Aplicada:</span>
                      <span className={styles.interestValue}>{formatCurrency(calculatedFine)}</span>
                    </div>

                    <div className={styles.detailItem}>
                      <span className={styles.label}>Total a Pagar:</span>
                      <span className={styles.totalValue}>{formatCurrency(totalAmount)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className={styles.infoBox}>
        <h3>ℹ️ Como Funciona?</h3>
        <ul>
          <li><strong>Juros:</strong> Selecione uma dívida, defina a taxa e período (dia/mês). Os juros acumulam automaticamente.</li>
          <li><strong>Multas:</strong> Selecione uma dívida, defina o valor em percentual ou valor fixo. A multa é adicionada imediatamente.</li>
          <li><strong>Exemplo de Juros:</strong> 2% ao mês = 2% × quantidade de meses × valor da dívida</li>
          <li><strong>Exemplo de Multas:</strong> 5% = 5% × valor da dívida (percentual) ou um valor fixo definido</li>
        </ul>
      </div>
    </div>
  );
};
