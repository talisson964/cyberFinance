import React, { useState, useEffect } from 'react';
import { useCaixa } from '../context/CaixaContextSupabase';
import type { TransactionType, MovementType, ExpenseClassification, EntradaSubcategory, SaidaSubcategory, PurchaseItem } from '../types';
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
  { value: 'compra_estoque', label: '📦 Compra de Estoque' },
  { value: 'consultorias', label: '📞 Consultorias' },
  { value: 'outra_saida', label: '❓ Outra Saída' },
];

const MOVEMENT_TYPES: { value: MovementType; label: string }[] = [
  { value: 'pix', label: '📱 Pix' },
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
  'Will Bank',
  'Mercado Pago',
  'Outro',
];

export const MovementForm: React.FC = () => {
  const { addMovement } = useCaixa();
  const [type, setType] = useState<TransactionType>('saida');
  const [movementType, setMovementType] = useState<MovementType>('pix');
  const [classification, setClassification] = useState<ExpenseClassification>('ocasional');
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
  const [dueDate, setDueDate] = useState('');
  const [useQuantity, setUseQuantity] = useState(false);
  const [quantity, setQuantity] = useState('1');
  const [unitPrice, setUnitPrice] = useState('');

  const subcategories = type === 'entrada' ? ENTRADA_SUBCATEGORIES : SAIDA_SUBCATEGORIES;

  // Atualizar valor total quando itens de compra mudarem
  useEffect(() => {
    if (type === 'saida' && subcategory === 'fornecedores' && purchaseItems.length > 0) {
      const total = purchaseItems.reduce((sum, item) => sum + item.total, 0);
      setAmount(total.toFixed(2));
    }
  }, [purchaseItems, type, subcategory]);

  // Calcular valor total baseado em quantidade e valor unitário
  useEffect(() => {
    if (type === 'saida' && useQuantity && quantity && unitPrice) {
      const qty = parseFloat(quantity);
      const price = parseFloat(unitPrice);
      if (qty > 0 && price > 0) {
        setAmount((qty * price).toFixed(2));
      }
    }
  }, [quantity, unitPrice, useQuantity, type]);

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

    if (isParcelado && (!totalInstallments || parseInt(totalInstallments) <= 0)) {
      await showNotification('error', 'Para parcelamento, informe o total de parcelas');
      return;
    }

    if (type === 'saida' && (movementType === 'cartao_credito' || (movementType === 'parcelado' && isParcelado)) && !cardBank) {
      await showNotification('error', 'Por favor, selecione o banco do cartão');
      return;
    }

    // Mapear subcategoria para label de categoria
    const subcategoryObj = subcategories.find(s => s.value === subcategory);
    const categoryLabel = subcategoryObj?.label || subcategory;

    // Calcular data de vencimento se não foi informada (padrão: 30 dias após a movimentação)
    let calculatedFirstInstallmentDate = firstInstallmentDate;
    if (isParcelado && !firstInstallmentDate) {
      const firstDueDate = new Date(movementDate);
      firstDueDate.setDate(firstDueDate.getDate() + 30);
      calculatedFirstInstallmentDate = firstDueDate.toISOString().split('T')[0];
    }

    // Adicionar banco do cartão nas notas se for cartão de crédito
    let finalNotes = notes || '';
    if (type === 'saida' && (movementType === 'cartao_credito' || movementType === 'parcelado') && cardBank) {
      finalNotes = finalNotes ? `${finalNotes}\n\nBanco: ${cardBank}` : `Banco: ${cardBank}`;
    }

    // Adicionar data de vencimento nas notas (para cartão não parcelado e boleto)
    if (dueDate && !isParcelado && (movementType === 'cartao_credito' || movementType === 'boleto')) {
      const dueDateFormatted = new Date(dueDate).toLocaleDateString('pt-BR');
      const dueDateLabel = movementType === 'boleto' ? 'Vencimento do Boleto' : 'Vencimento da Fatura';
      finalNotes = finalNotes ? `${finalNotes}\n\n${dueDateLabel}: ${dueDateFormatted}` : `${dueDateLabel}: ${dueDateFormatted}`;
    }

    // Adicionar informações de quantidade nas notas
    if (type === 'saida' && useQuantity && quantity && unitPrice) {
      const qty = parseFloat(quantity);
      const price = parseFloat(unitPrice);
      const quantityInfo = `Quantidade: ${qty} un\nValor Unitário: R$ ${price.toFixed(2)}\nValor Total: R$ ${numAmount.toFixed(2)}`;
      finalNotes = finalNotes ? `${finalNotes}\n\n${quantityInfo}` : quantityInfo;
    }

    const result = await addMovement(
      type,
      movementType,
      numAmount,
      categoryLabel,
      description.trim(),
      classification,
      movementDate,
      isParcelado ? parseInt(totalInstallments) : undefined,
      isParcelado ? calculatedFirstInstallmentDate : undefined,
      finalNotes || undefined,
      fixedExpenseDuration ? parseInt(fixedExpenseDuration) : undefined,
      type === 'saida' && subcategory === 'fornecedores' && purchaseItems.length > 0 ? purchaseItems : undefined,
      (type === 'saida' && (movementType === 'cartao_credito' || movementType === 'boleto') && dueDate) ? dueDate : undefined
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
    setDueDate('');
    setUseQuantity(false);
    setQuantity('1');
    setUnitPrice('');
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
              setClassification('ocasional');
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
              <option value="ocasional">⏱️ Gasto Ocasional</option>
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
            disabled={(type === 'saida' && subcategory === 'fornecedores' && purchaseItems.length > 0) || (type === 'saida' && useQuantity)}
          />
          {type === 'saida' && subcategory === 'fornecedores' && purchaseItems.length > 0 && (
            <small style={{ color: 'var(--text-secondary)', marginTop: '4px', display: 'block' }}>
              Valor calculado automaticamente pela soma dos itens
            </small>
          )}
          {type === 'saida' && useQuantity && quantity && unitPrice && (
            <small style={{ color: 'var(--text-secondary)', marginTop: '4px', display: 'block' }}>
              Valor calculado: {quantity} × R$ {parseFloat(unitPrice).toFixed(2)} = R$ {amount}
            </small>
          )}
        </div>

        {/* Quantidade e Valor Unitário (apenas para saída e não fornecedores) */}
        {type === 'saida' && subcategory !== 'fornecedores' && (
          <div className={styles.formGroup}>
            <div className={styles.checkboxGroup}>
              <input
                id="useQuantity"
                type="checkbox"
                checked={useQuantity}
                onChange={(e) => {
                  setUseQuantity(e.target.checked);
                  if (!e.target.checked) {
                    setQuantity('1');
                    setUnitPrice('');
                    setAmount('');
                  }
                }}
              />
              <label htmlFor="useQuantity">📦 Produto com múltiplas unidades</label>
            </div>

            {useQuantity && (
              <div className={styles.installmentFields}>
                <div className={styles.formGroup}>
                  <label htmlFor="quantity">Quantidade *</label>
                  <input
                    id="quantity"
                    type="number"
                    step="1"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="1"
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="unitPrice">Valor Unitário (R$) *</label>
                  <input
                    id="unitPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(e.target.value)}
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>
            )}
          </div>
        )}

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
            onChange={(e) => setDescription(e.target.value)}
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

        {/* Banco do Cartão (para cartão de crédito e parcelado) */}
        {type === 'saida' && (movementType === 'cartao_credito' || (movementType === 'parcelado' && isParcelado)) && (
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

        {/* Parcelamento para Cartão de Crédito */}
        {movementType === 'cartao_credito' && (
          <div className={styles.installmentSection}>
            <div className={styles.checkboxGroup}>
              <input
                id="isParceladoCredito"
                type="checkbox"
                checked={isParcelado}
                onChange={(e) => setIsParcelado(e.target.checked)}
              />
              <label htmlFor="isParceladoCredito">📅 Parcelar no cartão</label>
            </div>

            {!isParcelado && (
              <div className={styles.formGroup}>
                <label htmlFor="dueDateCredito">
                  Data de Vencimento (opcional)
                  <small style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '12px', marginTop: '4px' }}>
                    Data de vencimento da fatura do cartão
                  </small>
                </label>
                <input
                  id="dueDateCredito"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            )}

            {isParcelado && (
              <div className={styles.installmentFields}>
                <div className={styles.formGroup}>
                  <label htmlFor="totalInstallments">Total de Parcelas *</label>
                  <input
                    id="totalInstallments"
                    type="number"
                    min="2"
                    max="48"
                    value={totalInstallments}
                    onChange={(e) => setTotalInstallments(e.target.value)}
                    placeholder="Ex: 12"
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="firstInstallmentDate">
                    Data de Vencimento (opcional)
                    <small style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '12px', marginTop: '4px' }}>
                      Se não informada, será 30 dias após a data da movimentação
                    </small>
                  </label>
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

        {/* Parcelamento para Tipo Parcelado */}
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
                  <label htmlFor="totalInstallmentsParcelado">Total de Parcelas *</label>
                  <input
                    id="totalInstallmentsParcelado"
                    type="number"
                    min="2"
                    max="48"
                    value={totalInstallments}
                    onChange={(e) => setTotalInstallments(e.target.value)}
                    placeholder="Ex: 12"
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="firstInstallmentDateParcelado">
                    Data de Vencimento (opcional)
                    <small style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '12px', marginTop: '4px' }}>
                      Se não informada, será 30 dias após a data da movimentação
                    </small>
                  </label>
                  <input
                    id="firstInstallmentDateParcelado"
                    type="date"
                    value={firstInstallmentDate}
                    onChange={(e) => setFirstInstallmentDate(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Data de Vencimento para Boleto */}
        {movementType === 'boleto' && (
          <div className={styles.formGroup}>
            <label htmlFor="dueDateBoleto">
              📅 Data de Vencimento
              <small style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '12px', marginTop: '4px' }}>
                Data de vencimento do boleto
              </small>
            </label>
            <input
              id="dueDateBoleto"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
        )}

        <button type="submit" className={styles.submitBtn}>
          Registrar Movimentação
        </button>
      </form>
    </div>
  );
};
