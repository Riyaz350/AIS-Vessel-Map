import { useRef } from 'react';

import VesselMap from './components/VesselMap';
import AICommandBar from './components/AICommandBar';
import AuthModal from './components/AuthModal';
import { useAuth } from './context/AuthContext';

export default function App() {
  const vesselMapRef = useRef(null);
  const { user, signOut, showAuthModal, setShowAuthModal } = useAuth();

  return (
    <>
      <VesselMap ref={vesselMapRef} />
      <AICommandBar vesselMapRef={vesselMapRef} />

      <div style={authContainerStyle}>
        {user ? (
          <div style={userBoxStyle}>
            <span style={userEmailStyle}>{user.email}</span>
            <button onClick={signOut} style={signOutBtnStyle}>
              Log Out
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowAuthModal(true)}
            style={loginBtnStyle}
          >
            Log In
          </button>
        )}
      </div>

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
    </>
  );
}

const authContainerStyle = {
  position: 'fixed',
  top: 12,
  right: 12,
  zIndex: 1500,
  fontFamily: 'system-ui, sans-serif',
};

const userBoxStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  background: '#fff',
  borderRadius: 8,
  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
  padding: '6px 10px',
};

const userEmailStyle = {
  fontSize: 13,
  color: '#1f2937',
  maxWidth: 180,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const signOutBtnStyle = {
  border: 'none',
  background: '#ef4444',
  color: '#fff',
  borderRadius: 5,
  padding: '4px 10px',
  fontSize: 12,
  cursor: 'pointer',
};

const loginBtnStyle = {
  border: 'none',
  background: '#2563eb',
  color: '#fff',
  borderRadius: 8,
  padding: '8px 18px',
  fontSize: 14,
  cursor: 'pointer',
  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
};
