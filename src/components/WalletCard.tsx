interface WalletCardProps {
  name: string;
  address: string;
  balance?: number;
  isActive?: boolean;
}

export default function WalletCard({ name, address, balance, isActive }: WalletCardProps) {
  const shortAddress = `${address.slice(0, 4)}...${address.slice(-4)}`;

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg ${isActive ? 'ring-2 ring-primary' : ''}`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold">{name}</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm">{shortAddress}</p>
        </div>
        {isActive && (
          <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
            Active
          </span>
        )}
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