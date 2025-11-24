import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import styles from './ThemeToggle.module.css';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={styles.toggleButton}
      title={theme === 'dark' ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
      aria-label="Alternar tema"
    >
      <div className={`${styles.iconWrapper} ${theme === 'light' ? styles.light : styles.dark}`}>
        <Sun className={styles.sunIcon} size={20} />
        <Moon className={styles.moonIcon} size={20} />
      </div>
    </button>
  );
};
