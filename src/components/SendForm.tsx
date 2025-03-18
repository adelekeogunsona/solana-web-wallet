import { useState, useContext, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/authContextTypes';
import { useToast } from '@/hooks/useToast';
import { rpcManager } from '../utils/rpc';
import { PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { getKeypairFromPrivateKey } from '../utils/wallet';

interface SendFormProps {
  walletId?: string;
}

const LAMPORTS_PER_SIGNATURE = 5000; // Base fee per signature
const RENT_EXEMPT_MINIMUM = 890880; // Minimum balance for rent exemption (in lamports)
const SAFETY_MARGIN = 2; // Multiply gas fee by this for safety margin

export default function SendForm({ walletId }: SendFormProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { wallets } = useContext(AuthContext);
  const [amount, setAmount] = useState('');
  const [address, setAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [balance, setBalance] = useState<number | undefined>(undefined);
  const [estimatedFee, setEstimatedFee] = useState<number>(LAMPORTS_PER_SIGNATURE / LAMPORTS_PER_SOL);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [recipientError, setRecipientError] = useState<string | null>(null);
  const [amountError, setAmountError] = useState<string | null>(null);
  const [isNewAccount, setIsNewAccount] = useState<boolean>(false);
  const [isAddressValid, setIsAddressValid] = useState(false);

  const wallet = wallets?.find(w => w.id === walletId);

  // Fetch balance when wallet changes
  useEffect(() => {
    if (wallet) {
      rpcManager.getBalance(wallet.publicKey)
        .then(setBalance)
        .catch(error => {
          console.error('Failed to fetch balance:', error);
          toast({
            title: "Error",
            description: "Failed to fetch wallet balance",
            variant: "destructive",
          });
        });
    }
  }, [wallet, toast]);

  const validateRecipientAddress = async (address: string): Promise<boolean> => {
    // Clear amount when address changes
    setAmount('');
    setAmountError(null);

    try {
      // Validate address format
      new PublicKey(address);
      setRecipientError(null);

      // Check if recipient account exists
      try {
        const recipientBalance = await rpcManager.getBalance(address);
        const newIsNewAccount = recipientBalance === 0;
        setIsNewAccount(newIsNewAccount);

        // After validating address, update fee estimation
        await updateFeeEstimation(newIsNewAccount);

        setIsAddressValid(true);
        return true;
      } catch (error) {
        console.error('Failed to check recipient account:', error);
        setIsAddressValid(false);
        setRecipientError('Failed to verify recipient account');
        return false;
      }
    } catch {
      setRecipientError('Invalid Solana address');
      setIsAddressValid(false);
      return false;
    }
  };

  const updateFeeEstimation = async (isNew: boolean): Promise<void> => {
    if (!wallet) return;

    try {
      // Create a dummy transaction to estimate fees
      const recentBlockhash = await rpcManager.getRecentBlockhash();
      const transaction = new Transaction({ recentBlockhash });

      // Add transfer instruction
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: new PublicKey(wallet.publicKey),
          toPubkey: new PublicKey(wallet.publicKey),
          lamports: LAMPORTS_PER_SOL / 100,
        })
      );

      // If it's a new account, add second transfer instruction
      if (isNew) {
        transaction.add(
          SystemProgram.transfer({
            fromPubkey: new PublicKey(wallet.publicKey),
            toPubkey: new PublicKey(wallet.publicKey),
            lamports: RENT_EXEMPT_MINIMUM,
          })
        );
      }

      const fee = await rpcManager.getFeeForMessage(transaction.compileMessage());
      if (fee !== null) {
        setEstimatedFee((fee * SAFETY_MARGIN) / LAMPORTS_PER_SOL);
      }
    } catch (error) {
      console.error('Failed to estimate fee:', error);
      // Fallback to default fee estimate
      setEstimatedFee((LAMPORTS_PER_SIGNATURE * SAFETY_MARGIN * (isNew ? 2 : 1)) / LAMPORTS_PER_SOL);
    }
  };

  const validateAmount = useCallback((amount: string): boolean => {
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setAmountError('Amount must be greater than 0');
      return false;
    }
    if (balance === undefined) {
      setAmountError('Unable to validate amount: balance unknown');
      return false;
    }

    const rentExemptCost = isNewAccount ? RENT_EXEMPT_MINIMUM / LAMPORTS_PER_SOL : 0;
    const totalCost = parsedAmount + estimatedFee + rentExemptCost;
    if (totalCost > balance) {
      setAmountError('Insufficient balance (including fees and rent-exempt minimum)');
      return false;
    }
    setAmountError(null);
    return true;
  }, [balance, estimatedFee, isNewAccount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wallet) {
      toast({
        title: "Error",
        description: "No wallet selected",
        variant: "destructive",
      });
      return;
    }

    // Validate inputs
    if (!isAddressValid) {
      setRecipientError('Please enter a valid recipient address');
      return;
    }

    const isValidAmount = validateAmount(amount);
    if (!isValidAmount) {
      return;
    }

    // Show confirmation dialog
    setShowConfirmation(true);
  };

  const handleSetMaxAmount = () => {
    if (!isAddressValid || balance === undefined || balance <= estimatedFee) return;

    const rentExemptCost = isNewAccount ? RENT_EXEMPT_MINIMUM / LAMPORTS_PER_SOL : 0;

    // Leave a small buffer (0.001 SOL) to ensure transaction doesn't fail
    const safetyBuffer = 0.001;
    const maxAmount = balance - estimatedFee - rentExemptCost - safetyBuffer;

    if (maxAmount <= 0) {
      setAmountError('Insufficient balance for fees and rent-exempt minimum');
      return;
    }

    // Round down to 6 decimal places to avoid floating-point precision issues
    const roundedMaxAmount = Math.floor(maxAmount * 1000000) / 1000000;
    setAmount(roundedMaxAmount.toFixed(6));
    validateAmount(roundedMaxAmount.toString());
  };

  const handleConfirmSend = async () => {
    if (!wallet || !isAddressValid) return;

    setIsLoading(true);
    try {
      // Get recent blockhash
      const recentBlockhash = await rpcManager.getRecentBlockhash();

      // Create transaction
      const transaction = new Transaction({ recentBlockhash });

      // Calculate exact amount in lamports (round down to ensure no overflow)
      const amountLamports = Math.floor(parseFloat(amount) * LAMPORTS_PER_SOL);

      // For all accounts, just use transfer
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: new PublicKey(wallet.publicKey),
          toPubkey: new PublicKey(address),
          lamports: amountLamports + (isNewAccount ? RENT_EXEMPT_MINIMUM : 0),
        })
      );

      // Get keypair from private key
      const keypair = getKeypairFromPrivateKey(wallet.privateKey);

      // Sign and send transaction
      transaction.sign(keypair);
      const signature = await rpcManager.sendTransaction(transaction);

      // Show success toast
      toast({
        title: "Success",
        description: `Transaction sent successfully.`,
      });

      // Open explorer in new tab
      window.open(`https://solana.fm/tx/${signature}?cluster=mainnet-beta`, '_blank');

      // Navigate back to dashboard
      navigate('/');
    } catch (error) {
      console.error('Transaction failed:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send transaction",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setShowConfirmation(false);
    }
  };

  if (!wallet) {
    return (
      <div className="card">
        <h2 className="text-xl font-bold mb-6">Send</h2>
        <p className="text-red-500">No wallet selected</p>
      </div>
    );
  }

  return (
    <>
      <div className="card">
        <h2 className="text-xl font-bold mb-6">Send SOL</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">From</label>
            <div className="input-primary w-full p-2 flex justify-between items-center">
              <span>{wallet.name || 'Unnamed Wallet'}</span>
              <span className="text-gray-500">{balance !== undefined ? `${balance.toFixed(9)} SOL` : '...'}</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Recipient Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => {
                setAddress(e.target.value);
                setIsAddressValid(false); // Reset validity on change
              }}
              onBlur={() => address && validateRecipientAddress(address)}
              className={`input-primary w-full ${recipientError ? 'border-red-500' : ''}`}
              placeholder="Enter Solana address"
              required
            />
            {recipientError && (
              <p className="mt-1 text-sm text-red-500">{recipientError}</p>
            )}
            {isAddressValid && (
              <p className="mt-1 text-sm text-green-500">
                {isNewAccount ? 'New account - rent exempt minimum will be added' : 'Valid address'}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Amount</label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  validateAmount(e.target.value);
                }}
                className={`input-primary w-full ${amountError ? 'border-red-500' : ''}`}
                placeholder="0.00"
                step="any"
                required
                disabled={!isAddressValid}
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-solana-green hover:opacity-80"
                onClick={handleSetMaxAmount}
                disabled={!isAddressValid || balance === undefined || balance <= estimatedFee}
              >
                MAX
              </button>
            </div>
            {amountError && (
              <p className="mt-1 text-sm text-red-500">{amountError}</p>
            )}
          </div>

          <div>
            <div className="flex justify-between text-sm mb-4">
              <span className="text-gray-400">Network Fee</span>
              <span>~{estimatedFee.toFixed(6)} SOL</span>
            </div>
            {isNewAccount && (
              <div className="flex justify-between text-sm mb-4">
                <span className="text-gray-400">Rent-exempt Minimum</span>
                <span>{(RENT_EXEMPT_MINIMUM / LAMPORTS_PER_SOL).toFixed(6)} SOL</span>
              </div>
            )}
            <button
              type="submit"
              className="btn-primary w-full"
              disabled={isLoading || balance === undefined || !isAddressValid || !!amountError || amount === ''}
            >
              {isLoading ? 'Sending...' : 'Send'}
            </button>
          </div>
        </form>
      </div>

      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Confirm Transaction</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Amount</p>
                <p className="font-medium">{amount} SOL</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">To</p>
                <p className="font-medium break-all">{address}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Network Fee</p>
                <p className="font-medium">{estimatedFee.toFixed(6)} SOL</p>
              </div>
              {isNewAccount && (
                <div>
                  <p className="text-sm text-gray-500">Rent-exempt Minimum</p>
                  <p className="font-medium">{(RENT_EXEMPT_MINIMUM / LAMPORTS_PER_SOL).toFixed(6)} SOL</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500">Total</p>
                <p className="font-medium">
                  {(parseFloat(amount) + estimatedFee + (isNewAccount ? RENT_EXEMPT_MINIMUM / LAMPORTS_PER_SOL : 0)).toFixed(9)} SOL
                </p>
              </div>
            </div>
            <div className="flex space-x-4 mt-6">
              <button
                onClick={() => setShowConfirmation(false)}
                className="flex-1 btn-secondary"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSend}
                className="flex-1 btn-primary"
                disabled={isLoading}
              >
                {isLoading ? 'Sending...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}