import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { useAuthStore } from './stores/auth.store';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Navbar } from './components/Navbar';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { HomePage } from './pages/HomePage';
import { CreateLeaguePage } from './pages/CreateLeaguePage';
import { LeagueDetailPage } from './pages/LeagueDetailPage';
import { RosterPage } from './pages/RosterPage';
import { ResultsPage } from './pages/ResultsPage';
import { OAuthCallbackPage } from './pages/OAuthCallbackPage';
import { ProfilePage } from './pages/ProfilePage';

function Layout() {
  return (
    <div id="app-layout">
      <Navbar />
      <main id="app-main-content">
        <Outlet />
      </main>
    </div>
  );
}

export default function App() {
  const fetchUser = useAuthStore((s) => s.fetchUser);
  const startProactiveRefresh = useAuthStore((s) => s.startProactiveRefresh);

  useEffect(() => {
    fetchUser();
    if (localStorage.getItem('accessToken')) {
      startProactiveRefresh();
    }
  }, [fetchUser, startProactiveRefresh]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth/callback" element={<OAuthCallbackPage />} />
        <Route
          element={
            <Layout />
          }
        >
          <Route path="/" element={<HomePage />} />
        </Route>
        
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/leagues/new" element={<CreateLeaguePage />} />
          <Route path="/leagues/:id" element={<LeagueDetailPage />} />
          <Route path="/leagues/:leagueId/roster/:matchDayId" element={<RosterPage />} />
          <Route path="/leagues/:leagueId/results/:matchDayId" element={<ResultsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
