interface TokenCardProps {
  name: string;
  symbol: string;
  balance: number;
  icon?: string;
}

export default function TokenCard({ name, symbol, balance, icon }: TokenCardProps) {
  return (
    <div className="card">
      <div className="flex items-center space-x-4">
        <div className="w-10 h-10 bg-solana-gray rounded-full flex items-center justify-center">
          {icon ? (
            <img src={icon} alt={symbol} className="w-8 h-8 rounded-full" />
          ) : (
            <span className="text-lg font-bold">{symbol[0]}</span>
          )}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-medium">{name}</h3>
          <p className="text-sm text-gray-400">{symbol}</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold">{balance}</p>
          <p className="text-sm text-gray-400">{symbol}</p>
        </div>
      </div>
    </div>
  );
}