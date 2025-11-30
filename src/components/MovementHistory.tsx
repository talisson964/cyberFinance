import React, { useState, useRef, useEffect } from 'react';
import { useCaixa } from '../context/CaixaContextSupabase';
import { formatCurrency, formatDate, getMovementTypeLabel } from '../utils/calculations';
import { exportMovementsToPDF, exportMovementsToCSV, exportMovementsToExcel } from '../utils/exportUtils';
import { Trash2, Check, Edit2, Download, ChevronDown, Search, X } from 'lucide-react';
import { EditMovementModal } from './EditMovementModal';
import { PurchaseItemsTooltip } from './PurchaseItemsTooltip';
import { ConfirmDialog } from './ConfirmDialog';
import { useConfirm } from '../hooks/useConfirm';
import styles from './MovementHistory.module.css';
import type { Movement } from '../types';

export const MovementHistory: React.FC = () => {
  const { movements, deleteMovement, markMovementAsPaid, markInstallmentAsPaid, undoLastInstallmentPayment, undoMarkAsPaid } = useCaixa();
  const { confirm, confirmState, cancel } = useConfirm();
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'entrada' | 'saida'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [expandedDetails, setExpandedDetails] = useState<Set<string>>(new Set());
  const [deletedMessage, setDeletedMessage] = useState<string>('');
  const [editingMovement, setEditingMovement] = useState<Movement | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showItemsPopup, setShowItemsPopup] = useState<string | null>(null);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  
  const statusDropdownRef = useRef<HTMLDivElement>(null);
  const typeDropdownRef = useRef<HTMLDivElement>(null);
  const exportDropdownRef = useRef<HTMLDivElement>(null);

  const handleDelete = async (movement: Movement) => {
    const confirmed = await confirm({
      title: 'Confirmar Exclusão',
      message: `Tem certeza que deseja deletar a movimentação "${movement.description}"? Esta ação não pode ser desfeita.`,
      confirmText: 'Deletar',
      cancelText: 'Cancelar',
      type: 'danger'
    });

    if (confirmed) {
      await deleteMovement(movement.id);
      setDeletedMessage(`✅ Movimentação "${movement.description}" removida do Dashboard`);
      setTimeout(() => setDeletedMessage(''), 3000);
    }
  };

  // Fechar dropdowns ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
        setShowStatusDropdown(false);
      }
      if (typeDropdownRef.current && !typeDropdownRef.current.contains(event.target as Node)) {
        setShowTypeDropdown(false);
      }
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(event.target as Node)) {
        setShowExportDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  let filteredMovements = movements;

  if (filter === 'pending') {
    filteredMovements = filteredMovements.filter(m => !m.isPaid);
  } else if (filter === 'paid') {
    filteredMovements = filteredMovements.filter(m => m.isPaid);
  }

  if (typeFilter !== 'all') {
    filteredMovements = filteredMovements.filter(m => m.type === typeFilter);
  }

  // Filtro de pesquisa por descrição e data
  if (searchTerm.trim()) {
    const searchLower = searchTerm.toLowerCase().trim();
    filteredMovements = filteredMovements.filter(m => {
      const descriptionMatch = m.description.toLowerCase().includes(searchLower);
      const dateMatch = formatDate(m.date).includes(searchLower);
      const categoryMatch = m.category.toLowerCase().includes(searchLower);
      const notesMatch = m.notes?.toLowerCase().includes(searchLower);
      
      return descriptionMatch || dateMatch || categoryMatch || notesMatch;
    });
  }

  // Ordenar por data (mais recentes primeiro)
  filteredMovements = filteredMovements.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const pendingMovements = movements.filter(m => !m.isPaid);
  const pendingEntrada = pendingMovements
    .filter(m => m.type === 'entrada')
    .reduce((sum, m) => sum + m.amount, 0);
  const pendingSaida = pendingMovements
    .filter(m => m.type === 'saida')
    .reduce((sum, m) => sum + m.amount, 0);

  const handleMarkAsPaid = (id: string) => {
    const today = new Date().toISOString().split('T')[0];
    markMovementAsPaid(id, today);
  };

  const handlePayInstallment = (movementId: string, installmentNumber: number) => {
    const today = new Date().toISOString().split('T')[0];
    markInstallmentAsPaid(movementId, installmentNumber, today);
  };

  const toggleExpandRow = (movementId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(movementId)) {
      newExpanded.delete(movementId);
    } else {
      newExpanded.add(movementId);
    }
    setExpandedRows(newExpanded);
  };

  const toggleExpandDetails = (movementId: string) => {
    const newExpanded = new Set(expandedDetails);
    if (newExpanded.has(movementId)) {
      newExpanded.delete(movementId);
    } else {
      newExpanded.add(movementId);
    }
    setExpandedDetails(newExpanded);
  };

  const handleEditMovement = (movement: Movement) => {
    setEditingMovement(movement);
    setIsEditModalOpen(true);
  };

  const handleEditSuccess = () => {
    setIsEditModalOpen(false);
    setEditingMovement(null);
  };

  const getStatusColor = (isPaid: boolean) => {
    return isPaid ? styles.paid : styles.pending;
  };

  const getInstallmentText = (movement: Movement) => {
    if (!movement.installments || !Array.isArray(movement.installments) || movement.installments.length === 0) return '';
    const paidCount = movement.installments.filter(i => i.isPaid).length;
    const totalCount = movement.installments.length;
    return ` (${paidCount}/${totalCount})`;
  };

  return (
    <div className={styles.container}>
      <h2>📊 Histórico de Movimentações</h2>

      {/* Mensagem de sucesso ao deletar */}
      {deletedMessage && (
        <div className={styles.successMessage}>
          {deletedMessage}
        </div>
      )}

      {/* Resumo de Pendências */}
      {pendingMovements.length > 0 && (
        <div className={styles.pendingSummary}>
          <div className={styles.pendingCard}>
            <h3>⏳ Pendências</h3>
            {pendingEntrada > 0 && (
              <p className={styles.positivo}>
                Receber: {formatCurrency(pendingEntrada)}
              </p>
            )}
            {pendingSaida > 0 && (
              <p className={styles.negativo}>
                Pagar: {formatCurrency(pendingSaida)}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className={styles.filterSection}>
        {/* Barra de Pesquisa */}
        <div className={styles.searchContainer}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Pesquisar por descrição, data, categoria..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
          {searchTerm && (
            <button
              className={styles.clearSearchBtn}
              onClick={() => setSearchTerm('')}
              title="Limpar pesquisa"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Dropdown Status */}
        <div className={styles.filterGroup} ref={statusDropdownRef}>
          <div 
            className={styles.dropdownButton}
            onClick={() => setShowStatusDropdown(!showStatusDropdown)}
          >
            <span>Status: {filter === 'all' ? 'Todos' : filter === 'pending' ? '⏳ Pendentes' : '✅ Pagos'}</span>
            <ChevronDown size={16} className={showStatusDropdown ? styles.rotated : ''} />
          </div>
          {showStatusDropdown && (
            <div className={styles.dropdownMenu}>
              <button
                className={`${styles.dropdownItem} ${filter === 'all' ? styles.active : ''}`}
                onClick={() => {
                  setFilter('all');
                  setShowStatusDropdown(false);
                }}
              >
                Todos
              </button>
              <button
                className={`${styles.dropdownItem} ${filter === 'pending' ? styles.active : ''}`}
                onClick={() => {
                  setFilter('pending');
                  setShowStatusDropdown(false);
                }}
              >
                ⏳ Pendentes ({pendingMovements.length})
              </button>
              <button
                className={`${styles.dropdownItem} ${filter === 'paid' ? styles.active : ''}`}
                onClick={() => {
                  setFilter('paid');
                  setShowStatusDropdown(false);
                }}
              >
                ✅ Pagos ({movements.filter(m => m.isPaid).length})
              </button>
            </div>
          )}
        </div>

        {/* Dropdown Tipo */}
        <div className={styles.filterGroup} ref={typeDropdownRef}>
          <div 
            className={styles.dropdownButton}
            onClick={() => setShowTypeDropdown(!showTypeDropdown)}
          >
            <span>Tipo: {typeFilter === 'all' ? 'Todos' : typeFilter === 'entrada' ? 'Entradas' : 'Saídas'}</span>
            <ChevronDown size={16} className={showTypeDropdown ? styles.rotated : ''} />
          </div>
          {showTypeDropdown && (
            <div className={styles.dropdownMenu}>
              <button
                className={`${styles.dropdownItem} ${typeFilter === 'all' ? styles.active : ''}`}
                onClick={() => {
                  setTypeFilter('all');
                  setShowTypeDropdown(false);
                }}
              >
                Todos
              </button>
              <button
                className={`${styles.dropdownItem} ${typeFilter === 'entrada' ? styles.active : ''}`}
                onClick={() => {
                  setTypeFilter('entrada');
                  setShowTypeDropdown(false);
                }}
              >
                💰 Entradas
              </button>
              <button
                className={`${styles.dropdownItem} ${typeFilter === 'saida' ? styles.active : ''}`}
                onClick={() => {
                  setTypeFilter('saida');
                  setShowTypeDropdown(false);
                }}
              >
                💸 Saídas
              </button>
            </div>
          )}
        </div>

        {/* Dropdown Exportar */}
        <div className={styles.filterGroup} ref={exportDropdownRef}>
          <div 
            className={styles.dropdownButton}
            onClick={() => setShowExportDropdown(!showExportDropdown)}
          >
            <Download size={16} />
            <span>Exportar</span>
            <ChevronDown size={16} className={showExportDropdown ? styles.rotated : ''} />
          </div>
          {showExportDropdown && (
            <div className={styles.dropdownMenu}>
              <button
                className={styles.dropdownItem}
                onClick={() => {
                  exportMovementsToPDF(filteredMovements);
                  setShowExportDropdown(false);
                }}
              >
                <Download size={16} /> PDF
              </button>
              <button
                className={styles.dropdownItem}
                onClick={() => {
                  exportMovementsToCSV(filteredMovements);
                  setShowExportDropdown(false);
                }}
              >
                <Download size={16} /> CSV
              </button>
              <button
                className={styles.dropdownItem}
                onClick={() => {
                  exportMovementsToExcel(filteredMovements);
                  setShowExportDropdown(false);
                }}
              >
                <Download size={16} /> Excel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tabela */}
      {filteredMovements.length === 0 ? (
        <p className={styles.empty}>Nenhuma movimentação encontrada</p>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: '40px' }}></th>
                <th>Data</th>
                <th>Descrição</th>
                <th>Valor Total</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredMovements.map(movement => (
                <React.Fragment key={movement.id}>
                  <tr className={`${styles.row} ${getStatusColor(movement.isPaid)}`}>
                    <td>
                      <button
                        onClick={() => toggleExpandDetails(movement.id)}
                        className={styles.expandIconBtn}
                        title="Ver mais detalhes"
                      >
                        <ChevronDown 
                          size={18} 
                          className={expandedDetails.has(movement.id) ? styles.rotated : ''}
                        />
                      </button>
                    </td>
                    <td>{formatDate(movement.date)}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', position: 'relative' }}>
                        <span>{movement.description}</span>
                        {movement.purchaseItems && movement.purchaseItems.length > 1 && (
                          <span 
                            className={styles.groupedBadge}
                            onClick={() => setShowItemsPopup(showItemsPopup === movement.id ? null : movement.id)}
                            onMouseEnter={() => setShowItemsPopup(movement.id)}
                            onMouseLeave={() => setShowItemsPopup(null)}
                            style={{
                              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                              color: 'white',
                              fontSize: '11px',
                              fontWeight: '600',
                              padding: '3px 8px',
                              borderRadius: '10px',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                              boxShadow: '0 2px 6px rgba(16, 185, 129, 0.3)',
                              cursor: 'pointer',
                              userSelect: 'none',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            Agrupado ({movement.purchaseItems.length})
                          </span>
                        )}
                        {showItemsPopup === movement.id && movement.purchaseItems && movement.purchaseItems.length > 1 && (
                          <div 
                            className={styles.itemsPopup}
                            onMouseEnter={() => setShowItemsPopup(movement.id)}
                            onMouseLeave={() => setShowItemsPopup(null)}
                            style={{
                              position: 'absolute',
                              top: '100%',
                              left: '50%',
                              transform: 'translateX(-50%)',
                              marginTop: '8px',
                              backgroundColor: 'white',
                              border: '2px solid #10b981',
                              borderRadius: '8px',
                              padding: '12px',
                              boxShadow: '0 8px 20px rgba(0, 0, 0, 0.2)',
                              zIndex: 9999,
                              minWidth: '320px',
                              maxWidth: '400px',
                              pointerEvents: 'auto'
                            }}
                          >
                            <div style={{ fontSize: '14px', fontWeight: '700', marginBottom: '10px', color: '#1e293b', borderBottom: '2px solid #10b981', paddingBottom: '6px' }}>
                              📦 Itens da compra
                            </div>
                            {movement.purchaseItems.map((item, idx) => (
                              <div 
                                key={idx}
                                style={{
                                  padding: '8px 0',
                                  borderBottom: idx < movement.purchaseItems!.length - 1 ? '1px solid #e5e7eb' : 'none',
                                  fontSize: '13px',
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'flex-start',
                                  gap: '12px'
                                }}
                              >
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontWeight: '600', color: '#1e293b', marginBottom: '3px' }}>
                                    {item.name}
                                  </div>
                                  <div style={{ fontSize: '11px', color: '#64748b' }}>
                                    {item.quantity} unidade{item.quantity > 1 ? 's' : ''} × {formatCurrency(item.unitPrice)}
                                  </div>
                                </div>
                                <div style={{ fontWeight: '700', color: '#10b981', whiteSpace: 'nowrap', fontSize: '14px' }}>
                                  {formatCurrency(item.total)}
                                </div>
                              </div>
                            ))}
                            <div style={{
                              marginTop: '12px',
                              paddingTop: '12px',
                              borderTop: '2px solid #10b981',
                              display: 'flex',
                              justifyContent: 'space-between',
                              fontWeight: '700',
                              fontSize: '15px',
                              color: '#1e293b'
                            }}>
                              <span>Total Geral:</span>
                              <span style={{ color: '#10b981', fontSize: '16px' }}>{formatCurrency(movement.amount)}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className={movement.type === 'entrada' ? styles.positivo : styles.negativo}>
                      <div>
                        <div>{movement.type === 'entrada' ? '+' : '-'} {formatCurrency(movement.amount)}</div>
                        {movement.installments && movement.installments.length > 0 && (
                          <div className={styles.installmentValueInfo}>
                            Parcela: {formatCurrency(movement.installments[0]?.amount || 0)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      {movement.isPaid ? (
                        <span className={styles.paidBadge}>✅ Pago</span>
                      ) : (
                        <span className={styles.pendingBadge}>⏳ Pendente</span>
                      )}
                    </td>
                    <td className={styles.actions}>
                      {/* Se tem parcelas e não está totalmente pago */}
                      {movement.installments && movement.installments.length > 0 && !movement.isPaid && (
                        <button
                          onClick={() => toggleExpandRow(movement.id)}
                          className={`${styles.actionBtn} ${styles.expandBtn}`}
                          title="Ver parcelas"
                        >
                          💳 ({movement.installments.filter(i => i.isPaid).length}/{movement.installments.length})
                        </button>
                      )}

                      {/* Se não tem parcelas e não está pago */}
                      {(!movement.installments || movement.installments.length === 0) && !movement.isPaid && (
                        <button
                          onClick={() => handleMarkAsPaid(movement.id)}
                          className={`${styles.actionBtn} ${styles.checkBtn}`}
                          title="Marcar como pago"
                        >
                          <Check size={18} />
                        </button>
                      )}

                      {/* Se está pago (sem parcelas), mostrar desfazer */}
                      {(!movement.installments || movement.installments.length === 0) && movement.isPaid && (
                        <button
                          onClick={() => undoMarkAsPaid(movement.id)}
                          className={`${styles.actionBtn} ${styles.undoBtn}`}
                          title="Desfazer marcação como pago"
                        >
                          ↩️ Desfazer
                        </button>
                      )}

                      {/* Botão de edição */}
                      <button
                        onClick={() => handleEditMovement(movement)}
                        className={`${styles.actionBtn} ${styles.editBtn}`}
                        title="Editar movimentação"
                      >
                        <Edit2 size={18} />
                      </button>

                      <button
                        onClick={() => handleDelete(movement)}
                        className={`${styles.actionBtn} ${styles.deleteBtn}`}
                        title="Deletar"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>

                  {/* Linha expandida com detalhes completos */}
                  {expandedDetails.has(movement.id) && (
                    <tr className={styles.detailsRow}>
                      <td colSpan={6}>
                        <div className={styles.detailsContainer}>
                          <div className={styles.detailsGrid}>
                            <div className={styles.detailItem}>
                              <span className={styles.detailLabel}>Tipo:</span>
                              <span className={styles.detailValue}>
                                {movement.type === 'entrada' ? '💰 Entrada' : '💸 Saída'}
                              </span>
                            </div>
                            <div className={styles.detailItem}>
                              <span className={styles.detailLabel}>Tipo de Pagamento:</span>
                              <span className={styles.detailValue}>{getMovementTypeLabel(movement.movementType)}</span>
                            </div>
                            <div className={styles.detailItem}>
                              <span className={styles.detailLabel}>Categoria:</span>
                              <span className={styles.detailValue}>{movement.category}</span>
                            </div>
                            <div className={styles.detailItem}>
                              <span className={styles.detailLabel}>Classificação:</span>
                              <span className={styles.detailValue}>
                                {movement.classification === 'fixo' && '🔄 Fixo'}
                                {movement.classification === 'ocasional' && '⏱️ Ocasional'}
                                {movement.classification === 'nenhum' && '➖ Nenhum'}
                              </span>
                            </div>
                            {movement.notes && (
                              <div className={styles.detailItem} style={{ gridColumn: '1 / -1' }}>
                                <span className={styles.detailLabel}>Anotações:</span>
                                <span className={styles.detailValue} style={{ whiteSpace: 'pre-wrap' }}>{movement.notes}</span>
                              </div>
                            )}
                            {movement.purchaseItems && movement.purchaseItems.length > 0 && (
                              <div className={styles.detailItem} style={{ gridColumn: '1 / -1' }}>
                                <span className={styles.detailLabel}>Itens da Compra:</span>
                                <div className={styles.purchaseItemsList}>
                                  {movement.purchaseItems.map((item, idx) => (
                                    <div key={idx} className={styles.purchaseItemRow}>
                                      <span>{item.name}</span>
                                      <span>{item.quantity} un × {formatCurrency(item.unitPrice)} = {formatCurrency(item.total)}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}

                  {/* Expandable row com detalhes das parcelas */}
                  {movement.installments && movement.installments.length > 0 && expandedRows.has(movement.id) && (
                    <tr className={styles.expandedRow}>
                      <td colSpan={6}>
                        <div className={styles.installmentsContainer}>
                          <h4>Detalhes das Parcelas:</h4>
                          <div className={styles.installmentsList}>
                            {movement.installments.map((installment) => (
                              <div key={installment.id} className={styles.installmentItem}>
                                <div className={styles.installmentInfo}>
                                  <span className={styles.installmentNumber}>
                                    Parcela {installment.number}/{movement.installments?.length}
                                  </span>
                                  <span className={styles.installmentAmount}>
                                    {formatCurrency(installment.amount)}
                                  </span>
                                  <span className={styles.installmentDate}>
                                    Venc: {formatDate(installment.dueDate)}
                                  </span>
                                  {installment.isPaid && (
                                    <span className={styles.installmentPaid}>
                                      ✅ Pago em {formatDate(installment.paidDate || '')}
                                    </span>
                                  )}
                                </div>
                                {!installment.isPaid && (
                                  <button
                                    onClick={() => handlePayInstallment(movement.id, installment.number)}
                                    className={`${styles.actionBtn} ${styles.payInstallmentBtn}`}
                                    title="Pagar parcela"
                                  >
                                    ✅ Pagar
                                  </button>
                                )}
                                {installment.isPaid && (
                                  <button
                                    onClick={() => undoLastInstallmentPayment(movement.id)}
                                    className={`${styles.actionBtn} ${styles.undoBtn}`}
                                    title="Desfazer pagamento desta parcela"
                                  >
                                    ↩️ Desfazer
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de Edição */}
      <EditMovementModal
        movement={editingMovement}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingMovement(null);
        }}
        onSuccess={handleEditSuccess}
      />

      {/* Dialog de Confirmação */}
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
