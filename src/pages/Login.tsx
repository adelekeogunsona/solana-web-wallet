import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Login() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const { login, resetWallet } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(password);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    resetWallet();
    navigate('/setup');
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-solana-green">Welcome Back</h1>
          <p className="mt-2 text-gray-400">Enter your master password to continue</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                Master Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-primary w-full"
                placeholder="Enter your master password"
                required
              />
              {error && (
                <p className="mt-2 text-sm text-red-500">{error}</p>
              )}
            </div>

            <div>
              <button
                type="submit"
                className="btn-primary w-full flex justify-center items-center"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="inline-flex items-center">
                    Loading...
                  </span>
                ) : (
                  'Login'
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-700">
            <button
              type="button"
              onClick={() => setShowResetConfirm(true)}
              className="btn-secondary w-full text-red-500 hover:text-red-400"
            >
              Reset Wallet
            </button>
          </div>
        </div>

        {/* Reset Confirmation Dialog */}
        {showResetConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-solana-gray rounded-lg p-6 max-w-sm w-full">
              <h3 className="text-xl font-bold text-red-500 mb-4">Reset Wallet</h3>
              <p className="text-gray-300 mb-6">
                Are you sure you want to reset your wallet? This action cannot be undone and you will lose access to all your wallet data.
              </p>
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="btn-primary flex-1 bg-red-500 hover:bg-red-600"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}