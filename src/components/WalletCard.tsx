interface WalletCardProps {
  name: string;
  address: string;
  balance?: number;
  isActive?: boolean;
  isCompact?: boolean;
  isFavorite?: boolean;
  onDelete?: () => void;
  onToggleFavorite?: () => void;
}

export default function WalletCard({
  name,
  address,
  balance,
  isActive,
  isCompact,
  isFavorite,
  onDelete,
  onToggleFavorite
}: WalletCardProps) {
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
            <p className="text-xs text-gray-500 dark:text-gray-400">{shortAddress}</p>
          </div>
          <p className="text-sm font-semibold ml-2">
            {balance !== undefined ? `${balance} SOL` : '...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg ${isActive ? 'ring-2 ring-primary' : ''}`}>
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
          <p className="text-gray-500 dark:text-gray-400 text-sm">{shortAddress}</p>
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
      <div className="mt-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">Balance</p>
        <p className="text-2xl font-bold">
          {balance !== undefined ? `${balance} SOL` : '...'}
        </p>
      </div>
    </div>
  );
}