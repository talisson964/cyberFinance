import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { CaixaProvider } from './context/CaixaContextSupabase';
import { ToastProvider } from './components/Toast';
import { MigrationNotice } from './components/MigrationNotice';
import './App.css';
import { AppContent } from './components/AppContent';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <CaixaProvider>
            <MigrationNotice />
            <Router>
              <AppContent />
            </Router>
          </CaixaProvider>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
