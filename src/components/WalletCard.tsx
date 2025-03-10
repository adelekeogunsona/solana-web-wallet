interface WalletCardProps {
  name: string;
  address: string;
  balance: number;
  selected?: boolean;
  onClick?: () => void;
}

export default function WalletCard({ name, address, balance, selected, onClick }: WalletCardProps) {
  return (
    <div
      className={`card cursor-pointer transition-all ${
        selected ? 'border-solana-green' : 'hover:border-solana-purple'
      }`}
      onClick={onClick}
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-medium">{name}</h3>
          <p className="text-sm text-gray-400 mt-1">
            {address.slice(0, 4)}...{address.slice(-4)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold text-solana-green">{balance} SOL</p>
        </div>
      </div>
    </div>
  );
}