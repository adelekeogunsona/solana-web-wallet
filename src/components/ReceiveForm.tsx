import { useContext } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { AuthContext } from '../context/authContextTypes';
import { useToast } from '@/hooks/useToast';

export default function ReceiveForm() {
  const { currentWallet } = useContext(AuthContext);
  const { toast } = useToast();

  if (!currentWallet) {
    return (
      <div className="card">
        <h2 className="text-xl font-bold mb-6">Receive</h2>
        <p className="text-red-500">No wallet selected</p>
      </div>
    );
  }

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(currentWallet.publicKey);
      toast({
        title: "Success",
        description: "Address copied to clipboard",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to copy address",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="card">
      <h2 className="text-xl font-bold mb-6">Receive</h2>

      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg mx-auto w-fit">
          <QRCodeSVG
            value={currentWallet.publicKey}
            size={192}
            level="H"
            includeMargin
            className="rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Your Wallet Address</label>
          <div className="relative">
            <input
              type="text"
              value={currentWallet.publicKey}
              readOnly
              className="input-primary w-full pr-24"
            />
            <button
              onClick={handleCopyAddress}
              className="absolute right-2 top-1/2 -translate-y-1/2 btn-secondary py-1 px-3"
            >
              Copy
            </button>
          </div>
          <p className="mt-2 text-sm text-gray-400">
            Send only Solana (SOL) or SPL tokens to this address
          </p>
        </div>

        <div className="pt-4 border-t border-gray-700">
          <h3 className="text-lg font-medium mb-4">Supported Tokens</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-solana-dark rounded-lg text-center">
              <span className="text-sm font-medium">Solana (SOL)</span>
            </div>
            <div className="p-3 bg-solana-dark rounded-lg text-center">
              <span className="text-sm font-medium">All SPL Tokens</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}