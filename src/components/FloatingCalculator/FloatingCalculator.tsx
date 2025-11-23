import React, { useState } from 'react';
import { X } from 'lucide-react';
import styles from './FloatingCalculator.module.css';

export const FloatingCalculator: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [display, setDisplay] = useState('0');
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [waitingForNewValue, setWaitingForNewValue] = useState(false);

  const handleNumber = (num: string) => {
    if (waitingForNewValue) {
      setDisplay(num);
      setWaitingForNewValue(false);
    } else {
      setDisplay(display === '0' ? num : display + num);
    }
  };

  const handleDecimal = () => {
    if (waitingForNewValue) {
      setDisplay('0.');
      setWaitingForNewValue(false);
    } else if (!display.includes('.')) {
      setDisplay(display + '.');
    }
  };

  const handleOperation = (op: string) => {
    const currentValue = parseFloat(display);

    if (previousValue === null) {
      setPreviousValue(currentValue);
    } else if (operation) {
      const result = calculate(previousValue, currentValue, operation);
      setDisplay(String(result));
      setPreviousValue(result);
    }

    setOperation(op);
    setWaitingForNewValue(true);
  };

  const calculate = (prev: number, current: number, op: string): number => {
    switch (op) {
      case '+':
        return prev + current;
      case '-':
        return prev - current;
      case '×':
        return prev * current;
      case '÷':
        return prev / current;
      case '%':
        return (prev * current) / 100;
      default:
        return current;
    }
  };

  const handleEquals = () => {
    if (operation && previousValue !== null) {
      const currentValue = parseFloat(display);
      const result = calculate(previousValue, currentValue, operation);
      setDisplay(String(result));
      setPreviousValue(null);
      setOperation(null);
      setWaitingForNewValue(true);
    }
  };

  const handleClear = () => {
    setDisplay('0');
    setPreviousValue(null);
    setOperation(null);
    setWaitingForNewValue(false);
  };

  const handleBackspace = () => {
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay('0');
    }
  };

  return (
    <div className={styles.calculatorContainer}>
      {/* Botão Flutuante */}
      <button
        className={styles.floatingBtn}
        onClick={() => setIsOpen(!isOpen)}
        title="Calculadora"
      >
        🧮
      </button>

      {/* Modal da Calculadora */}
      {isOpen && (
        <div className={styles.calculatorModal}>
          <div className={styles.header}>
            <h3>Calculadora</h3>
            <button
              className={styles.closeBtn}
              onClick={() => setIsOpen(false)}
            >
              <X size={20} />
            </button>
          </div>

          <div className={styles.display}>
            {display}
          </div>

          <div className={styles.buttons}>
            <button className={`${styles.btn} ${styles.btnDanger}`} onClick={handleClear}>
              C
            </button>
            <button className={`${styles.btn} ${styles.btnDanger}`} onClick={handleBackspace}>
              ⌫
            </button>
            <button className={`${styles.btn} ${styles.btnOperation}`} onClick={() => handleOperation('%')}>
              %
            </button>
            <button className={`${styles.btn} ${styles.btnOperation}`} onClick={() => handleOperation('÷')}>
              ÷
            </button>

            <button className={styles.btn} onClick={() => handleNumber('7')}>
              7
            </button>
            <button className={styles.btn} onClick={() => handleNumber('8')}>
              8
            </button>
            <button className={styles.btn} onClick={() => handleNumber('9')}>
              9
            </button>
            <button className={`${styles.btn} ${styles.btnOperation}`} onClick={() => handleOperation('×')}>
              ×
            </button>

            <button className={styles.btn} onClick={() => handleNumber('4')}>
              4
            </button>
            <button className={styles.btn} onClick={() => handleNumber('5')}>
              5
            </button>
            <button className={styles.btn} onClick={() => handleNumber('6')}>
              6
            </button>
            <button className={`${styles.btn} ${styles.btnOperation}`} onClick={() => handleOperation('-')}>
              −
            </button>

            <button className={styles.btn} onClick={() => handleNumber('1')}>
              1
            </button>
            <button className={styles.btn} onClick={() => handleNumber('2')}>
              2
            </button>
            <button className={styles.btn} onClick={() => handleNumber('3')}>
              3
            </button>
            <button className={`${styles.btn} ${styles.btnOperation}`} onClick={() => handleOperation('+')}>
              +
            </button>

            <button className={`${styles.btn} ${styles.btn0}`} onClick={() => handleNumber('0')}>
              0
            </button>
            <button className={styles.btn} onClick={handleDecimal}>
              .
            </button>
            <button className={`${styles.btn} ${styles.btnEquals}`} onClick={handleEquals}>
              =
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
