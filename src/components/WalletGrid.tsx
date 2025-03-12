import { useState, useContext, useEffect } from 'react';
import WalletCard from './WalletCard';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { AuthContext } from '../context/authContextTypes';
import { Link } from 'react-router-dom';

interface Wallet {
  id: string;
  name: string;
  address: string;
  balance?: number;
  isFavorite?: boolean;
  lastUsed?: Date;
}

interface WalletGridProps {
  wallets: Wallet[];
  activeWalletId?: string;
  onWalletSelect: (id: string) => void;
  onWalletDelete: (id: string) => void;
}

export default function WalletGrid({ wallets, activeWalletId, onWalletSelect, onWalletDelete }: WalletGridProps) {
  const [isCompactView, setIsCompactView] = useState(() => {
    const saved = localStorage.getItem('wallet_view_compact');
    return saved ? JSON.parse(saved) : false;
  });
  const [activeTab, setActiveTab] = useState('all');
  const { toggleFavorite } = useContext(AuthContext);

  useEffect(() => {
    localStorage.setItem('wallet_view_compact', JSON.stringify(isCompactView));
  }, [isCompactView]);

  const favoriteWallets = wallets.filter(w => w.isFavorite);
  const recentWallets = wallets
    .filter(w => w.lastUsed)
    .sort((a, b) => (b.lastUsed?.getTime() || 0) - (a.lastUsed?.getTime() || 0))
    .slice(0, 5);

  const handleToggleFavorite = async (walletId: string) => {
    try {
      await toggleFavorite(walletId);
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  const renderWalletGrid = (walletsToRender: Wallet[]) => (
    <div className={`grid gap-4 ${isCompactView ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
      {walletsToRender.map(wallet => (
        <div
          key={wallet.id}
          onClick={() => onWalletSelect(wallet.id)}
          className="cursor-pointer"
        >
          <WalletCard
            name={wallet.name}
            address={wallet.address}
            balance={wallet.balance}
            isActive={activeWalletId === wallet.id}
            isCompact={isCompactView}
            isFavorite={wallet.isFavorite}
            onDelete={() => onWalletDelete(wallet.id)}
            onToggleFavorite={() => handleToggleFavorite(wallet.id)}
          />
        </div>
      ))}
      {activeTab === 'all' && (
        <Link
          to="/add-wallet"
          className={`bg-gray-50 dark:bg-gray-900 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-primary dark:hover:border-primary hover:bg-gray-100 dark:hover:bg-gray-800 transition-all group ${
            isCompactView ? 'p-4 shadow-md' : 'p-6 shadow-lg'
          }`}
        >
          {isCompactView ? (
            <div className="flex justify-between items-center h-full">
              <div className="truncate">
                <div className="flex items-center space-x-1">
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 group-hover:text-primary">Add Wallet</h3>
                </div>
              </div>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-gray-400 group-hover:text-primary transition-colors"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
            </div>
          ) : (
            <div className="h-full flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 group-hover:text-primary">Add Wallet</h3>
                </div>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-gray-400 group-hover:text-primary transition-colors"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
              </div>
              <div className="mt-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">Create or import a new wallet</p>
              </div>
            </div>
          )}
        </Link>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800">
          <TabsList className="h-12 bg-transparent p-0">
            <TabsTrigger
              value="all"
              className="relative h-12 px-4 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              <div className="flex items-center space-x-2">
                <span>All Wallets</span>
                <span className="text-xs text-gray-500">({wallets.length})</span>
              </div>
              {activeTab === 'all' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </TabsTrigger>
            <TabsTrigger
              value="favorites"
              className="relative h-12 px-4 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              <div className="flex items-center space-x-2">
                <span>Favorites</span>
                <span className="text-xs text-gray-500">({favoriteWallets.length})</span>
              </div>
              {activeTab === 'favorites' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </TabsTrigger>
            <TabsTrigger
              value="recent"
              className="relative h-12 px-4 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              <div className="flex items-center space-x-2">
                <span>Recent</span>
                <span className="text-xs text-gray-500">({recentWallets.length})</span>
              </div>
              {activeTab === 'recent' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </TabsTrigger>
          </TabsList>

          <button
            onClick={() => setIsCompactView(!isCompactView)}
            className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            title={isCompactView ? "Switch to Full View" : "Switch to Compact View"}
          >
            {isCompactView ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 4a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 01-1 1H3a1 1 0 01-1-1V4zM2 10a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 01-1 1H3a1 1 0 01-1-1v-2zM2 16a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 01-1 1H3a1 1 0 01-1-1v-2zM8 4a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 01-1 1H9a1 1 0 01-1-1V4zM8 10a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 01-1 1H9a1 1 0 01-1-1v-2zM8 16a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 01-1 1H9a1 1 0 01-1-1v-2z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2zM3 16a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2z" />
              </svg>
            )}
          </button>
        </div>

        <TabsContent value="all" className="mt-4">
          {renderWalletGrid(wallets)}
        </TabsContent>

        <TabsContent value="favorites" className="mt-4">
          {renderWalletGrid(favoriteWallets)}
        </TabsContent>

        <TabsContent value="recent" className="mt-4">
          {renderWalletGrid(recentWallets)}
        </TabsContent>
      </Tabs>
    </div>
  );
}