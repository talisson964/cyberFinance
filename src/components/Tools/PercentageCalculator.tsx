import React, { useState } from 'react';
import { formatCurrency } from '../../utils/calculations';
import { FloatingCalculator } from '../FloatingCalculator';
import styles from './Tools.module.css';

export const PercentageCalculator: React.FC = () => {
  const [value, setValue] = useState<number>(100);
  const [percentage, setPercentage] = useState<number>(10);
  const [calculationType, setCalculationType] = useState<'percent-of' | 'what-percent' | 'add-percent' | 'subtract-percent'>('percent-of');

  const calculate = () => {
    switch (calculationType) {
      case 'percent-of':
        return (value * percentage) / 100;
      case 'what-percent':
        return (percentage / value) * 100;
      case 'add-percent':
        return value + (value * percentage) / 100;
      case 'subtract-percent':
        return value - (value * percentage) / 100;
      default:
        return 0;
    }
  };

  const result = calculate();

  const getDescription = () => {
    switch (calculationType) {
      case 'percent-of':
        return `${percentage}% de ${formatCurrency(value)}`;
      case 'what-percent':
        return `Que percentual é ${formatCurrency(percentage)} de ${formatCurrency(value)}`;
      case 'add-percent':
        return `${formatCurrency(value)} + ${percentage}%`;
      case 'subtract-percent':
        return `${formatCurrency(value)} - ${percentage}%`;
      default:
        return '';
    }
  };

  return (
    <div className={styles.toolContainer}>
      <FloatingCalculator />
      <h1>🧮 Calculadora de Percentual</h1>

      <div className={styles.form}>
        <div className={styles.formGroup}>
          <label>Tipo de Cálculo</label>
          <select
            value={calculationType}
            onChange={(e) => setCalculationType(e.target.value as any)}
            className={styles.fullWidthSelect}
          >
            <option value="percent-of">Quanto é X% de Y?</option>
            <option value="what-percent">Que % é X de Y?</option>
            <option value="add-percent">Adicionar Percentual</option>
            <option value="subtract-percent">Subtrair Percentual</option>
          </select>
        </div>

        <div className={styles.formGroup}>
          <label>Valor Base (R$)</label>
          <input
            type="number"
            value={value}
            onChange={(e) => setValue(parseFloat(e.target.value) || 0)}
            step="0.01"
          />
        </div>

        <div className={styles.formGroup}>
          <label>{calculationType === 'what-percent' ? 'Valor de Referência (R$)' : 'Percentual (%)'}</label>
          <input
            type="number"
            value={percentage}
            onChange={(e) => setPercentage(parseFloat(e.target.value) || 0)}
            step={calculationType === 'what-percent' ? '0.01' : '0.1'}
          />
        </div>
      </div>

      <div className={styles.calculationDisplay}>
        <h3>{getDescription()}</h3>
        <div className={styles.resultBox}>
          <p className={styles.resultLabel}>Resultado:</p>
          <p className={styles.resultValue}>{formatCurrency(result)}</p>
        </div>
      </div>

      <div className={styles.results}>
        {calculationType === 'percent-of' && (
          <>
            <div className={styles.resultCard}>
              <h3>Valor Base</h3>
              <p className={styles.value}>{formatCurrency(value)}</p>
            </div>
            <div className={styles.resultCard}>
              <h3>Percentual</h3>
              <p className={styles.value}>{percentage}%</p>
            </div>
            <div className={styles.resultCard}>
              <h3>Resultado</h3>
              <p className={styles.value} style={{ color: '#27ae60' }}>
                {formatCurrency(result)}
              </p>
            </div>
          </>
        )}

        {calculationType === 'what-percent' && (
          <>
            <div className={styles.resultCard}>
              <h3>Valor Base</h3>
              <p className={styles.value}>{formatCurrency(value)}</p>
            </div>
            <div className={styles.resultCard}>
              <h3>Valor de Referência</h3>
              <p className={styles.value}>{formatCurrency(percentage)}</p>
            </div>
            <div className={styles.resultCard}>
              <h3>Percentual</h3>
              <p className={styles.value} style={{ color: '#3498db' }}>
                {result.toFixed(2)}%
              </p>
            </div>
          </>
        )}

        {(calculationType === 'add-percent' || calculationType === 'subtract-percent') && (
          <>
            <div className={styles.resultCard}>
              <h3>Valor Original</h3>
              <p className={styles.value}>{formatCurrency(value)}</p>
            </div>
            <div className={styles.resultCard}>
              <h3>{calculationType === 'add-percent' ? 'Adicionado' : 'Subtraído'}</h3>
              <p className={styles.value}>
                {calculationType === 'add-percent' ? '+' : '-'} {formatCurrency(Math.abs(result - value))}
              </p>
            </div>
            <div className={styles.resultCard}>
              <h3>Valor Final</h3>
              <p className={styles.value} style={{ color: calculationType === 'add-percent' ? '#27ae60' : '#e74c3c' }}>
                {formatCurrency(result)}
              </p>
            </div>
          </>
        )}
      </div>

      <div className={styles.infoBox}>
        <h4>ℹ️ Fórmulas Utilizadas:</h4>
        <ul>
          <li><strong>Quanto é X% de Y?</strong> Resultado = Y × (X / 100)</li>
          <li><strong>Que % é X de Y?</strong> Resultado = (X / Y) × 100</li>
          <li><strong>Adicionar %:</strong> Resultado = Y + (Y × X / 100)</li>
          <li><strong>Subtrair %:</strong> Resultado = Y - (Y × X / 100)</li>
        </ul>
      </div>
    </div>
  );
};
