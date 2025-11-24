import React, { useMemo, useState, useEffect } from 'react';
import { useCaixa } from '../context/CaixaContextSupabase';
import { useDashboardSync } from '../hooks/useDashboardSync';
import { useSearchParams } from 'react-router-dom';
import { calculateStats, getMonthlySummary, getBestAndWorstMonths, getMonthName, formatCurrency, getSalesCountByMonth, calculateRealTimeFixedExpenses, getMovementCounts, calculatePaidFixedExpensesThisMonth, getPendingCount, getQuantityByCategory, getGainsByCategory, calculateMonthlyFixedIncome, getFixedIncomeVsExpenseEvolution, calculateEndOfMonthForecast, getMonthlyPayables, getMonthlyReceivables } from '../utils/calculations';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { showNotification } from './CustomNotification';
import { LoadingSpinner } from './LoadingSpinner';
import styles from './Dashboard.module.css';

const COLORS = {
  entrada: '#27ae60',
  saida: '#e74c3c',
  liquido: '#3498db',
  fixo: '#9b59b6',
  temporario: '#f39c12',
  atrasado: '#c0392b',
  pendente: '#e67e22',
  aReceber: '#16a085',
  aPagar: '#d35400',
};

export const Dashboard: React.FC = () => {
  const { transactions, movements, loading } = useCaixa();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') || 'dados';
  const [activeTab, setActiveTab] = useState<'dados' | 'graficos'>(tabParam as 'dados' | 'graficos');
  const [evolutionPeriod, setEvolutionPeriod] = useState<'1m' | '6m' | '1y' | '5y'>('6m');
  const [showDataManager, setShowDataManager] = useState(false);
  
  // IMPORTANTE: Todos os hooks devem estar antes de qualquer return condicional
  useDashboardSync(); // Sincronização em tempo real do histórico

  useEffect(() => {
    setActiveTab(tabParam as 'dados' | 'graficos');
  }, [tabParam]);

  // useMemo hooks
  const stats = useMemo(() => calculateStats(transactions, movements), [transactions, movements]);
  const monthlySummary = useMemo(() => getMonthlySummary(transactions, movements), [transactions, movements]);
  const bestAndWorst = useMemo(() => getBestAndWorstMonths(monthlySummary), [monthlySummary]);
  const realTimeFixedExpenses = useMemo(() => calculateRealTimeFixedExpenses(movements), [movements]);
  const movementCounts = useMemo(() => getMovementCounts(movements), [movements]);
  const paidFixedExpensesThisMonth = useMemo(() => calculatePaidFixedExpensesThisMonth(movements), [movements]);
  const pendingCount = useMemo(() => getPendingCount(movements), [movements]);
  const monthlyFixedIncome = useMemo(() => calculateMonthlyFixedIncome(movements), [movements]);
  const endOfMonthForecast = useMemo(() => calculateEndOfMonthForecast(movements), [movements]);
  const evolutionData = useMemo(() => getFixedIncomeVsExpenseEvolution(movements, evolutionPeriod), [movements, evolutionPeriod]);
  const monthlyPayables = useMemo(() => getMonthlyPayables(movements), [movements]);
  const monthlyReceivables = useMemo(() => getMonthlyReceivables(movements), [movements]);

  const categoryData = useMemo(() => getQuantityByCategory(transactions, movements), [transactions, movements]);
  const gainsByCategoryData = useMemo(() => getGainsByCategory(transactions, movements), [transactions, movements]);
  const classificacaoData = useMemo(() => [
    { name: 'Gasto Fixo', value: stats.fixoSaida },
    { name: 'Gasto Ocasional', value: stats.ocasionalSaida },
  ].filter(item => item.value > 0), [stats]);
  const salesCountData = useMemo(() => getSalesCountByMonth(transactions, movements), [transactions, movements]);

  const chartData = monthlySummary.map(m => ({
    ...m,
    month: getMonthName(m.month),
    monthKey: m.month,
  }));

  const evolutionChartData = evolutionData.map(item => ({
    month: getMonthName(item.month),
    receitas: item.rendaFixa,
    despesas: item.gastoFixo,
  }));

  // Agora sim, após TODOS os hooks, pode ter return condicional
  if (loading && movements.length === 0 && transactions.length === 0) {
    return <LoadingSpinner fullScreen size="large" message="Carregando dashboard..." />;
  }

  const handleTabChange = (tab: 'dados' | 'graficos') => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const handleClearData = async () => {
    // TODO: Implementar clearAllData no CaixaContextSupabase
    await showNotification('warning', 'Funcionalidade em desenvolvimento');
    /*
    if (window.confirm('⚠️ ATENÇÃO!\n\nVocê está prestes a deletar TODOS os dados do dashboard:\n- Todas as movimentações\n- Todas as transações\n- Todo o histórico\n\nEsta ação NÃO pode ser desfeita!\n\nDeseja continuar?')) {
      clearAllData();
      await showNotification('success', 'Todos os dados foram limpos com sucesso!');
    }
    */
  };

  const handleExportData = () => {
    // TODO: Implementar exportAllData no CaixaContextSupabase
    showNotification('warning', 'Funcionalidade em desenvolvimento');
    /*
    const data = exportAllData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup-sistema-caixa-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showNotification('success', 'Backup criado com sucesso!');
    */
  };

  const handleImportData = async () => {
    // TODO: Implementar importAllData no CaixaContextSupabase
    await showNotification('warning', 'Funcionalidade em desenvolvimento');
    /*
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = async (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const result = importAllData(text);
        
        if (result.success) {
          await showNotification('success', 'Dados importados com sucesso!');
          window.location.reload();
        } else {
          await showNotification('error', `Erro ao importar: ${result.error}`);
        }
      } catch (error) {
        await showNotification('error', 'Erro ao ler arquivo');
      }
    };
    
    input.click();
    */
  };

  // Verifica se há dados
  const hasData = transactions.length > 0 || movements.length > 0;

  return (
    <div className={styles.container}>
      <div className={styles.headerWithButton}>
        <h1>📊 Dashboard de Caixa</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          {hasData && (
            <>
              <button 
                onClick={() => setShowDataManager(!showDataManager)}
                className={styles.dataManagerButton}
                title="Gerenciar dados"
              >
                💾 Backup & Dados
              </button>
              <button 
                onClick={handleClearData}
                className={styles.clearButton}
                title="Limpar todos os dados e cache"
              >
                🗑️ Limpar Dados
              </button>
            </>
          )}
        </div>
      </div>

      {/* Modal de Gerenciamento de Dados */}
      {showDataManager && (
        <div className={styles.dataManagerModal}>
          <div className={styles.dataManagerContent}>
            <div className={styles.dataManagerHeader}>
              <h2>💾 Gerenciamento de Dados</h2>
              <button onClick={() => setShowDataManager(false)} className={styles.closeButton}>✕</button>
            </div>
            
            <div className={styles.dataManagerBody}>
              <div className={styles.dataSummary}>
                <h3>📊 Resumo dos Dados</h3>
                <div className={styles.summaryGrid}>
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>Movimentações:</span>
                    <span className={styles.summaryValue}>{movements.length}</span>
                  </div>
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>Transações:</span>
                    <span className={styles.summaryValue}>{transactions.length}</span>
                  </div>
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>Tamanho:</span>
                    <span className={styles.summaryValue}>{((JSON.stringify(movements).length + JSON.stringify(transactions).length) / 1024).toFixed(2)} KB</span>
                  </div>
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>Última atualização:</span>
                    <span className={styles.summaryValue}>{new Date().toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
              </div>

              <div className={styles.dataManagerActions}>
                <button onClick={handleExportData} className={styles.exportButton}>
                  📥 Exportar Backup
                  <span className={styles.buttonHint}>Salvar todos os dados em arquivo JSON</span>
                </button>
                <button onClick={handleImportData} className={styles.importButton}>
                  📤 Importar Backup
                  <span className={styles.buttonHint}>Restaurar dados de um arquivo de backup</span>
                </button>
              </div>

              <div className={styles.dataManagerWarning}>
                <strong>⚠️ Importante:</strong>
                <ul>
                  <li>Faça backup regular dos seus dados</li>
                  <li>O sistema usa localStorage (limite ~10MB)</li>
                  <li>Ao importar, os dados atuais serão substituídos</li>
                  <li>Os dados são salvos automaticamente a cada mudança</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mensagem quando não há dados */}
      {!hasData && (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📭</div>
          <h2>Nenhuma movimentação registrada</h2>
          <p>Comece adicionando uma movimentação no menu para ver os dados do dashboard</p>
        </div>
      )}

      {/* Conteúdo do Dashboard - Renderiza apenas se houver dados */}
      {hasData && (
        <>
          {/* Abas de Navegação */}
          <div className={styles.tabsContainer}>
            <button
              className={`${styles.tabButton} ${activeTab === 'dados' ? styles.active : ''}`}
              onClick={() => handleTabChange('dados')}
            >
              📊 Dados
            </button>
            <button
              className={`${styles.tabButton} ${activeTab === 'graficos' ? styles.active : ''}`}
              onClick={() => handleTabChange('graficos')}
            >
              📈 Gráficos
            </button>
          </div>

          {/* Aba DADOS */}
          {activeTab === 'dados' && (
            <div className={styles.tabContent}>
              {/* Cards de Resumo - Principales */}
              <div className={styles.statsGrid}>
        <div className={`${styles.card} ${styles.currentBalanceCard}`}>
          <div className={styles.cardHeader}>
            <h3>💳 Saldo Atual</h3>
          </div>
          <div className={`${styles.cardValue} ${stats.liquido >= 0 ? styles.positive : styles.negative}`}>
            {formatCurrency(stats.liquido)}
          </div>
          <p className={styles.balanceDescription}>Seu saldo disponível agora</p>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3>💰 Entrada Total</h3>
          </div>
          <div className={`${styles.cardValue} ${styles.positive}`}>
            {formatCurrency(stats.totalEntrada)}
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3>💸 Saída Total</h3>
          </div>
          <div className={`${styles.cardValue} ${styles.negative}`}>
            {formatCurrency(stats.totalSaida)}
          </div>
        </div>

        <div className={`${styles.card} ${styles.forecastCard}`}>
          <div className={styles.cardHeader}>
            <h3>🔮 Previsão Fim do Mês</h3>
            <span className={styles.forecastBadge}>📅</span>
          </div>
          <div className={`${styles.cardValue} ${endOfMonthForecast >= 0 ? styles.positive : styles.negative}`}>
            {formatCurrency(endOfMonthForecast)}
          </div>
          <p className={styles.forecastDescription}>Saldo estimado considerando entradas, saídas e compromissos fixos</p>
        </div>
      </div>

      {/* Cards de Status de Pagamento */}
      <div className={styles.paymentStatusGrid}>
        <div className={styles.statusCard}>
          <div className={styles.statusHeader}>
            <h3>🔴 Atrasado</h3>
            <span className={styles.overdueIcon}>!</span>
          </div>
          <div className={`${styles.statusValue} ${styles.overdueColor}`}>
            {formatCurrency(stats.atrasado || 0)}
          </div>
          <p className={styles.statusDesc}>Valores vencidos</p>
        </div>

        <div className={styles.statusCard}>
          <div className={styles.statusHeader}>
            <h3>🟡 Pendente</h3>
            <span className={styles.pendingIcon}>⏳</span>
          </div>
          <div className={`${styles.statusValue} ${styles.pendingColor}`}>
            {formatCurrency(stats.pendente || 0)}
          </div>
          <p className={styles.statusDesc}>A vencer</p>
        </div>

        <div className={styles.statusCard}>
          <div className={styles.statusHeader}>
            <h3>📅 A Pagar Este Mês</h3>
            <span className={styles.payIcon}>↑</span>
          </div>
          <div className={`${styles.statusValue} ${styles.negative}`}>
            {formatCurrency(monthlyPayables)}
          </div>
          <p className={styles.statusDesc}>Saídas previstas neste mês</p>
        </div>

        <div className={styles.statusCard}>
          <div className={styles.statusHeader}>
            <h3>📅 A Receber Este Mês</h3>
            <span className={styles.receiveIcon}>↓</span>
          </div>
          <div className={`${styles.statusValue} ${styles.positive}`}>
            {formatCurrency(monthlyReceivables)}
          </div>
          <p className={styles.statusDesc}>Entradas previstas neste mês</p>
        </div>

        <div className={styles.statusCard}>
          <div className={styles.statusHeader}>
            <h3>🟢 A Receber (Total)</h3>
            <span className={styles.receiveIcon}>↓</span>
          </div>
          <div className={`${styles.statusValue} ${styles.positive}`}>
            {formatCurrency(stats.aReceber || 0)}
          </div>
          <p className={styles.statusDesc}>Total de entradas esperadas</p>
        </div>

        <div className={styles.statusCard}>
          <div className={styles.statusHeader}>
            <h3>🔵 A Pagar (Total)</h3>
            <span className={styles.payIcon}>↑</span>
          </div>
          <div className={`${styles.statusValue} ${styles.negative}`}>
            {formatCurrency(stats.aPagar || 0)}
          </div>
          <p className={styles.statusDesc}>Total de saídas esperadas</p>
        </div>
      </div>

      {/* Cards de Gasto Fixo/Temporário */}
      <div className={styles.classificationGrid}>
        <div className={styles.classificationCard}>
          <div className={styles.classificationHeader}>
            <h3>⏳ Gasto Fixo em Tempo Real</h3>
            <span className={styles.realtimeBadge}>Ativo Agora</span>
          </div>
          <div className={`${styles.classificationValue} ${styles.realtimeColor}`}>
            {formatCurrency(realTimeFixedExpenses)}
          </div>
          <p className={styles.classificationDesc}>Gastos fixos ativos considerando duração</p>
        </div>

        <div className={styles.classificationCard}>
          <div className={styles.classificationHeader}>
            <h3>✅ Gasto Fixo Pago Este Mês</h3>
            <span className={styles.paidMonthBadge}>Este Mês</span>
          </div>
          <div className={`${styles.classificationValue} ${styles.paidMonthColor}`}>
            {formatCurrency(paidFixedExpensesThisMonth)}
          </div>
          <p className={styles.classificationDesc}>Gastos fixos já pagos neste mês</p>
        </div>

        <div className={styles.classificationCard}>
          <div className={styles.classificationHeader}>
            <h3>⏱️ Gasto Ocasional</h3>
            <span className={styles.ocasionalBadge}>Ocasional</span>
          </div>
          <div className={`${styles.classificationValue} ${styles.ocasionalColor}`}>
            {formatCurrency(stats.ocasionalSaida)}
          </div>
          <p className={styles.classificationDesc}>Despesas não recorrentes</p>
        </div>

        {pendingCount > 0 && (
          <div className={styles.classificationCard}>
            <div className={styles.classificationHeader}>
              <h3>⏳ Pendências</h3>
              <span className={styles.pendingBadge}>A confirmar</span>
            </div>
            <div className={`${styles.classificationValue} ${styles.pendingCountColor}`}>
              {pendingCount}
            </div>
            <p className={styles.classificationDesc}>Movimentações pendentes de confirmação</p>
          </div>
        )}

        <div className={styles.classificationCard}>
          <div className={styles.classificationHeader}>
            <h3>📊 Renda Fixa Mensal</h3>
            <span className={styles.fixedIncomeBadge}>Ativo Agora</span>
          </div>
          <div className={`${styles.classificationValue} ${styles.fixedIncomeColor}`}>
            {formatCurrency(monthlyFixedIncome)}
          </div>
          <p className={styles.classificationDesc}>Renda fixa ativa considerando duração</p>
        </div>
      </div>

      {/* Cards de Quantidade de Registros */}
      <div className={styles.recordCountGrid}>
        <div className={styles.recordCard}>
          <div className={styles.recordHeader}>
            <h3>📥 Total de Entradas</h3>
            <span className={styles.recordBadge}>Registros</span>
          </div>
          <div className={`${styles.recordValue} ${styles.positive}`}>
            {movementCounts.entradas}
          </div>
          <p className={styles.recordDesc}>Número de movimentações de entrada</p>
        </div>

        <div className={styles.recordCard}>
          <div className={styles.recordHeader}>
            <h3>📤 Total de Saídas</h3>
            <span className={styles.recordBadge}>Registros</span>
          </div>
          <div className={`${styles.recordValue} ${styles.negative}`}>
            {movementCounts.saidas}
          </div>
          <p className={styles.recordDesc}>Número de movimentações de saída</p>
        </div>

        <div className={styles.recordCard}>
          <div className={styles.recordHeader}>
            <h3>📊 Total de Movimentações</h3>
            <span className={styles.recordBadge}>Registros</span>
          </div>
          <div className={`${styles.recordValue} ${styles.info}`}>
            {movementCounts.entradas + movementCounts.saidas}
          </div>
          <p className={styles.recordDesc}>Todas as movimentações registradas</p>
        </div>
      </div>

      {/* Melhores e Piores Meses */}
      <div className={styles.monthsComparison}>
        <div className={styles.monthCard}>
          <h3>🏆 Mês com Maior Entrada</h3>
          {bestAndWorst.bestMonth ? (
            <>
              <p className={styles.monthName}>{getMonthName(bestAndWorst.bestMonth)}</p>
              <p className={styles.monthValue}>{formatCurrency(bestAndWorst.bestValue)}</p>
            </>
          ) : (
            <p>Sem dados</p>
          )}
        </div>

        <div className={styles.monthCard}>
          <h3>⚠️ Mês com Maior Saída</h3>
          {bestAndWorst.worstMonth ? (
            <>
              <p className={styles.monthName}>{getMonthName(bestAndWorst.worstMonth)}</p>
              <p className={styles.monthValue}>{formatCurrency(bestAndWorst.worstValue)}</p>
            </>
          ) : (
            <p>Sem dados</p>
          )}
        </div>
      </div>
            </div>
          )}

          {/* Aba GRÁFICOS */}
          {activeTab === 'graficos' && (
            <div className={styles.tabContent}>
      {/* Gráficos */}
      <div className={styles.chartsContainer}>
        {/* Gráfico de Evolução - Renda Fixa vs Gastos Fixos */}
        {evolutionChartData.length > 0 && (
          <div className={styles.chartWrapper}>
            <div className={styles.chartHeader}>
              <h3>📊 Evolução: Renda Fixa vs Gastos Fixos</h3>
              <div className={styles.periodButtons}>
                <button
                  className={`${styles.periodBtn} ${evolutionPeriod === '1m' ? styles.active : ''}`}
                  onClick={() => setEvolutionPeriod('1m')}
                >
                  1 Mês
                </button>
                <button
                  className={`${styles.periodBtn} ${evolutionPeriod === '6m' ? styles.active : ''}`}
                  onClick={() => setEvolutionPeriod('6m')}
                >
                  6 Meses
                </button>
                <button
                  className={`${styles.periodBtn} ${evolutionPeriod === '1y' ? styles.active : ''}`}
                  onClick={() => setEvolutionPeriod('1y')}
                >
                  1 Ano
                </button>
                <button
                  className={`${styles.periodBtn} ${evolutionPeriod === '5y' ? styles.active : ''}`}
                  onClick={() => setEvolutionPeriod('5y')}
                >
                  5 Anos
                </button>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={evolutionChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis
                  dataKey="month"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  tick={{ fontSize: 12, fill: '#475569' }}
                />
                <YAxis 
                  tickFormatter={(value) => formatCurrency(Math.round(value as number))}
                  tick={{ fontSize: 12, fill: '#475569' }}
                />
                <Tooltip
                  formatter={(value) => formatCurrency(Math.round(value as number))}
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '2px solid var(--accent-color)',
                    borderRadius: '8px',
                    boxShadow: 'var(--shadow-md)'
                  }}
                />
                <Legend 
                  wrapperStyle={{ paddingTop: '20px' }}
                  iconType="line"
                />
                <Line 
                  type="monotone" 
                  dataKey="Renda Fixa" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  dot={{ r: 5, fill: '#10b981' }}
                  activeDot={{ r: 7, fill: '#10b981' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="Gastos Fixos" 
                  stroke="#e74c3c" 
                  strokeWidth={3}
                  dot={{ r: 5, fill: '#e74c3c' }}
                  activeDot={{ r: 7, fill: '#e74c3c' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Gráfico de Linhas - Entradas vs Saídas por Mês */}
        {chartData.length > 0 && (
          <div className={styles.chartWrapper}>
            <h3>📊 Entradas vs Saídas por Mês</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="month"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  tick={{ fontSize: 12 }}
                />
                <YAxis tickFormatter={(value) => formatCurrency(Math.round(value as number))} />
                <Tooltip
                  formatter={(value) => formatCurrency(Math.round(value as number))}
                  contentStyle={{ backgroundColor: '#f5f5f5', border: '1px solid #ddd' }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="entrada" 
                  stroke={COLORS.entrada} 
                  name="Entrada"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="saida" 
                  stroke={COLORS.saida} 
                  name="Saída"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Gráfico de Linha - Evolução Líquida */}
        {chartData.length > 0 && (
          <div className={styles.chartWrapper}>
            <h3>📈 Evolução do Líquido</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="month"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  tick={{ fontSize: 12 }}
                />
                <YAxis tickFormatter={(value) => formatCurrency(Math.round(value as number))} />
                <Tooltip
                  formatter={(value) => formatCurrency(Math.round(value as number))}
                  contentStyle={{ backgroundColor: '#f5f5f5', border: '1px solid #ddd' }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="liquido"
                  stroke={COLORS.liquido}
                  strokeWidth={2}
                  name="Líquido"
                  dot={{ r: 5 }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Gráficos de Pizza lado a lado: Gasto Fixo vs Temporário E Quantidade por Categorias */}
        <div className={styles.sideBySideCharts}>
          {/* Gráfico de Pizza - Gasto Fixo vs Temporário */}
          {classificacaoData.length > 0 && (
            <div className={styles.chartWrapper}>
              <h3>🎯 Gasto Fixo vs Temporário</h3>
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={classificacaoData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, value, percent }) => `${name}: ${formatCurrency(value)} (${((percent || 0) * 100).toFixed(0)}%)`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    <Cell fill={COLORS.fixo} />
                    <Cell fill={COLORS.temporario} />
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(Math.round(value as number))} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Gráfico de Pizza - Quantidade por Categorias */}
          {categoryData.length > 0 && (
            <div className={styles.chartWrapper}>
              <h3>📊 Quantidade por Categorias</h3>
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={Object.values(COLORS)[index % Object.values(COLORS).length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => String(value as number)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Gráfico de Linhas - Quantidade de Vendas por Mês */}
        {salesCountData.length > 0 && (
          <div className={styles.chartWrapper}>
            <h3>📊 Quantidade de Vendas por Mês</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salesCountData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="monthName"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  tick={{ fontSize: 12 }}
                />
                <YAxis tickFormatter={(value) => String(Math.round(value as number))} />
                <Tooltip
                  formatter={(value) => String(Math.round(value as number))}
                  contentStyle={{ backgroundColor: '#f5f5f5', border: '1px solid #ddd' }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#10b981" 
                  name="Quantidade de Vendas"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Gráfico de Pizza - Ganhos por Categorias */}
        {gainsByCategoryData.length > 0 && (
          <div className={styles.chartWrapper}>
            <h3>💰 Ganhos por Categorias</h3>
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={gainsByCategoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={({ name, value }) => `${name}: ${formatCurrency(value)}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {gainsByCategoryData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={Object.values(COLORS)[index % Object.values(COLORS).length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value as number)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )}
        </>
      )}
    </div>
  );
};

export default Dashboard;
