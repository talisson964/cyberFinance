import React, { useMemo, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCaixa } from '../context/CaixaContext';
import { formatCurrency, formatDate } from '../utils/calculations';
import { exportAdvancedReportToPDF, exportAdvancedReportToCSV, exportAdvancedReportToExcel } from '../utils/exportUtils';
import { Download } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import styles from './AdvancedReports.module.css';

export const AdvancedReports: React.FC = () => {
  const { getOverdueAnalysis, getFutureFlowForecast, movements, getNextDueInstallments, calculateInterestAmount } = useCaixa();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedMetric, setSelectedMetric] = useState<'overdue' | 'forecast-7' | 'forecast-30' | 'forecast-365' | 'installments' | 'nextdue'>('overdue');
  const [forecastPeriod, setForecastPeriod] = useState<7 | 30 | 365>(7);
  const [overdueType, setOverdueType] = useState<'all' | 'receivable' | 'payable'>('all');
  const [installmentType, setInstallmentType] = useState<'all' | 'receivable' | 'payable'>('all');
  const [installmentStatus, setInstallmentStatus] = useState<'all' | 'completed' | 'ongoing'>('all');

  // Sincronizar métrica com parâmetro de URL
  useEffect(() => {
    const tab = searchParams.get('tab') as any;
    if (tab && ['overdue', 'forecast-7', 'forecast-30', 'forecast-365', 'installments', 'nextdue'].includes(tab)) {
      setSelectedMetric(tab);
      // Extrair período do forecast
      if (tab === 'forecast-7') setForecastPeriod(7);
      else if (tab === 'forecast-30') setForecastPeriod(30);
      else if (tab === 'forecast-365') setForecastPeriod(365);
    }
  }, [searchParams]);

  // Atualizar URL quando métrica muda
  const handleMetricChange = (metric: 'overdue' | 'forecast-7' | 'forecast-30' | 'forecast-365' | 'installments' | 'nextdue') => {
    setSelectedMetric(metric);
    setSearchParams({ tab: metric });
  };

  const overdueData = useMemo(() => getOverdueAnalysis(), [getOverdueAnalysis]);
  const forecastData = useMemo(() => getFutureFlowForecast(forecastPeriod), [getFutureFlowForecast, forecastPeriod]);
  const nextDueInstallments = useMemo(() => getNextDueInstallments(7), [getNextDueInstallments]);

  // Filtrar atrasados por tipo
  const filteredOverdueItems = useMemo(() => {
    if (overdueType === 'all') return overdueData.overdueItems;
    if (overdueType === 'receivable') return overdueData.overdueItems.filter(m => m.type === 'entrada');
    if (overdueType === 'payable') return overdueData.overdueItems.filter(m => m.type === 'saida');
    return overdueData.overdueItems;
  }, [overdueData, overdueType]);

  const filteredOverdueAmount = useMemo(() => {
    return filteredOverdueItems.reduce((sum, item) => sum + item.amount, 0);
  }, [filteredOverdueItems]);

  // Calcular juros totais para os itens atrasados filtrados
  const totalInterestAmount = useMemo(() => {
    return filteredOverdueItems.reduce((sum, item) => sum + calculateInterestAmount(item.id), 0);
  }, [filteredOverdueItems, calculateInterestAmount]);

  // Calcular valor total com juros
  const totalWithInterest = useMemo(() => {
    return filteredOverdueAmount + totalInterestAmount;
  }, [filteredOverdueAmount, totalInterestAmount]);

  const overduesByCategory = useMemo(() => {
    if (filteredOverdueItems.length === 0) return [];
    const categories = new Map<string, number>();
    filteredOverdueItems.forEach(m => {
      const current = categories.get(m.category) || 0;
      categories.set(m.category, current + m.amount);
    });
    return Array.from(categories.entries()).map(([name, value]) => ({ name, value }));
  }, [filteredOverdueItems]);

  const overduesByPriority = useMemo(() => {
    if (filteredOverdueItems.length === 0) return [];
    const priorities = new Map<string, number>();
    filteredOverdueItems.forEach(m => {
      const current = priorities.get(m.priority) || 0;
      priorities.set(m.priority, current + m.amount);
    });
    return Array.from(priorities.entries())
      .map(([name, value]) => ({ name: name === 'alta' ? '🔴 Alta' : name === 'média' ? '🟡 Média' : '🟢 Baixa', value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredOverdueItems]);

  const forecastChartData = useMemo(() => {
    return forecastData.map(d => ({
      date: new Date(d.date).toLocaleDateString('pt-BR', { year: 'numeric', month: '2-digit', day: '2-digit' }),
      income: d.expectedIncome,
      expense: d.expectedExpense,
    }));
  }, [forecastData]);

  const installmentStats = useMemo(() => {
    let stats = movements
      .filter(m => m.installments && m.installments.length > 0)
      .map(m => {
        const paid = (m.installments || []).filter(i => i.isPaid).length;
        const total = (m.installments || []).length;
        return {
          id: m.id,
          description: m.description,
          paid,
          total,
          percentage: Math.round((paid / total) * 100),
          amount: m.amount,
          type: m.type,
        };
      });
    
    // Filtrar por tipo de parcela
    if (installmentType === 'receivable') {
      stats = stats.filter(s => s.type === 'entrada');
    } else if (installmentType === 'payable') {
      stats = stats.filter(s => s.type === 'saida');
    }

    // Filtrar por status de conclusão
    if (installmentStatus === 'completed') {
      stats = stats.filter(s => s.percentage === 100);
    } else if (installmentStatus === 'ongoing') {
      stats = stats.filter(s => s.percentage < 100);
    }
    
    return stats;
  }, [movements, installmentType, installmentStatus]);

  // Função helper para calcular data de entrada em atraso e contar parcelas atrasadas
  const getOverdueInfo = (item: typeof filteredOverdueItems[0]) => {
    let overdueDate = item.date;
    let overdueCount = 0;

    if (item.installments && item.installments.length > 0) {
      // Se tem parcelas, encontrar a primeira parcela atrasada
      const unpaidInstallments = item.installments.filter(inst => !inst.isPaid);
      if (unpaidInstallments.length > 0) {
        overdueDate = unpaidInstallments[0].dueDate;
        overdueCount = unpaidInstallments.length;
      }
    } else {
      // Se não tem parcelas, apenas conta como 1
      overdueCount = 1;
    }

    return { overdueDate, overdueCount };
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>📊 Relatórios Avançados</h1>
        
        <div className={styles.exportButtons}>
          <button
            className={styles.exportBtn}
            onClick={() => {
              const data = {
                totalEntrada: movements.filter(m => m.type === 'entrada').reduce((sum, m) => sum + m.amount, 0),
                totalSaida: movements.filter(m => m.type === 'saida').reduce((sum, m) => sum + m.amount, 0),
                liquido: movements.filter(m => m.type === 'entrada').reduce((sum, m) => sum + m.amount, 0) - movements.filter(m => m.type === 'saida').reduce((sum, m) => sum + m.amount, 0),
                categoriesData: []
              };
              exportAdvancedReportToPDF(data);
            }}
            title="Exportar como PDF"
          >
            <Download size={16} /> PDF
          </button>
          <button
            className={styles.exportBtn}
            onClick={() => exportAdvancedReportToCSV(movements, [])}
            title="Exportar como CSV"
          >
            <Download size={16} /> CSV
          </button>
          <button
            className={styles.exportBtn}
            onClick={() => exportAdvancedReportToExcel(movements, [])}
            title="Exportar como Excel"
          >
            <Download size={16} /> Excel
          </button>
        </div>
      </div>

      {/* Seletor de Métrica - Hidden quando em Forecasts */}
      {!selectedMetric?.startsWith('forecast') && (
        <div className={styles.metricSelector}>
          <button
            className={`${styles.metricBtn} ${selectedMetric === 'overdue' ? styles.active : ''}`}
            onClick={() => handleMetricChange('overdue')}
          >
            🔴 Atrasados ({overdueData.numberOfOverdueItems})
          </button>
          <button
            className={`${styles.metricBtn} ${selectedMetric === 'installments' ? styles.active : ''}`}
            onClick={() => handleMetricChange('installments')}
          >
            📅 Parcelas ({installmentStats.length})
          </button>
          <button
            className={`${styles.metricBtn} ${selectedMetric === 'nextdue' ? styles.active : ''}`}
            onClick={() => handleMetricChange('nextdue')}
          >
            ⏰ Próximos Vencimentos ({nextDueInstallments.length})
          </button>
        </div>
      )}

      {/* ATRASADOS */}
      {selectedMetric === 'overdue' && (
        <div className={styles.reportSection}>
          <h2>🔴 Análise de Atrasados</h2>

          {/* Filtro de tipo de atrasado */}
          <div className={styles.overdueTypeFilter}>
            <button
              className={`${styles.filterBtn} ${overdueType === 'all' ? styles.active : ''}`}
              onClick={() => setOverdueType('all')}
            >
              📊 Todos ({overdueData.numberOfOverdueItems})
            </button>
            <button
              className={`${styles.filterBtn} ${overdueType === 'receivable' ? styles.active : ''}`}
              onClick={() => setOverdueType('receivable')}
            >
              📥 A Receber ({overdueData.overdueItems.filter(m => m.type === 'entrada').length})
            </button>
            <button
              className={`${styles.filterBtn} ${overdueType === 'payable' ? styles.active : ''}`}
              onClick={() => setOverdueType('payable')}
            >
              📤 A Pagar ({overdueData.overdueItems.filter(m => m.type === 'saida').length})
            </button>
          </div>
          
          <div className={styles.overdueCards}>
            <div className={styles.overdueCard}>
              <h3>Total Atrasado</h3>
              <p className={styles.overdueValue}>{formatCurrency(filteredOverdueAmount)}</p>
              <span className={styles.overdueLabel}>{filteredOverdueItems.length} items</span>
            </div>

            <div className={styles.overdueCard}>
              <h3>Total em Juros</h3>
              <p className={styles.overdueValue} style={{ color: '#e67e22' }}>{formatCurrency(totalInterestAmount)}</p>
              <span className={styles.overdueLabel}>Acumulado</span>
            </div>

            <div className={styles.overdueCard}>
              <h3>Total com Juros</h3>
              <p className={styles.overdueValue} style={{ color: '#c0392b' }}>{formatCurrency(totalWithInterest)}</p>
              <span className={styles.overdueLabel}>Valor final</span>
            </div>

            <div className={styles.overdueCard}>
              <h3>Mais Antigo</h3>
              <p className={styles.overdueValue}>
                {filteredOverdueItems.length > 0 ? formatDate(filteredOverdueItems[filteredOverdueItems.length - 1].date) : 'N/A'}
              </p>
              <span className={styles.overdueLabel}>Desde esse período</span>
            </div>
          </div>

          {/* Gráficos de Atrasados */}
          {overduesByCategory.length > 0 && (
            <div className={styles.chartWrapper}>
              <h3>💼 Atrasados por Categoria</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={overduesByCategory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#c0392b" 
                    strokeWidth={3}
                    name="Valor"
                    dot={{ r: 5, fill: '#c0392b' }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {overduesByPriority.length > 0 && (
            <div className={styles.chartWrapper}>
              <h3>⚡ Atrasados por Prioridade</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={overduesByPriority}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#e67e22" 
                    strokeWidth={3}
                    name="Valor"
                    dot={{ r: 5, fill: '#e67e22' }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Tabela de Itens Atrasados */}
          {filteredOverdueItems.length > 0 && (
            <div className={styles.tableWrapper}>
              <h3>📋 Itens Atrasados</h3>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Data de Vencimento</th>
                    <th>Entrada em Atraso</th>
                    <th>Descrição</th>
                    <th>Categoria</th>
                    <th>Prioridade</th>
                    <th>Tipo</th>
                    <th>Parcelas Atrasadas</th>
                    <th>Valor Original</th>
                    <th>Juros</th>
                    <th>Total com Juros</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOverdueItems.map(item => {
                    const { overdueDate, overdueCount } = getOverdueInfo(item);
                    const interestAmount = calculateInterestAmount(item.id);
                    const totalValue = item.amount + interestAmount;
                    return (
                      <tr key={item.id}>
                        <td>{formatDate(item.date)}</td>
                        <td className={styles.overdueHighlight}>{formatDate(overdueDate)}</td>
                        <td>{item.description}</td>
                        <td>{item.category}</td>
                        <td>
                          {item.priority === 'alta' && '🔴 Alta'}
                          {item.priority === 'média' && '🟡 Média'}
                          {item.priority === 'baixa' && '🟢 Baixa'}
                        </td>
                        <td>
                          {item.type === 'entrada' ? '📥 Entrada' : '📤 Saída'}
                        </td>
                        <td className={styles.overdueCount}>
                          {overdueCount > 1 ? `${overdueCount} parcelas` : '1 parcela'}
                        </td>
                        <td className={item.type === 'entrada' ? styles.positive : styles.negative}>
                          {item.type === 'entrada' ? '+' : '-'} {formatCurrency(item.amount)}
                        </td>
                        <td className={styles.interest} style={{ color: interestAmount > 0 ? '#e67e22' : '#95a5a6' }}>
                          {interestAmount > 0 ? `+ ${formatCurrency(interestAmount)}` : '-'}
                        </td>
                        <td className={item.type === 'entrada' ? styles.positive : styles.negative} style={{ fontWeight: 'bold' }}>
                          {item.type === 'entrada' ? '+' : '-'} {formatCurrency(totalValue)}
                        </td>
                        <td>
                          <span className={styles.atrasadoBadge}>⏰ Atrasado</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* FORECAST */}
      {selectedMetric?.startsWith('forecast') && (
        <div className={styles.reportSection}>
          <h2>📈 Previsão de Fluxo de Caixa</h2>

          {/* Seletor de período */}
          <div className={styles.overdueTypeFilter}>
            <button
              className={`${styles.filterBtn} ${selectedMetric === 'forecast-7' ? styles.active : ''}`}
              onClick={() => handleMetricChange('forecast-7')}
            >
              📅 7 Dias
            </button>
            <button
              className={`${styles.filterBtn} ${selectedMetric === 'forecast-30' ? styles.active : ''}`}
              onClick={() => handleMetricChange('forecast-30')}
            >
              📅 30 Dias
            </button>
            <button
              className={`${styles.filterBtn} ${selectedMetric === 'forecast-365' ? styles.active : ''}`}
              onClick={() => handleMetricChange('forecast-365')}
            >
              📅 1 Ano
            </button>
          </div>
          
          {forecastChartData.length > 0 && (
            <div className={styles.chartWrapper}>
              <h3>Entradas vs Saídas Esperadas</h3>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={forecastChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 11 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="income" 
                    stroke="#27ae60" 
                    strokeWidth={2}
                    name="Entradas Esperadas"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="expense" 
                    stroke="#e74c3c" 
                    strokeWidth={2}
                    name="Saídas Esperadas"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Info de Forecast */}
          <div className={styles.forecastInfo}>
            <div className={styles.infoCard}>
              <h3>💰 Entradas Previstas</h3>
              <p className={styles.infoValue} style={{ color: '#27ae60' }}>
                {formatCurrency(forecastData.reduce((sum, d) => sum + d.expectedIncome, 0))}
              </p>
              <span style={{ fontSize: '0.85rem', color: '#666' }}>
                {forecastPeriod === 7 ? '7 dias' : forecastPeriod === 30 ? '30 dias' : '1 ano'}
              </span>
            </div>

            <div className={styles.infoCard}>
              <h3>💸 Saídas Previstas</h3>
              <p className={styles.infoValue} style={{ color: '#e74c3c' }}>
                {formatCurrency(forecastData.reduce((sum, d) => sum + d.expectedExpense, 0))}
              </p>
              <span style={{ fontSize: '0.85rem', color: '#666' }}>
                {forecastPeriod === 7 ? '7 dias' : forecastPeriod === 30 ? '30 dias' : '1 ano'}
              </span>
            </div>

            <div className={styles.infoCard}>
              <h3>💹 Saldo Líquido Esperado</h3>
              <p className={styles.infoValue} style={{ 
                color: (forecastData.reduce((sum, d) => sum + d.expectedIncome - d.expectedExpense, 0) >= 0 ? '#27ae60' : '#e74c3c') 
              }}>
                {formatCurrency(forecastData.reduce((sum, d) => sum + d.expectedIncome - d.expectedExpense, 0))}
              </p>
              <span style={{ fontSize: '0.85rem', color: '#666' }}>
                {forecastPeriod === 7 ? '7 dias' : forecastPeriod === 30 ? '30 dias' : '1 ano'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* PARCELAS */}
      {selectedMetric === 'installments' && (
        <div className={styles.reportSection}>
          <h2>📅 Acompanhamento de Parcelas</h2>

          {/* Filtro de tipo de parcela */}
          <div className={styles.overdueTypeFilter}>
            <button
              className={`${styles.filterBtn} ${installmentType === 'all' ? styles.active : ''}`}
              onClick={() => setInstallmentType('all')}
            >
              📊 Todas ({movements.filter(m => m.installments && m.installments.length > 0).length})
            </button>
            <button
              className={`${styles.filterBtn} ${installmentType === 'receivable' ? styles.active : ''}`}
              onClick={() => setInstallmentType('receivable')}
            >
              📥 A Receber ({movements.filter(m => m.installments && m.installments.length > 0 && m.type === 'entrada').length})
            </button>
            <button
              className={`${styles.filterBtn} ${installmentType === 'payable' ? styles.active : ''}`}
              onClick={() => setInstallmentType('payable')}
            >
              📤 A Pagar ({movements.filter(m => m.installments && m.installments.length > 0 && m.type === 'saida').length})
            </button>
          </div>

          {/* Filtro de status de conclusão */}
          <div className={styles.overdueTypeFilter}>
            <button
              className={`${styles.filterBtn} ${installmentStatus === 'all' ? styles.active : ''}`}
              onClick={() => setInstallmentStatus('all')}
            >
              📋 Todos os Status
            </button>
            <button
              className={`${styles.filterBtn} ${installmentStatus === 'completed' ? styles.active : ''}`}
              onClick={() => setInstallmentStatus('completed')}
            >
              ✅ Concluídas
            </button>
            <button
              className={`${styles.filterBtn} ${installmentStatus === 'ongoing' ? styles.active : ''}`}
              onClick={() => setInstallmentStatus('ongoing')}
            >
              🔄 Em Andamento
            </button>
          </div>

          {installmentStats.length === 0 ? (
            <p className={styles.empty}>Nenhuma parcela registrada</p>
          ) : (
            <div className={styles.installmentList}>
              {installmentStats.map(stat => (
                <div key={stat.id} className={styles.installmentItem}>
                  <div className={styles.installmentHeader}>
                    <div className={styles.installmentTitle}>
                      <h3>{stat.description}</h3>
                      <span className={stat.type === 'entrada' ? styles.positive : styles.negative}>
                        {stat.type === 'entrada' ? '📥' : '📤'} {formatCurrency(stat.amount)}
                      </span>
                    </div>
                    <span className={styles.percentage}>{stat.percentage}%</span>
                  </div>

                  <div className={styles.progressBar}>
                    <div 
                      className={styles.progressFill}
                      style={{ 
                        width: `${stat.percentage}%`,
                        backgroundColor: stat.percentage === 100 ? '#27ae60' : stat.percentage >= 50 ? '#f39c12' : '#e74c3c'
                      }}
                    />
                  </div>

                  <p className={styles.installmentStatus}>
                    {stat.paid} de {stat.total} parcelas pagas
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* PRÓXIMOS VENCIMENTOS */}
      {selectedMetric === 'nextdue' && (
        <div className={styles.reportSection}>
          <h2>⏰ Próximos Vencimentos (7 dias)</h2>

          {nextDueInstallments.length === 0 ? (
            <p className={styles.empty}>Nenhum vencimento nos próximos 7 dias</p>
          ) : (
            <div className={styles.nextDueList}>
              {nextDueInstallments.map((item, idx) => (
                <div key={idx} className={styles.dueItem}>
                  <div className={styles.dueHeader}>
                    <div className={styles.dueInfo}>
                      <h3>{item.movement.description}</h3>
                      <p className={styles.dueDate}>📅 Vence em: {formatDate(item.installment.dueDate)}</p>
                    </div>
                    <span className={`${styles.dueAmount} ${item.movement.type === 'entrada' ? styles.positive : styles.negative}`}>
                      {item.movement.type === 'entrada' ? '+' : '-'} {formatCurrency(item.installment.amount)}
                    </span>
                  </div>

                  <div className={styles.dueDetails}>
                    <span className={styles.dueCategory}>📁 {item.movement.category}</span>
                    <span className={styles.duePriority}>
                      {item.movement.priority === 'alta' ? '🔴 Alta' : item.movement.priority === 'média' ? '🟡 Média' : '🟢 Baixa'}
                    </span>
                    <span className={styles.dueInstallment}>
                      📊 Parcela {item.installment.number}/{item.installment.totalInstallments}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
