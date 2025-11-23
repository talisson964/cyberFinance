import React, { useState, useMemo } from 'react';
import { formatCurrency } from '../../utils/calculations';
import { FloatingCalculator } from '../FloatingCalculator';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import styles from './Tools.module.css';

export const InvestmentForecast: React.FC = () => {
  const [initialAmount, setInitialAmount] = useState<number>(10000);
  const [monthlyContribution, setMonthlyContribution] = useState<number>(500);
  const [annualRate, setAnnualRate] = useState<number>(8);
  const [months, setMonths] = useState<number>(60);

  const chartData = useMemo(() => {
    const data = [];
    const monthlyRate = annualRate / 100 / 12;
    let balance = initialAmount;

    for (let i = 0; i <= months; i++) {
      data.push({
        month: i,
        balance: Math.round(balance * 100) / 100,
      });

      if (i < months) {
        balance = balance * (1 + monthlyRate) + monthlyContribution;
      }
    }

    return data;
  }, [initialAmount, monthlyContribution, annualRate, months]);

  const finalBalance = chartData[chartData.length - 1]?.balance || 0;
  const totalContributed = initialAmount + monthlyContribution * months;
  const totalGains = finalBalance - totalContributed;

  return (
    <div className={styles.toolContainer}>
      <FloatingCalculator />
      <h1>📈 Previsão de Investimentos</h1>

      <div className={styles.form}>
        <div className={styles.formGroup}>
          <label>Capital Inicial (R$)</label>
          <input
            type="number"
            value={initialAmount}
            onChange={(e) => setInitialAmount(parseFloat(e.target.value) || 0)}
            step="100"
            min="0"
          />
        </div>

        <div className={styles.formGroup}>
          <label>Contribuição Mensal (R$)</label>
          <input
            type="number"
            value={monthlyContribution}
            onChange={(e) => setMonthlyContribution(parseFloat(e.target.value) || 0)}
            step="50"
            min="0"
          />
        </div>

        <div className={styles.formGroup}>
          <label>Taxa Anual de Retorno (% a.a.)</label>
          <input
            type="number"
            value={annualRate}
            onChange={(e) => setAnnualRate(parseFloat(e.target.value) || 0)}
            step="0.1"
            min="0"
          />
        </div>

        <div className={styles.formGroup}>
          <label>Período (Meses)</label>
          <input
            type="number"
            value={months}
            onChange={(e) => setMonths(parseFloat(e.target.value) || 1)}
            step="1"
            min="1"
          />
        </div>
      </div>

      {chartData.length > 0 && (
        <div className={styles.chartWrapper}>
          <h3>Evolução do Investimento</h3>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="month"
                label={{ value: 'Meses', position: 'insideBottomRight', offset: -10 }}
              />
              <YAxis tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(value) => formatCurrency(value as number)} />
              <Legend />
              <Line
                type="monotone"
                dataKey="balance"
                stroke="#27ae60"
                strokeWidth={2}
                name="Saldo da Carteira"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className={styles.results}>
        <div className={styles.resultCard}>
          <h3>Capital Inicial</h3>
          <p className={styles.value}>{formatCurrency(initialAmount)}</p>
        </div>

        <div className={styles.resultCard}>
          <h3>Total Contribuído</h3>
          <p className={styles.value}>
            {formatCurrency(monthlyContribution * months)}
          </p>
        </div>

        <div className={styles.resultCard}>
          <h3>Ganhos com Juros</h3>
          <p className={styles.value} style={{ color: '#27ae60' }}>
            + {formatCurrency(totalGains)}
          </p>
        </div>

        <div className={styles.resultCard}>
          <h3>Saldo Final</h3>
          <p className={styles.value} style={{ color: '#2c3e50', fontWeight: 'bold' }}>
            {formatCurrency(finalBalance)}
          </p>
        </div>

        <div className={styles.resultCard}>
          <h3>Retorno Percentual</h3>
          <p className={styles.value} style={{ color: '#3498db' }}>
            {totalContributed > 0 ? ((totalGains / totalContributed) * 100).toFixed(2) : '0.00'}%
          </p>
        </div>

        <div className={styles.resultCard}>
          <h3>Taxa Mensal Efetiva</h3>
          <p className={styles.value} style={{ color: '#9b59b6' }}>
            {(annualRate / 12).toFixed(3)}%
          </p>
        </div>
      </div>

      <div className={styles.infoBox}>
        <h4>ℹ️ Como Funciona:</h4>
        <ul>
          <li>Este simulador calcula a evolução de um investimento com aportes mensais constantes</li>
          <li>Os juros são capitalizados mensalmente sobre o saldo anterior</li>
          <li>Fórmula: Nova Balance = Balance Anterior × (1 + Taxa Mensal) + Aporte Mensal</li>
          <li>O gráfico mostra a evolução ao longo do tempo</li>
        </ul>
      </div>
    </div>
  );
};
