import React from 'react';
import { TransactionForm, TransactionList } from '../components';
import styles from './TransactionsPage.module.css';

export const TransactionsPage: React.FC = () => {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <TransactionForm />
        <TransactionList />
      </div>
    </div>
  );
};
