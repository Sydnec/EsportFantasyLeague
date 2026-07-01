import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/auth.store';
import { apiClient } from '../api/client';

export function OAuthCallbackPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((s) => s.login);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const code = params.get('code');

    if (code) {
      apiClient.post('/auth/google/token', { code })
        .then((res) => {
          const { accessToken, refreshToken } = res.data.data;
          login(accessToken, refreshToken)
            .then(() => {
              navigate('/');
            })
            .catch(() => {
              navigate('/login');
            });
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
