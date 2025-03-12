import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsProvider';
import { useAuth } from './hooks/useAuth';
import MainLayout from './layouts/MainLayout';
import Home from './pages/Home';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Setup from './pages/Setup';
import Transfer from './pages/Transfer';
import WalletSetup from './pages/WalletSetup';
import ImportWallet from './pages/ImportWallet';
import { AddWallet } from './pages/AddWallet';
import { AddWalletImport } from './pages/AddWalletImport';
import { Toaster } from './components/ui/toaster';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isInitialized } = useAuth();

  if (!isInitialized) {
    return <Navigate to="/setup" />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isInitialized } = useAuth();

  if (!isInitialized) {
    return <Navigate to="/setup" />;
  }

  if (isAuthenticated) {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
}

function SetupRoute({ children }: { children: React.ReactNode }) {
  const { isInitialized } = useAuth();

  if (isInitialized) {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <Router>
          <Routes>
            <Route
              path="/setup"
              element={
                <SetupRoute>
                  <WalletSetup />
                </SetupRoute>
              }
            />
            <Route
              path="/setup/create"
              element={
                <SetupRoute>
                  <Setup />
                </SetupRoute>
              }
            />
            <Route
              path="/setup/import"
              element={
                <SetupRoute>
                  <ImportWallet />
                </SetupRoute>
              }
            />
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />
            <Route
              path="/*"
              element={
                <PrivateRoute>
                  <MainLayout>
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/settings" element={<Settings />} />
                      <Route path="/transfer" element={<Transfer />} />
                      <Route path="/add-wallet" element={<AddWallet />} />
                      <Route path="/add-wallet/import" element={<AddWalletImport />} />
                    </Routes>
                  </MainLayout>
                </PrivateRoute>
              }
            />
          </Routes>
          <Toaster />
        </Router>
      </SettingsProvider>
    </AuthProvider>
  );
}

export default App;
