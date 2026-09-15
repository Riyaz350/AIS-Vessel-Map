import { useRef } from 'react';

import VesselMap from './components/VesselMap';
import AICommandBar from './components/AICommandBar';
import AuthModal from './components/AuthModal';
import { useAuth } from './context/AuthContext';
import { COLORS, RADIUS, SHADOW, FONT_FAMILY } from './lib/theme';

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
  top: 16,
  right: 16,
  zIndex: 1200,
  fontFamily: FONT_FAMILY,
};

const userBoxStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  background: COLORS.surface,
  borderRadius: RADIUS.pill,
  boxShadow: SHADOW.float,
  padding: '6px 8px 6px 16px',
};

const userEmailStyle = {
  fontSize: 13,
  fontWeight: 500,
  color: COLORS.textPrimary,
  maxWidth: 180,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const signOutBtnStyle = {
  border: 'none',
  background: COLORS.dangerBg,
  color: COLORS.danger,
  borderRadius: RADIUS.pill,
  padding: '6px 14px',
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
};

const loginBtnStyle = {
  border: 'none',
  background: COLORS.primary,
  color: '#fff',
  borderRadius: RADIUS.pill,
  padding: '10px 20px',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
  boxShadow: SHADOW.float,
};
