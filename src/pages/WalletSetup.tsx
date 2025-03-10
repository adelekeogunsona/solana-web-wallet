import { useNavigate } from 'react-router-dom';

export default function WalletSetup() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-solana-green">Welcome to Solana Wallet</h1>
          <p className="mt-2 text-gray-400">
            Choose how you want to get started
          </p>
        </div>

        <div className="card space-y-6">
          <button
            onClick={() => navigate('/setup/create')}
            className="btn-primary w-full flex justify-center items-center py-4"
          >
            Create New Wallet
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-solana-gray text-gray-400">or</span>
            </div>
          </div>

          <button
            onClick={() => navigate('/setup/import')}
            className="btn-secondary w-full flex justify-center items-center py-4"
          >
            Import Existing Wallet
          </button>
        </div>
      </div>
    </div>
  );
}