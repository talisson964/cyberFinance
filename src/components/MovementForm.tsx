import React, { useState, useEffect } from 'react';
import { useCaixa } from '../context/CaixaContext';
import type { TransactionType, MovementType, ExpenseClassification, Priority, EntradaSubcategory, SaidaSubcategory, PurchaseItem } from '../types';
import { showNotification } from './CustomNotification';
import { PurchaseItemsManager } from './PurchaseItemsManager';
import { capitalizeText, capitalizeMultiline } from '../utils/textFormat';
import styles from './MovementForm.module.css';

const ENTRADA_SUBCATEGORIES: { value: EntradaSubcategory; label: string }[] = [
  { value: 'vendas_balcao', label: '🏪 Vendas Balcão' },
  { value: 'vendas_online', label: '💻 Vendas Online' },
  { value: 'vendas_a_prazo', label: '📅 Vendas a Prazo' },
  { value: 'servicos_prestados', label: '🔧 Serviços Prestados' },
  { value: 'renda_fixa', label: '📊 Renda Fixa' },
  { value: 'devolucoes', label: '↩️ Devoluções' },
  { value: 'juros_recebidos', label: '💰 Juros Recebidos' },
  { value: 'reembolsos', label: '💵 Reembolsos' },
  { value: 'outra_entrada', label: '❓ Outra Entrada' },
];

const SAIDA_SUBCATEGORIES: { value: SaidaSubcategory; label: string }[] = [
  { value: 'fornecedores', label: '🏭 Fornecedores' },
  { value: 'aluguel', label: '🏢 Aluguel' },
  { value: 'salarios', label: '👥 Salários' },
  { value: 'transportes', label: '🚚 Transportes' },
  { value: 'utilidades', label: '💡 Utilidades (Água, Luz, Internet)' },
  { value: 'marketing', label: '📢 Marketing' },
  { value: 'impostos', label: '📋 Impostos' },
  { value: 'manutencao', label: '🔨 Manutenção' },
  { value: 'escritorio', label: '📑 Material de Escritório' },
  { value: 'materiais', label: '📦 Materiais' },
  { value: 'consultorias', label: '📞 Consultorias' },
  { value: 'outra_saida', label: '❓ Outra Saída' },
];

const MOVEMENT_TYPES: { value: MovementType; label: string }[] = [
  { value: 'pix', label: '📱 Pix' },
  { value: 'credito_avista', label: '💳 Crédito à Vista' },
  { value: 'cartao_credito', label: '💳 Cartão de Crédito' },
  { value: 'parcelado', label: '📅 Parcelado' },
  { value: 'dinheiro', label: '💵 Dinheiro' },
  { value: 'transferencia', label: '🏦 Transferência' },
  { value: 'debito', label: '🏧 Débito' },
  { value: 'boleto', label: '📄 Boleto' },
];

const BANCOS_CARTAO = [
  'Banco do Brasil',
  'Bradesco',
  'Itaú',
  'Santander',
  'Caixa Econômica',
  'Nubank',
  'Inter',
  'C6 Bank',
  'BTG Pactual',
  'Banco Pan',
  'Porto Seguro',
  'Outro',
];

export const MovementForm: React.FC = () => {
  const { addMovement } = useCaixa();
  const [type, setType] = useState<TransactionType>('saida');
  const [movementType, setMovementType] = useState<MovementType>('pix');
  const [classification, setClassification] = useState<ExpenseClassification>('temporario');
  const [priority, setPriority] = useState<Priority>('média');
  const [amount, setAmount] = useState('');
  const [subcategory, setSubcategory] = useState<EntradaSubcategory | SaidaSubcategory>('outra_saida');
  const [description, setDescription] = useState('');
  const [movementDate, setMovementDate] = useState(new Date().toISOString().split('T')[0]);
  const [isParcelado, setIsParcelado] = useState(false);
  const [totalInstallments, setTotalInstallments] = useState('1');
  const [firstInstallmentDate, setFirstInstallmentDate] = useState('');
  const [notes, setNotes] = useState('');
  const [fixedExpenseDuration, setFixedExpenseDuration] = useState('');
  const [cardBank, setCardBank] = useState('');
  const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([]);

  const subcategories = type === 'entrada' ? ENTRADA_SUBCATEGORIES : SAIDA_SUBCATEGORIES;

  // Atualizar valor total quando itens de compra mudarem
  useEffect(() => {
    if (type === 'saida' && subcategory === 'fornecedores' && purchaseItems.length > 0) {
      const total = purchaseItems.reduce((sum, item) => sum + item.total, 0);
      setAmount(total.toFixed(2));
    }
  }, [purchaseItems, type, subcategory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || !subcategory || !description.trim() || !movementType) {
      await showNotification('error', 'Preencha todos os campos obrigatórios');
      return;
    }

    const numAmount = parseFloat(amount);
    if (numAmount <= 0) {
      await showNotification('error', 'O valor deve ser maior que zero');
      return;
    }

    if (isParcelado && (!firstInstallmentDate || !totalInstallments || parseInt(totalInstallments) <= 0)) {
      await showNotification('error', 'Para parcelamento, preencha a data da primeira parcela e total de parcelas');
      return;
    }

    if (type === 'saida' && movementType === 'cartao_credito' && !cardBank) {
      await showNotification('error', 'Por favor, selecione o banco do cartão de crédito');
      return;
    }

    // Mapear subcategoria para label de categoria
    const subcategoryObj = subcategories.find(s => s.value === subcategory);
    const categoryLabel = subcategoryObj?.label || subcategory;

    // Adicionar banco do cartão nas notas se for cartão de crédito
    let finalNotes = notes || '';
    if (type === 'saida' && movementType === 'cartao_credito' && cardBank) {
      finalNotes = finalNotes ? `${finalNotes}\n\nBanco: ${cardBank}` : `Banco: ${cardBank}`;
    }

    const result = addMovement(
      type,
      movementType,
      numAmount,
      categoryLabel,
      description.trim(),
      classification,
      movementDate,
      priority,
      isParcelado ? parseInt(totalInstallments) : undefined,
      isParcelado ? firstInstallmentDate : undefined,
      finalNotes || undefined,
      fixedExpenseDuration ? parseInt(fixedExpenseDuration) : undefined,
      type === 'saida' && subcategory === 'fornecedores' && purchaseItems.length > 0 ? purchaseItems : undefined
    );

    // Limpar formulário
    setAmount('');
    setSubcategory('outra_saida');
    setDescription('');
    setMovementType('pix');
    setIsParcelado(false);
    setTotalInstallments('1');
    setFirstInstallmentDate('');
    setNotes('');
    setFixedExpenseDuration('');
    setCardBank('');
    setPurchaseItems([]);
    setMovementDate(new Date().toISOString().split('T')[0]);
    
    // Mostrar notificação apropriada
    if (result.merged) {
      await showNotification(
        'success', 
        `Item adicionado à compra existente! Total: ${result.itemCount} itens agrupados`
      );
    } else {
      await showNotification('success', 'Movimentação registrada com sucesso!');
    }
  };

  return (
    <div className={styles.container}>
      <h2>Nova Movimentação</h2>
      <form onSubmit={handleSubmit} className={styles.form}>
        {/* Tipo de Transação */}
        <div className={styles.typeSelector}>
          <button
            type="button"
            className={`${styles.typeBtn} ${type === 'entrada' ? styles.active : ''}`}
            onClick={() => {
              setType('entrada');
              setSubcategory('vendas_balcao');
              setClassification('nenhum');
            }}
          >
            💰 Entrada
          </button>
          <button
            type="button"
            className={`${styles.typeBtn} ${type === 'saida' ? styles.active : ''}`}
            onClick={() => {
              setType('saida');
              setSubcategory('fornecedores');
              setClassification('temporario');
            }}
          >
            💸 Saída
          </button>
        </div>

        {/* Tipo de Movimentação */}
        <div className={styles.formGroup}>
          <label htmlFor="movementType">Tipo de Movimentação</label>
          <select
            id="movementType"
            value={movementType}
            onChange={(e) => setMovementType(e.target.value as MovementType)}
            required
          >
            {MOVEMENT_TYPES.map(mt => (
              <option key={mt.value} value={mt.value}>{mt.label}</option>
            ))}
          </select>
        </div>

        {/* Classificação (apenas para saída) */}
        {type === 'saida' && (
          <div className={styles.formGroup}>
            <label htmlFor="classification">Classificação</label>
            <select
              id="classification"
              value={classification}
              onChange={(e) => setClassification(e.target.value as ExpenseClassification)}
            >
              <option value="fixo">🔄 Gasto Fixo (recorrente)</option>
              <option value="temporario">⏱️ Gasto Temporário</option>
              <option value="nenhum">Nenhum</option>
            </select>
          </div>
        )}

        {/* Duração do Gasto Fixo (apenas se for fixo) */}
        {type === 'saida' && classification === 'fixo' && (
          <div className={styles.formGroup}>
            <label htmlFor="fixedExpenseDuration">Duração (meses) - Deixe vazio para indeterminado</label>
            <input
              id="fixedExpenseDuration"
              type="number"
              min="1"
              value={fixedExpenseDuration}
              onChange={(e) => setFixedExpenseDuration(e.target.value)}
              placeholder="Ex: 12, 24..."
            />
          </div>
        )}

        {/* Prioridade (apenas para saída) */}
        {type === 'saida' && (
          <div className={styles.formGroup}>
            <label htmlFor="priority">Prioridade</label>
            <select
              id="priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
            >
              <option value="alta">🔴 Alta</option>
              <option value="média">🟡 Média</option>
              <option value="baixa">🟢 Baixa</option>
            </select>
          </div>
        )}

        {/* Valor */}
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
            disabled={type === 'saida' && subcategory === 'fornecedores' && purchaseItems.length > 0}
          />
          {type === 'saida' && subcategory === 'fornecedores' && purchaseItems.length > 0 && (
            <small style={{ color: 'var(--text-secondary)', marginTop: '4px', display: 'block' }}>
              Valor calculado automaticamente pela soma dos itens
            </small>
          )}
        </div>

        {/* Categoria */}
        <div className={styles.formGroup}>
          <label htmlFor="category">Categoria</label>
          <select
            id="category"
            value={subcategory}
            onChange={(e) => setSubcategory(e.target.value as EntradaSubcategory | SaidaSubcategory)}
            required
          >
            <option value="">Selecione uma categoria</option>
            {subcategories.map(sub => (
              <option key={sub.value} value={sub.value}>{sub.label}</option>
            ))}
          </select>
          {type === 'saida' && subcategory === 'fornecedores' && (
            <small style={{ 
              color: '#2563eb', 
              marginTop: '8px', 
              display: 'block',
              fontSize: '13px',
              lineHeight: '1.4',
              padding: '8px 12px',
              background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
              borderRadius: '8px',
              border: '1px solid #93c5fd'
            }}>
              💡 <strong>Agrupamento Automático:</strong> Cadastros com mesma data, forma de pagamento, banco e parcelas serão agrupados automaticamente como uma única compra.
            </small>
          )}
        </div>

        {/* Data */}
        <div className={styles.formGroup}>
          <label htmlFor="movementDate">Data da Movimentação</label>
          <input
            id="movementDate"
            type="date"
            value={movementDate}
            onChange={(e) => setMovementDate(e.target.value)}
            required
          />
        </div>

        {/* Descrição */}
        <div className={styles.formGroup}>
          <label htmlFor="description">Descrição</label>
          <input
            id="description"
            type="text"
            value={description}
            onChange={(e) => setDescription(capitalizeText(e.target.value))}
            onBlur={(e) => setDescription(capitalizeText(e.target.value))}
            placeholder="Descreva a movimentação"
            required
          />
        </div>

        {/* Anotações */}
        <div className={styles.formGroup}>
          <label htmlFor="notes">Anotações (opcional)</label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={(e) => setNotes(capitalizeMultiline(e.target.value))}
            placeholder="Informações adicionais..."
            rows={2}
          />
        </div>

        {/* Banco do Cartão (apenas para saída com cartão de crédito) */}
        {type === 'saida' && movementType === 'cartao_credito' && (
          <div className={styles.formGroup}>
            <label htmlFor="cardBank">Banco do Cartão *</label>
            <select
              id="cardBank"
              value={cardBank}
              onChange={(e) => setCardBank(e.target.value)}
              required
            >
              <option value="">Selecione o banco</option>
              {BANCOS_CARTAO.map(banco => (
                <option key={banco} value={banco}>{banco}</option>
              ))}
            </select>
          </div>
        )}

        {/* Gerenciador de Itens de Compra (apenas para saída categoria fornecedores) */}
        {type === 'saida' && subcategory === 'fornecedores' && (
          <PurchaseItemsManager
            items={purchaseItems}
            onItemsChange={setPurchaseItems}
          />
        )}

        {/* Parcelamento */}
        {movementType === 'parcelado' && (
          <div className={styles.installmentSection}>
            <div className={styles.checkboxGroup}>
              <input
                id="isParcelado"
                type="checkbox"
                checked={isParcelado}
                onChange={(e) => setIsParcelado(e.target.checked)}
              />
              <label htmlFor="isParcelado">📅 Registrar como parcelado</label>
            </div>

            {isParcelado && (
              <div className={styles.installmentFields}>
                <div className={styles.formGroup}>
                  <label htmlFor="totalInstallments">Total de Parcelas</label>
                  <input
                    id="totalInstallments"
                    type="number"
                    min="2"
                    max="48"
                    value={totalInstallments}
                    onChange={(e) => setTotalInstallments(e.target.value)}
                    placeholder="Ex: 12"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="firstInstallmentDate">Data da Primeira Parcela</label>
                  <input
                    id="firstInstallmentDate"
                    type="date"
                    value={firstInstallmentDate}
                    onChange={(e) => setFirstInstallmentDate(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        <button type="submit" className={styles.submitBtn}>
          Registrar Movimentação
        </button>
      </form>
    </div>
  );
};
