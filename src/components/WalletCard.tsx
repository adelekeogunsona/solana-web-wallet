import { useToast } from "@/hooks/useToast"
import { useSolPrice } from "@/hooks/useSolPrice"

interface WalletCardProps {
  name: string;
  address: string;
  balance?: number;
  isActive?: boolean;
  isCompact?: boolean;
  isFavorite?: boolean;
  onDelete?: () => void;
  onToggleFavorite?: () => void;
  onBackup?: () => void;
}

export default function WalletCard({
  name,
  address,
  balance,
  isActive,
  isCompact,
  isFavorite,
  onDelete,
  onToggleFavorite,
  onBackup
}: WalletCardProps) {
  const { toast } = useToast();
  const { price: solPrice } = useSolPrice();
  const shortAddress = `${address.slice(0, 4)}...${address.slice(-4)}`;

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent wallet selection when clicking delete
    if (onDelete && window.confirm('Are you sure you want to delete this wallet? This action cannot be undone.')) {
      onDelete();
    }
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent wallet selection when clicking favorite
    if (onToggleFavorite) {
      onToggleFavorite();
    }
  };

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(address);
      toast({
        title: "Address copied",
        description: "Wallet address has been copied to clipboard",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to copy address to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleViewTransactions = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(`https://solana.fm/account/${address}`, '_blank');
  };

  const handleBackup = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onBackup) {
      onBackup();
    }
  };

  if (isCompact) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md ${isActive ? 'ring-2 ring-primary' : ''}`}>
        <div className="flex justify-between items-center">
          <div className="truncate">
            <div className="flex items-center space-x-1">
              <h3 className="text-sm font-medium truncate">{name}</h3>
              {isFavorite && (
                <button
                  onClick={handleToggleFavorite}
                  className="text-yellow-400 hover:text-yellow-500"
                  title="Remove from favorites"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </button>
              )}
            </div>
            <div className="flex items-center space-x-1">
              <p className="text-xs text-gray-500 dark:text-gray-400">{shortAddress}</p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopyAddress();
                }}
                className="text-gray-400 hover:text-gray-500"
                title="Copy address"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                  <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                </svg>
              </button>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium">
              {balance !== undefined ? (
                <>
                  {balance.toFixed(2)} SOL
                  {solPrice && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      ${(balance * solPrice).toFixed(2)}
                    </p>
                  )}
                </>
              ) : '...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg h-[240px] flex flex-col ${isActive ? 'ring-2 ring-primary' : ''}`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-semibold">{name}</h3>
            <button
              onClick={handleToggleFavorite}
              className={`${isFavorite ? 'text-yellow-400 hover:text-yellow-500' : 'text-gray-400 hover:text-gray-500'}`}
              title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </button>
          </div>
          <div className="flex items-center space-x-2">
            <p className="text-gray-500 dark:text-gray-400 text-sm">{shortAddress}</p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCopyAddress();
              }}
              className="text-gray-400 hover:text-gray-500"
              title="Copy address"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
              </svg>
            </button>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {isActive && (
            <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
              Active
            </span>
          )}
          {onDelete && !isActive && (
            <button
              onClick={handleDelete}
              className="p-1 text-red-500 hover:text-red-600 transition-colors"
              title="Delete wallet"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>
      </div>
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400">Balance</p>
        <p className="text-lg font-bold mb-1">
          {balance !== undefined ? `${balance.toFixed(2)} SOL` : '...'}
        </p>
        {balance !== undefined && solPrice && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            ${(balance * solPrice).toFixed(2)} USD
          </p>
        )}
      </div>

      <div className="mt-auto grid grid-cols-2 gap-4">
        <button
          onClick={handleViewTransactions}
          className="flex items-center justify-center space-x-2 p-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 bg-gray-100 dark:bg-gray-700 rounded-lg transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm2 10a1 1 0 10-2 0v3a1 1 0 102 0v-3zm2-3a1 1 0 011 1v5a1 1 0 11-2 0v-5a1 1 0 011-1zm4-1a1 1 0 10-2 0v7a1 1 0 102 0V8z" clipRule="evenodd" />
          </svg>
          <span>Transaction History</span>
        </button>
        <button
          onClick={handleBackup}
          className="flex items-center justify-center space-x-2 p-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 bg-gray-100 dark:bg-gray-700 rounded-lg transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2h-1.528A6 6 0 004 9.528V4z" />
            <path fillRule="evenodd" d="M8 10a4 4 0 00-3.446 6.032l-1.261 1.26a1 1 0 101.414 1.415l1.261-1.261A4 4 0 108 10zm-2 4a2 2 0 114 0 2 2 0 01-4 0z" clipRule="evenodd" />
          </svg>
          <span>Backup Wallet</span>
        </button>
      </div>
    </div>
  );
}