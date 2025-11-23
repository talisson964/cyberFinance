import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MovementForm, MovementHistory, SpreadsheetUpload } from '../components';
import styles from './MovementsPage.module.css';

type Tab = 'register' | 'import' | 'history';

export const MovementsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<Tab>('register');

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'register' || tabParam === 'import' || tabParam === 'history') {
      setActiveTab(tabParam as Tab);
    }
  }, [searchParams]);

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1>💳 Movimentações</h1>

        {/* Tabs/Submenus */}
        <div className={styles.tabsContainer}>
          <button
            className={`${styles.tab} ${activeTab === 'register' ? styles.active : ''}`}
            onClick={() => setActiveTab('register')}
          >
            📝 Registrar Movimentação
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'import' ? styles.active : ''}`}
            onClick={() => setActiveTab('import')}
          >
            📤 Importar Planilha
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'history' ? styles.active : ''}`}
            onClick={() => setActiveTab('history')}
          >
            📊 Histórico
          </button>
        </div>

        {/* Tab Content */}
        <div className={styles.tabContent}>
          {activeTab === 'register' && (
            <div className={styles.tabPane}>
              <MovementForm />
            </div>
          )}

          {activeTab === 'import' && (
            <div className={styles.tabPane}>
              <SpreadsheetUpload />
            </div>
          )}

          {activeTab === 'history' && (
            <div className={styles.tabPane}>
              <MovementHistory />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
