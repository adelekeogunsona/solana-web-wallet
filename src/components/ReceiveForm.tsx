const DUMMY_ADDRESS = '7x8x9x0x1x2x3x4x5x6x7x8x9x0x1x2x';

export default function ReceiveForm() {
  return (
    <div className="card">
      <h2 className="text-xl font-bold mb-6">Receive</h2>

      <div className="space-y-6">
        <div className="bg-white p-8 rounded-lg mx-auto w-fit">
          {/* Placeholder for QR code */}
          <div className="w-48 h-48 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400">
            QR Code
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Your Wallet Address</label>
          <div className="relative">
            <input
              type="text"
              value={DUMMY_ADDRESS}
              readOnly
              className="input-primary w-full pr-24"
            />
            <button
              onClick={() => navigator.clipboard.writeText(DUMMY_ADDRESS)}
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