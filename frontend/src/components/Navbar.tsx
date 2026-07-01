import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/auth.store';
import './Navbar.css';

export function Navbar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar" id="navbar-main">
      <div className="navbar-container container" id="navbar-container">
        <NavLink to="/" className="navbar-logo" id="navbar-logo">
          ⚡ <span className="gradient-text">ESPORT FL</span>
        </NavLink>

        <div className="navbar-links" id="navbar-links">
          <NavLink to="/" end className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`} id="navbar-link-home">
            Accueil
          </NavLink>
          {user && (
            <>
              <NavLink to="/dashboard" className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`} id="navbar-link-dashboard">
                Dashboard
              </NavLink>
              <NavLink to="/leagues/new" className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`} id="navbar-link-create-league">
                Créer/Rejoindre une ligue
              </NavLink>
            </>
          )}
        </div>

        <div className="navbar-user" id="navbar-user-section">
          {user ? (
            <>
              <NavLink to="/profile" className={({ isActive }) => `navbar-username hover:text-primary transition-colors ${isActive ? 'text-primary font-bold' : ''}`} id="navbar-link-profile">
                {user.username}
              </NavLink>
              <button onClick={handleLogout} className="navbar-link" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px', color: 'var(--text-muted)' }} id="navbar-logout-btn">
                Déconnexion
              </button>
            </>
          ) : (
            <NavLink to="/login" className="btn btn-primary btn-sm" id="navbar-login-btn">
              Connexion
            </NavLink>
          )}
        </div>
      </div>
    </nav>
  );
}
