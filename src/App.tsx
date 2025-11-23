import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CaixaProvider } from './context/CaixaContext';
import './App.css';
import { AppContent } from './components/AppContent';

function App() {
  return (
    <AuthProvider>
      <CaixaProvider>
        <Router>
          <AppContent />
        </Router>
      </CaixaProvider>
    </AuthProvider>
  );
}

export default App;
