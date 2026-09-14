import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function AuthModal({ onClose }) {
  const { signIn, signUp, isFirebaseConfigured } = useAuth();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await signIn(email, password);
      } else {
        await signUp(email, password);
      }
      onClose();
    } catch (err) {
      setError(
        err.code?.replace('auth/', '').replace(/-/g, ' ') ||
          err.message ||
          'Authentication failed'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} style={closeBtnStyle} aria-label="Close">
          ×
        </button>
        <h2 style={titleStyle}>{mode === 'login' ? 'Log In' : 'Sign Up'}</h2>
        {!isFirebaseConfigured ? (
          <p style={noticeStyle}>
            Authentication is not configured yet. Add Firebase credentials to
            enable login.
          </p>
        ) : (
          <>
            {error && <div style={errorStyle}>{error}</div>}
            <form onSubmit={handleSubmit} style={formStyle}>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={inputStyle}
                required
                autoComplete="email"
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={inputStyle}
                required
                autoComplete={
                  mode === 'login' ? 'current-password' : 'new-password'
                }
              />
              <button
                type="submit"
                style={submitBtnStyle}
                disabled={loading}
              >
                {loading
                  ? 'Please wait…'
                  : mode === 'login'
                    ? 'Log In'
                    : 'Sign Up'}
              </button>
            </form>
            <button
              onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
              style={toggleStyle}
            >
              {mode === 'login'
                ? "Don't have an account? Sign up"
                : 'Already have an account? Log in'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

const overlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'rgba(0,0,0,0.5)',
  zIndex: 2000,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: 'system-ui, sans-serif',
};

const modalStyle = {
  background: '#fff',
  borderRadius: 12,
  padding: '32px 28px 24px',
  width: 360,
  maxWidth: '90vw',
  boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
  position: 'relative',
};

const closeBtnStyle = {
  position: 'absolute',
  top: 12,
  right: 16,
  border: 'none',
  background: 'none',
  fontSize: 24,
  cursor: 'pointer',
  color: '#6b7280',
  lineHeight: 1,
};

const titleStyle = {
  margin: '0 0 20px',
  fontSize: 20,
  color: '#1f2937',
};

const errorStyle = {
  fontSize: 13,
  color: '#b91c1c',
  background: '#fee2e2',
  borderRadius: 6,
  padding: '8px 12px',
  marginBottom: 12,
  textTransform: 'capitalize',
};

const formStyle = { display: 'flex', flexDirection: 'column', gap: 10 };

const inputStyle = {
  padding: '10px 12px',
  fontSize: 14,
  border: '1px solid #d1d5db',
  borderRadius: 6,
  outline: 'none',
};

const submitBtnStyle = {
  padding: '10px 12px',
  fontSize: 14,
  border: 'none',
  borderRadius: 6,
  background: '#2563eb',
  color: '#fff',
  cursor: 'pointer',
  marginTop: 4,
};

const toggleStyle = {
  marginTop: 16,
  border: 'none',
  background: 'none',
  color: '#2563eb',
  cursor: 'pointer',
  fontSize: 13,
  textAlign: 'center',
  width: '100%',
};

const noticeStyle = {
  fontSize: 14,
  color: '#6b7280',
  lineHeight: 1.5,
};
