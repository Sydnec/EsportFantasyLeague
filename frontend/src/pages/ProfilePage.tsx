import { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/auth.store';
import { apiClient } from '../api/client';
import type { ApiResponse, User } from '../types';
import './ProfilePage.css';

export function ProfilePage() {
  const { user, fetchUser } = useAuthStore();
  const [username, setUsername] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  const [profileMessage, setProfileMessage] = useState('');
  const [profileError, setProfileError] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    if (user) {
      setUsername(user.username);
    }
  }, [user]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMessage('');
    setProfileError('');
    try {
      await apiClient.patch<ApiResponse<User>>('/users/me', { username });
      await fetchUser(); // reload user state
      setProfileMessage('Profil mis à jour avec succès !');
    } catch (err: any) {
      setProfileError(err.response?.data?.message || 'Échec de la mise à jour du profil');
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage('');
    setPasswordError('');
    try {
      await apiClient.patch('/users/me/password', {
        currentPassword,
        newPassword,
      });
      setPasswordMessage('Mot de passe mis à jour avec succès !');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: any) {
      setPasswordError(err.response?.data?.message || 'Échec de la mise à jour du mot de passe');
    }
  };

  if (!user) return <div className="page container text-center mt-32" id="profile-loading">Chargement...</div>;

  return (
    <div className="page container" id="profile-page">
      <div className="profile-header" id="profile-header">
        <h1 className="profile-title" id="profile-title">
          <span className="gradient-text">Paramètres du compte</span>
        </h1>
        <p className="profile-subtitle" id="profile-subtitle">Gérez votre profil et vos préférences de sécurité.</p>
      </div>

      <div className="profile-content flex-col gap-24" id="profile-content">
        
        {/* Profile Form */}
        <div className="card" id="profile-card-info">
          
          <h2 className="profile-section-title" id="profile-info-title">
            <span className="profile-section-icon">👤</span> Profil
          </h2>
          
          <form onSubmit={handleProfileUpdate} className="profile-form" id="profile-form-info">
            <div className="form-group" id="profile-group-email">
              <label htmlFor="profile-input-email">Adresse email</label>
              <input
                id="profile-input-email"
                type="text"
                disabled
                value={user.email}
                className="input-field input-disabled"
                title="Votre adresse email ne peut pas être modifiée."
              />
            </div>

            <div className="form-group" id="profile-group-username">
              <label htmlFor="profile-input-username">Pseudo</label>
              <input
                id="profile-input-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input-field"
                required
                minLength={3}
              />
            </div>

            {profileError && (
              <div className="alert alert-danger mt-16" id="profile-error-info">
                <span>⚠️</span> {profileError}
              </div>
            )}
            {profileMessage && (
              <div className="alert alert-success mt-16" id="profile-success-info">
                <span>✅</span> {profileMessage}
              </div>
            )}

            <button type="submit" className="btn btn-primary w-full mt-16" id="profile-btn-submit-info">
              Enregistrer les modifications
            </button>
          </form>
        </div>

        {/* Password Form (Hidden if Google auth only or linked to google) */}
        {user.hasPassword && !user.isGoogleLinked && (
          <div className="card mt-24" id="profile-card-password">

            <h2 className="profile-section-title" id="profile-password-title">
              <span className="profile-section-icon">🔐</span> Sécurité
            </h2>
            
            <form onSubmit={handlePasswordUpdate} className="profile-form" id="profile-form-password">
              <div className="form-group" id="profile-group-current-password">
                <label htmlFor="profile-input-current-password">Mot de passe actuel</label>
                <input
                  id="profile-input-current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="input-field"
                  required
                />
              </div>

              <div className="form-group" id="profile-group-new-password">
                <label htmlFor="profile-input-new-password">Nouveau mot de passe</label>
                <input
                  id="profile-input-new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="input-field"
                  required
                  minLength={8}
                />
                <p className="input-hint" id="profile-hint-new-password">Doit contenir au moins 8 caractères.</p>
              </div>

              {passwordError && (
                <div className="alert alert-danger mt-16" id="profile-error-password">
                  <span>⚠️</span> {passwordError}
                </div>
              )}
              {passwordMessage && (
                <div className="alert alert-success mt-16" id="profile-success-password">
                  <span>✅</span> {passwordMessage}
                </div>
              )}

              <button type="submit" className="btn btn-secondary w-full mt-16" id="profile-btn-submit-password">
                Mettre à jour le mot de passe
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
