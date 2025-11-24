import React, { useState, useEffect } from 'react';
import { useCaixa } from '../context/CaixaContextSupabase';
import styles from './MigrationNotice.module.css';

export const MigrationNotice: React.FC = () => {
  const { migrationStatus, migrateFromLocalStorage } = useCaixa();
  const [showNotice, setShowNotice] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Verificar se há dados no localStorage para migrar
    const hasLocalData = 
      localStorage.getItem('caixa_movements') || 
      localStorage.getItem('caixa_transactions');
    
    const migrationCompleted = localStorage.getItem('migration_completed');
    
    if (hasLocalData && migrationCompleted !== 'true') {
      setShowNotice(true);
    }
  }, []);

  const handleMigrate = async () => {
    setMigrating(true);
    setError(null);
    
    try {
      const result = await migrateFromLocalStorage();
      
      if (result.success) {
        setTimeout(() => {
          setShowNotice(false);
        }, 3000);
      } else {
        setError(result.error || 'Erro desconhecido na migração');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao migrar dados');
    } finally {
      setMigrating(false);
    }
  };

  const handleDismiss = () => {
    setShowNotice(false);
  };

  if (!showNotice || migrationStatus.completed) {
    return null;
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.notice}>
        <div className={styles.header}>
          <span className={styles.icon}>🔄</span>
          <h2>Migração de Dados Disponível</h2>
        </div>
        
        <div className={styles.content}>
          <p>
            Detectamos que você possui dados salvos localmente no navegador. 
            Agora você pode migrar esses dados para o banco de dados Supabase, 
            garantindo:
          </p>
          
          <ul className={styles.benefits}>
            <li>🔒 <strong>Segurança:</strong> Dados protegidos no banco de dados</li>
            <li>☁️ <strong>Sincronização:</strong> Acesse de qualquer dispositivo</li>
            <li>💾 <strong>Backup automático:</strong> Nunca perca seus dados</li>
            <li>🚀 <strong>Performance:</strong> Melhor desempenho e escalabilidade</li>
          </ul>

          {error && (
            <div className={styles.error}>
              <span>❌</span> {error}
            </div>
          )}

          {migrationStatus.result && migrationStatus.result.success && (
            <div className={styles.success}>
              <span>✅</span> Migração concluída com sucesso!
              <div className={styles.migrationStats}>
                <span>Movimentações: {migrationStatus.result.migrated?.movements || 0}</span>
                <span>Transações: {migrationStatus.result.migrated?.transactions || 0}</span>
              </div>
            </div>
          )}
        </div>

        <div className={styles.actions}>
          <button 
            className={styles.btnSecondary} 
            onClick={handleDismiss}
            disabled={migrating}
          >
            Agora Não
          </button>
          <button 
            className={styles.btnPrimary} 
            onClick={handleMigrate}
            disabled={migrating}
          >
            {migrating ? (
              <>
                <span className={styles.spinner}></span>
                Migrando...
              </>
            ) : (
              'Migrar Dados'
            )}
          </button>
        </div>

        <p className={styles.note}>
          <strong>Nota:</strong> Após a migração, os dados locais serão removidos 
          e todas as informações estarão seguras no banco de dados.
        </p>
      </div>
    </div>
  );
};
