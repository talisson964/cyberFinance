import React, { useState } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Login } from './Login';
import { DashboardPage, MovementsPage } from '../pages';
import { AdvancedReports } from './AdvancedReports';
import { DebtConfiguration } from './DebtConfiguration';
import { RateSimulator, PercentageCalculator, InvestmentForecast } from './Tools';
import { OverdueWarningSystem } from './OverdueWarningSystem';
import { ThemeToggle } from './ThemeToggle';
import { BarChart2, Menu, X, CreditCard, ChevronDown, FileText, Wrench, LogOut, Pin, PinOff } from 'lucide-react';

export const AppContent: React.FC = () => {
  const { user, loading, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarPinned, setSidebarPinned] = useState(() => {
    const saved = localStorage.getItem('sidebarPinned');
    return saved ? JSON.parse(saved) : false;
  });
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const location = useLocation();

  // Mostrar loading enquanto verifica autenticação
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        fontSize: '1.5rem',
        fontWeight: 'bold'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '4rem', marginBottom: '20px' }}>⏳</div>
          <div>Carregando...</div>
        </div>
      </div>
    );
  }

  // Se não estiver autenticado, mostrar tela de login
  if (!user) {
    return <Login />;
  }

  const isMovementsRoute = location.pathname.startsWith('/movimentacoes');
  const isDashboardRoute = location.pathname === '/';

  const handleMenuClick = (menuName: string) => {
    setOpenMenu(openMenu === menuName ? null : menuName);
  };

  const handleSubMenuClick = () => {
    if (!sidebarPinned) {
      setSidebarOpen(false);
    }
    setOpenMenu(null);
  };

  const handleSignOut = async () => {
    await signOut();
    setSidebarOpen(false);
  };

  const toggleSidebarPin = () => {
    const newPinnedState = !sidebarPinned;
    setSidebarPinned(newPinnedState);
    localStorage.setItem('sidebarPinned', JSON.stringify(newPinnedState));
    if (newPinnedState) {
      setSidebarOpen(true);
    }
  };

  return (
    <div className="app">
      <OverdueWarningSystem />
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen || sidebarPinned ? 'open' : ''} ${sidebarPinned ? 'pinned' : ''}`}>
        <div className="sidebar-header">
          <h1>💼 Caixa</h1>
          <div className="sidebar-header-buttons">
            <button
              className="pin-btn"
              onClick={toggleSidebarPin}
              title={sidebarPinned ? 'Desafixar menu' : 'Fixar menu'}
            >
              {sidebarPinned ? <PinOff size={20} /> : <Pin size={20} />}
            </button>
            <button
              className="close-btn"
              onClick={() => setSidebarOpen(false)}
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* User Info */}
        <div className="user-info">
          <div className="user-avatar">
            {user.user_metadata?.full_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
          </div>
          <div className="user-details">
            <div className="user-name">{user.user_metadata?.full_name || 'Usuário'}</div>
            <div className="user-email">{user.email}</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {/* Dashboard com Submenu */}
          <div className="nav-item-with-submenu">
            <button
              className={`nav-link nav-link-expandable ${isDashboardRoute ? 'active' : ''}`}
              onClick={(e) => { e.preventDefault(); handleMenuClick('dashboard'); }}
            >
              <BarChart2 size={20} />
              <span>Dashboard</span>
              <ChevronDown
                size={20}
                className={`chevron ${openMenu === 'dashboard' ? 'open' : ''}`}
              />
            </button>

            {/* Submenu */}
            {openMenu === 'dashboard' && (
              <div className="submenu">
                <Link
                  to="/?tab=dados"
                  className="submenu-link"
                  onClick={handleSubMenuClick}
                >
                  <span>📊 Dados</span>
                </Link>
                <Link
                  to="/?tab=graficos"
                  className="submenu-link"
                  onClick={handleSubMenuClick}
                >
                  <span>📈 Gráficos</span>
                </Link>
              </div>
            )}
          </div>

          {/* Movimentações com Submenu */}
          <div className="nav-item-with-submenu">
            <button
              className={`nav-link nav-link-expandable ${isMovementsRoute ? 'active' : ''}`}
              onClick={(e) => { e.preventDefault(); handleMenuClick('movements'); }}
            >
              <CreditCard size={20} />
              <span>Movimentações</span>
              <ChevronDown
                size={20}
                className={`chevron ${openMenu === 'movements' ? 'open' : ''}`}
              />
            </button>

            {/* Submenu */}
            {openMenu === 'movements' && (
              <div className="submenu">
                <Link
                  to="/movimentacoes?tab=register"
                  className="submenu-link"
                  onClick={handleSubMenuClick}
                >
                  <span>📝 Registrar Movimentação</span>
                </Link>
                <Link
                  to="/movimentacoes?tab=import"
                  className="submenu-link"
                  onClick={handleSubMenuClick}
                >
                  <span>📤 Importar Planilha</span>
                </Link>
                <Link
                  to="/movimentacoes?tab=history"
                  className="submenu-link"
                  onClick={handleSubMenuClick}
                >
                  <span>📊 Histórico</span>
                </Link>
              </div>
            )}
          </div>

          {/* Relatórios Avançados com Submenu */}
          <div className="nav-item-with-submenu">
            <button
              className={`nav-link nav-link-expandable ${location.pathname.startsWith('/relatorios') ? 'active' : ''}`}
              onClick={(e) => { e.preventDefault(); handleMenuClick('reports'); }}
            >
              <FileText size={20} />
              <span>Relatórios Avançados</span>
              <ChevronDown
                size={20}
                className={`chevron ${openMenu === 'reports' ? 'open' : ''}`}
              />
            </button>

            {/* Submenu */}
            {openMenu === 'reports' && (
              <div className="submenu">
                <Link
                  to="/relatorios?tab=overdue"
                  className="submenu-link"
                  onClick={handleSubMenuClick}
                >
                  <span>🔴 Análise de Atrasados</span>
                </Link>
                <Link
                  to="/relatorios?tab=forecast-7"
                  className="submenu-link"
                  onClick={handleSubMenuClick}
                >
                  <span>📈 Forecasts</span>
                </Link>
                <Link
                  to="/relatorios/config-dividas"
                  className="submenu-link"
                  onClick={handleSubMenuClick}
                >
                  <span>💳 Configuração de Dívidas</span>
                </Link>
              </div>
            )}
          </div>

          {/* Ferramentas com Submenu */}
          <div className="nav-item-with-submenu">
            <button
              className={`nav-link nav-link-expandable ${location.pathname.startsWith('/ferramentas') ? 'active' : ''}`}
              onClick={(e) => { e.preventDefault(); handleMenuClick('tools'); }}
            >
              <Wrench size={20} />
              <span>Ferramentas</span>
              <ChevronDown
                size={20}
                className={`chevron ${openMenu === 'tools' ? 'open' : ''}`}
              />
            </button>

            {/* Submenu */}
            {openMenu === 'tools' && (
              <div className="submenu">
                <Link
                  to="/ferramentas/simulador-taxa"
                  className="submenu-link"
                  onClick={handleSubMenuClick}
                >
                  <span>🧮 Simulador de Taxa</span>
                </Link>
                <Link
                  to="/ferramentas/calculadora-percentual"
                  className="submenu-link"
                  onClick={handleSubMenuClick}
                >
                  <span>📊 Calculadora de Percentual</span>
                </Link>
                <Link
                  to="/ferramentas/previsao-investimentos"
                  className="submenu-link"
                  onClick={handleSubMenuClick}
                >
                  <span>📈 Previsão de Investimentos</span>
                </Link>
              </div>
            )}
          </div>
        </nav>

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleSignOut}>
            <LogOut size={20} />
            <span>Sair</span>
          </button>
          <p className="copyright">Criado por CyberLife</p>
        </div>
      </aside>

      {/* Main Content */}
      <div className="main-content">
        <header className="app-header">
          <button
            className="menu-btn"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu size={24} />
          </button>
          <h2>CyberFinance</h2>
          <div style={{ marginLeft: 'auto' }}>
            <ThemeToggle />
          </div>
        </header>

        <main className="content">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/movimentacoes" element={<MovementsPage />} />
            <Route path="/relatorios" element={<AdvancedReports />} />
            <Route path="/relatorios/config-dividas" element={<DebtConfiguration />} />
            <Route path="/ferramentas/simulador-taxa" element={<RateSimulator />} />
            <Route path="/ferramentas/calculadora-percentual" element={<PercentageCalculator />} />
            <Route path="/ferramentas/previsao-investimentos" element={<InvestmentForecast />} />
          </Routes>
        </main>
      </div>

      {/* Overlay para fechar sidebar em mobile */}
      {(sidebarOpen && !sidebarPinned) && (
        <div
          className="overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};
