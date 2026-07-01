import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/auth.store';

export function OAuthCallbackPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((s) => s.login);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const accessToken = params.get('accessToken');
    const refreshToken = params.get('refreshToken');

    if (accessToken && refreshToken) {
      login(accessToken, refreshToken)
        .then(() => {
          navigate('/');
        })
        .catch(() => {
          navigate('/login');
        });
    } else {
      navigate('/login');
    }
  }, [location, login, navigate]);

  return (
    <div className="page container flex justify-center items-center" id="oauth-callback-page" style={{ minHeight: '60vh' }}>
      <div className="text-center" id="oauth-callback-container">
        <h2 className="text-2xl font-bold mb-4" id="oauth-callback-title">Authenticating...</h2>
        <div className="loader mx-auto" id="oauth-callback-loader"></div>
      </div>
    </div>
  );
}
