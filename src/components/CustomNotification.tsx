import React from 'react';
import { createRoot } from 'react-dom/client';
import styles from './CustomNotification.module.css';

interface CustomNotificationProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  onClose: () => void;
}

export const CustomNotification: React.FC<CustomNotificationProps> = ({ type, message, onClose }) => {
  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };

  const titles = {
    success: 'Sucesso',
    error: 'Erro',
    warning: 'Atenção',
    info: 'Informação'
  };

  return (
    <div className={`${styles.overlay}`} onClick={onClose}>
      <div className={`${styles.notification} ${styles[type]}`} onClick={(e) => e.stopPropagation()}>
        <div className={styles.icon}>{icons[type]}</div>
        <div className={styles.content}>
          <h3 className={styles.title}>{titles[type]}</h3>
          <p className={styles.message}>{message}</p>
        </div>
        <button className={styles.closeBtn} onClick={onClose}>×</button>
      </div>
    </div>
  );
};

export const showNotification = (type: 'success' | 'error' | 'warning' | 'info', message: string) => {
  return new Promise<void>((resolve) => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    const handleClose = () => {
      root.unmount();
      document.body.removeChild(container);
      resolve();
    };

    const root = createRoot(container);
    root.render(
      <CustomNotification type={type} message={message} onClose={handleClose} />
    );

    // Auto fechar após 5 segundos
    setTimeout(handleClose, 5000);
  });
};
