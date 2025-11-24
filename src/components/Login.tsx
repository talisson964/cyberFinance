import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff } from 'lucide-react';
import styles from './Login.module.css';

export const Login: React.FC = () => {
  const { signIn, signUp, resetPassword } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isAwaitingConfirmation, setIsAwaitingConfirmation] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Verificar confirmação automática de email
  useEffect(() => {
    // Verificar hash na URL para email confirmado
    const checkEmailConfirmation = () => {
      const hash = window.location.hash;
      if (hash && hash.includes('type=signup')) {
        // Email foi confirmado
        setIsAwaitingConfirmation(false);
        setShowSuccessPopup(true);
        
        // Limpar hash da URL
        window.history.replaceState(null, '', window.location.pathname);
        
        // Voltar ao login após 4 segundos
        setTimeout(() => {
          setShowSuccessPopup(false);
          setIsLogin(true);
        }, 4000);
      }
    };

    checkEmailConfirmation();

    // Listener para mudanças no hash
    window.addEventListener('hashchange', checkEmailConfirmation);

    return () => {
      window.removeEventListener('hashchange', checkEmailConfirmation);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (isForgotPassword) {
        const { error } = await resetPassword(email);
        if (error) {
          setError(error.message);
        } else {
          setSuccess('Email de recuperação enviado! Verifique sua caixa de entrada.');
          setTimeout(() => {
            setIsForgotPassword(false);
            setIsLogin(true);
            setEmail('');
            setSuccess('');
          }, 3000);
        }
      } else if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            setError('Email ou senha incorretos');
          } else if (error.message.includes('Email not confirmed')) {
            setError('Por favor, confirme seu email antes de fazer login');
          } else {
            setError(error.message);
          }
        }
      } else {
        if (!fullName.trim()) {
          setError('Por favor, informe seu nome completo');
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setError('A senha deve ter no mínimo 6 caracteres');
          setLoading(false);
          return;
        }
        const { error } = await signUp(email, password, fullName);
        if (error) {
          if (error.message.includes('already registered') || error.message.includes('User already registered')) {
            setError('Este email já está cadastrado');
          } else {
            setError(error.message);
          }
        } else {
          // Salvar email antes de limpar para exibir na tela de confirmação
          const registeredEmail = email;
          setIsAwaitingConfirmation(true);
          setPassword('');
          setFullName('');
          setEmail(registeredEmail);
        }
      }
    } catch (err) {
      setError('Ocorreu um erro. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setIsForgotPassword(false);
    setError('');
    setSuccess('');
    setEmail('');
    setPassword('');
    setFullName('');
    setShowPassword(false);
  };

  const handleForgotPassword = () => {
    setIsForgotPassword(true);
    setIsLogin(false);
    setError('');
    setSuccess('');
    setPassword('');
    setFullName('');
    setShowPassword(false);
  };

  const handleBackToLogin = () => {
    setIsForgotPassword(false);
    setIsLogin(true);
    setIsAwaitingConfirmation(false);
    setError('');
    setSuccess('');
    setEmail('');
    setPassword('');
    setFullName('');
    setShowPassword(false);
  };

  // Tela de aguardando confirmação de email
  if (isAwaitingConfirmation) {
    return (
      <>
        {/* Popup de Sucesso */}
        {showSuccessPopup && (
          <div className={styles.successPopupOverlay}>
            <div className={styles.successPopup}>
              <div className={styles.successIcon}>✅</div>
              <h2>Conta Criada com Sucesso!</h2>
              <p>Seu email foi confirmado. Bem-vindo(a) ao CyberFinance!</p>
              <div className={styles.successAnimation}>
                <div className={styles.checkmark}>
                  <svg viewBox="0 0 52 52">
                    <circle cx="26" cy="26" r="25" fill="none"/>
                    <path fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
                  </svg>
                </div>
              </div>
              <p className={styles.redirectMessage}>Redirecionando para o login...</p>
            </div>
          </div>
        )}

        <div className={styles.container}>
          <div className={styles.loginBox}>
          <div className={styles.header}>
            <div className={styles.icon}>📧</div>
            <h1>Confirme seu Email</h1>
            <p>Um link de confirmação foi enviado</p>
          </div>

          <div className={styles.confirmationMessage}>
            <div className={styles.confirmationIcon}>✉️</div>
            <h3>Verifique sua caixa de entrada</h3>
            <p>Enviamos um email de confirmação para:</p>
            <p className={styles.emailHighlight}>{email || 'seu email'}</p>
            <div className={styles.confirmationSteps}>
              <div className={styles.step}>
                <span className={styles.stepNumber}>1</span>
                <span>Abra seu email</span>
              </div>
              <div className={styles.step}>
                <span className={styles.stepNumber}>2</span>
                <span>Clique no link de confirmação</span>
              </div>
              <div className={styles.step}>
                <span className={styles.stepNumber}>3</span>
                <span>Retorne aqui para fazer login</span>
              </div>
            </div>
            <div className={styles.confirmationNote}>
              <span>💡</span>
              <p>Não recebeu o email? Verifique a pasta de spam ou lixo eletrônico</p>
            </div>
            <button
              onClick={handleBackToLogin}
              className={styles.backButton}
              type="button"
            >
              Voltar para Login
            </button>
          </div>
        </div>
        </div>
      </>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.loginBox}>
        <div className={styles.header}>
          <div className={styles.icon}>💰</div>
          <h1>CyberFinance</h1>
          <p>Gerencie suas movimentações financeiras</p>
        </div>

        {!isForgotPassword && (
          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${isLogin ? styles.activeTab : ''}`}
              onClick={() => setIsLogin(true)}
              type="button"
            >
              Entrar
            </button>
            <button
              className={`${styles.tab} ${!isLogin ? styles.activeTab : ''}`}
              onClick={() => setIsLogin(false)}
              type="button"
            >
              Criar Conta
            </button>
          </div>
        )}

        {isForgotPassword && (
          <div className={styles.forgotPasswordHeader}>
            <h2>Recuperar Senha</h2>
            <p>Digite seu email para receber o link de recuperação</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          {!isLogin && (
            <div className={styles.inputGroup}>
              <label htmlFor="fullName">Nome Completo</label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Seu nome completo"
                required={!isLogin}
                disabled={loading}
              />
            </div>
          )}

          <div className={styles.inputGroup}>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
              disabled={loading}
            />
          </div>

          {!isForgotPassword && (
            <div className={styles.inputGroup}>
              <label htmlFor="password">Senha</label>
              <div className={styles.passwordWrapper}>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isLogin ? 'Sua senha' : 'Mínimo 6 caracteres'}
                  required
                  disabled={loading}
                  minLength={isLogin ? undefined : 6}
                />
                <button
                  type="button"
                  className={styles.togglePassword}
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className={styles.error}>
              <span>⚠️</span>
              {error}
            </div>
          )}

          {success && (
            <div className={styles.success}>
              <span>✅</span>
              {success}
            </div>
          )}

          <button type="submit" className={styles.submitButton} disabled={loading}>
            {loading ? (
              <span className={styles.spinner}>⏳</span>
            ) : isForgotPassword ? (
              '📧 Enviar Link de Recuperação'
            ) : isLogin ? (
              '🔓 Entrar'
            ) : (
              '📝 Criar Conta'
            )}
          </button>

          {isLogin && !isForgotPassword && (
            <button
              type="button"
              className={styles.forgotPasswordLink}
              onClick={handleForgotPassword}
              disabled={loading}
            >
              Esqueci minha senha
            </button>
          )}
        </form>

        <div className={styles.footer}>
          {isForgotPassword ? (
            <p>
              Lembrou sua senha?{' '}
              <button onClick={handleBackToLogin} className={styles.linkButton} type="button">
                Voltar ao login
              </button>
            </p>
          ) : isLogin ? (
            <p>
              Não tem uma conta?{' '}
              <button onClick={toggleMode} className={styles.linkButton} type="button">
                Criar agora
              </button>
            </p>
          ) : (
            <p>
              Já tem uma conta?{' '}
              <button onClick={toggleMode} className={styles.linkButton} type="button">
                Fazer login
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
