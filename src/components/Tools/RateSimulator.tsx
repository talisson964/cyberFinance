import React, { useState } from 'react';
import { formatCurrency } from '../../utils/calculations';
import { FloatingCalculator } from '../FloatingCalculator';
import styles from './Tools.module.css';

export const RateSimulator: React.FC = () => {
  const [principal, setPrincipal] = useState<number>(1000);
  const [rate, setRate] = useState<number>(5);
  const [period, setPeriod] = useState<number>(12);
  const [rateType, setRateType] = useState<'simple' | 'compound'>('compound');
  const [periodType, setPeriodType] = useState<'months' | 'years'>('months');

  const calculateInterest = () => {
    const monthlyRate = rate / 100 / 12;
    const periods = periodType === 'years' ? period * 12 : period;

    if (rateType === 'simple') {
      const interest = principal * (rate / 100) * (periods / 12);
      return { interest, total: principal + interest };
    } else {
      const total = principal * Math.pow(1 + monthlyRate, periods);
      return { interest: total - principal, total };
    }
  };

  const result = calculateInterest();

  return (
    <div className={styles.toolContainer}>
      <FloatingCalculator />
      <h1>🧮 Simulador de Taxa</h1>

      <div className={styles.form}>
        <div className={styles.formGroup}>
          <label>Capital Inicial (R$)</label>
          <input
            type="number"
            value={principal}
            onChange={(e) => setPrincipal(parseFloat(e.target.value) || 0)}
            min="0"
            step="100"
          />
        </div>

        <div className={styles.formGroup}>
          <label>Taxa de Juros (% a.a.)</label>
          <input
            type="number"
            value={rate}
            onChange={(e) => setRate(parseFloat(e.target.value) || 0)}
            min="0"
            step="0.1"
          />
        </div>

        <div className={styles.formGroup}>
          <label>Período</label>
          <div className={styles.inputRow}>
            <input
              type="number"
              value={period}
              onChange={(e) => setPeriod(parseFloat(e.target.value) || 0)}
              min="1"
            />
            <select value={periodType} onChange={(e) => setPeriodType(e.target.value as 'months' | 'years')}>
              <option value="months">Meses</option>
              <option value="years">Anos</option>
            </select>
          </div>
        </div>

        <div className={styles.formGroup}>
          <label>Tipo de Juros</label>
          <div className={styles.buttonRow}>
            <button
              className={`${styles.typeBtn} ${rateType === 'simple' ? styles.active : ''}`}
              onClick={() => setRateType('simple')}
            >
              Simples
            </button>
            <button
              className={`${styles.typeBtn} ${rateType === 'compound' ? styles.active : ''}`}
              onClick={() => setRateType('compound')}
            >
              Composto
            </button>
          </div>
        </div>
      </div>

      <div className={styles.results}>
        <div className={styles.resultCard}>
          <h3>Capital Inicial</h3>
          <p className={styles.value}>{formatCurrency(principal)}</p>
        </div>

        <div className={styles.resultCard}>
          <h3>Juros Acumulados</h3>
          <p className={styles.value} style={{ color: '#27ae60' }}>
            + {formatCurrency(result.interest)}
          </p>
        </div>

        <div className={styles.resultCard}>
          <h3>Montante Final</h3>
          <p className={styles.value} style={{ color: '#2c3e50', fontWeight: 'bold' }}>
            {formatCurrency(result.total)}
          </p>
        </div>

        <div className={styles.resultCard}>
          <h3>Rentabilidade</h3>
          <p className={styles.value} style={{ color: '#3498db' }}>
            {((result.interest / principal) * 100).toFixed(2)}%
          </p>
        </div>
      </div>

      <div className={styles.infoBox}>
        <h4>ℹ️ Fórmulas Utilizadas:</h4>
        <ul>
          <li><strong>Juros Simples:</strong> J = P × i × t</li>
          <li><strong>Juros Compostos:</strong> M = P × (1 + i)^t</li>
          <li>P = Capital Principal | i = Taxa de Juros | t = Período</li>
        </ul>
      </div>
    </div>
  );
};
