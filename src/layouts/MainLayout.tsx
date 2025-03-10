import { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-solana-gray border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/" className="text-xl font-bold text-solana-green">
                Solana Wallet
              </Link>
            </div>
            <nav className="flex items-center space-x-4">
              <Link to="/" className="text-gray-300 hover:text-white">
                Wallets
              </Link>
              <Link to="/settings" className="text-gray-300 hover:text-white">
                Settings
              </Link>
              <button
                onClick={handleLogout}
                className="btn-secondary"
              >
                Logout
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-solana-gray border-t border-gray-700 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="text-center text-gray-400">
            <p>© 2024 Solana Multi-Wallet. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}