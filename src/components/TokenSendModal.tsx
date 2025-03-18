import { useState, useContext, useEffect, useCallback } from 'react';
import { AuthContext } from '../context/authContextTypes';
import { useToast } from '@/hooks/useToast';
import { rpcManager } from '../utils/rpc';
import {
  LAMPORTS_PER_SOL,
  PublicKey,
  Transaction
} from '@solana/web3.js';
import {
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
  createTransferInstruction
} from '@solana/spl-token';
import { getKeypairFromPrivateKey } from '../utils/wallet';
import { TokenData } from '@/hooks/useTokens';

interface TokenSendModalProps {
  walletId?: string;
  token: TokenData;
  isOpen: boolean;
  onClose: () => void;
}

const LAMPORTS_PER_SIGNATURE = 5000; // Base fee per signature
const SAFETY_MARGIN = 2; // Multiply gas fee by this for safety margin

// Minimum lamports needed for a token account (approximate, could vary)
const TOKEN_ACCOUNT_RENT_EXEMPTION = 2500000;

export default function TokenSendModal({
  walletId,
  token,
  isOpen,
  onClose
}: TokenSendModalProps) {
  const { toast } = useToast();
  const { wallets } = useContext(AuthContext);
  const [amount, setAmount] = useState('');
  const [address, setAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [estimatedFee, setEstimatedFee] = useState<number>(LAMPORTS_PER_SIGNATURE / LAMPORTS_PER_SOL);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [recipientError, setRecipientError] = useState<string | null>(null);
  const [amountError, setAmountError] = useState<string | null>(null);
  const [isAddressValid, setIsAddressValid] = useState(false);
  const [sourceTokenAccount, setSourceTokenAccount] = useState<string | null>(null);

  const wallet = wallets?.find(w => w.id === walletId);

  // Reset form when opened or token changes
  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setAddress('');
      setAmountError(null);
      setRecipientError(null);
      setIsAddressValid(false);
      setShowConfirmation(false);
    }
  }, [isOpen, token.mint]);

  // Fetch source token account when component mounts or token changes
  useEffect(() => {
    const fetchSourceTokenAccount = async () => {
      if (!wallet || !isOpen) return;

      try {
        const tokenAccounts = await rpcManager.getTokenAccounts(wallet.publicKey);
        const sourceAccount = tokenAccounts.find(acc => acc.mint === token.mint);

        if (sourceAccount) {
          setSourceTokenAccount(sourceAccount.pubkey.toString());
        } else {
          toast({
            title: "Error",
            description: "Token account not found",
            variant: "destructive",
          });
          onClose();
        }
      } catch (error) {
        console.error('Failed to fetch token accounts:', error);
        toast({
          title: "Error",
          description: "Failed to fetch token accounts",
          variant: "destructive",
        });
        onClose();
      }
    };

    if (isOpen) {
      fetchSourceTokenAccount();
    }
  }, [wallet, token.mint, toast, onClose, isOpen]);

  // Estimate network fee
  useEffect(() => {
    const estimateFee = async () => {
      if (!wallet || !isOpen) return;

      try {
        // Get recent blockhash - just to see if RPC is working
        await rpcManager.getRecentBlockhash();

        // Add estimated cost for potentially creating a token account
        const estimatedBase = LAMPORTS_PER_SIGNATURE * SAFETY_MARGIN;
        const estimatedTotal = estimatedBase + TOKEN_ACCOUNT_RENT_EXEMPTION;

        setEstimatedFee(estimatedTotal / LAMPORTS_PER_SOL);
      } catch (error) {
        console.error('Failed to estimate fee:', error);
        // Default: include signature fee + token account rent
        const estimatedTotal = (LAMPORTS_PER_SIGNATURE * SAFETY_MARGIN) + TOKEN_ACCOUNT_RENT_EXEMPTION;
        setEstimatedFee(estimatedTotal / LAMPORTS_PER_SOL);
      }
    };

    if (isOpen) {
      estimateFee();
    }
  }, [wallet, isOpen]);

  const validateRecipientAddress = async (address: string): Promise<boolean> => {
    // Clear amount when address changes
    setAmount('');
    setAmountError(null);

    try {
      // Validate address format
      new PublicKey(address);
      setRecipientError(null);
      setIsAddressValid(true);
      return true;
    } catch {
      setRecipientError('Invalid Solana address');
      setIsAddressValid(false);
      return false;
    }
  };

  const validateAmount = useCallback((amount: string): boolean => {
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setAmountError('Amount must be greater than 0');
      return false;
    }

    if (parsedAmount > token.balance) {
      setAmountError('Insufficient token balance');
      return false;
    }

    setAmountError(null);
    return true;
  }, [token.balance]);

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
    if (!isAddressValid) return;

    setAmount(token.balance.toString());
    validateAmount(token.balance.toString());
  };

  const handleConfirmSend = async () => {
    if (!wallet || !isAddressValid || !sourceTokenAccount) return;

    setIsLoading(true);
    try {
      // Check wallet SOL balance first to ensure we have enough for rent
      const solBalance = await rpcManager.getBalance(wallet.publicKey);
      const solBalanceInLamports = solBalance * LAMPORTS_PER_SOL;

      if (solBalanceInLamports < TOKEN_ACCOUNT_RENT_EXEMPTION + LAMPORTS_PER_SIGNATURE * SAFETY_MARGIN) {
        throw new Error("Insufficient SOL balance to pay for account creation");
      }

      // Get recipient public key
      const recipientPublicKey = new PublicKey(address);

      // Get recent blockhash
      const recentBlockhash = await rpcManager.getRecentBlockhash();

      // Create transaction
      const transaction = new Transaction({ recentBlockhash });

      // Check if the destination already has a token account for this mint
      let destinationTokenAccount: PublicKey;
      let needsAccountCreation = false;

      try {
        // Get the associated token address for the recipient
        const mintPublicKey = new PublicKey(token.mint);
        destinationTokenAccount = await getAssociatedTokenAddress(
          mintPublicKey,
          recipientPublicKey
        );

        // Check if account exists
        const accountInfo = await rpcManager.getAccountInfo(destinationTokenAccount.toString());

        // If account doesn't exist, create it
        if (!accountInfo) {
          console.log("Creating associated token account for recipient");
          needsAccountCreation = true;
          // Add instruction to create associated token account
          transaction.add(
            createAssociatedTokenAccountInstruction(
              new PublicKey(wallet.publicKey), // payer
              destinationTokenAccount,         // associated token account address
              recipientPublicKey,              // owner
              mintPublicKey                    // mint
            )
          );
        }
      } catch (error) {
        console.error('Error with token account:', error);
        throw new Error("Failed to process token account");
      }

      // Convert amount to the smallest unit based on decimals
      const adjustedAmount = Math.floor(parseFloat(amount) * Math.pow(10, token.decimals));

      // Add transfer instruction
      transaction.add(
        createTransferInstruction(
          new PublicKey(sourceTokenAccount),  // source
          destinationTokenAccount,            // destination
          new PublicKey(wallet.publicKey),    // owner
          adjustedAmount                      // amount (in raw units)
        )
      );

      // Get keypair from private key
      const keypair = getKeypairFromPrivateKey(wallet.privateKey);

      // Sign and send transaction
      transaction.sign(keypair);
      const signature = await rpcManager.sendTransaction(transaction);

      // Show success toast
      toast({
        title: "Success",
        description: needsAccountCreation
          ? `Token transfer successful. Created new token account for recipient.`
          : `Token transfer successful.`,
      });

      // Open explorer in new tab
      window.open(`https://solana.fm/tx/${signature}?cluster=mainnet-beta`, '_blank');

      // Close the form and go back
      onClose();
    } catch (error) {
      console.error('Transaction failed:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send tokens",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setShowConfirmation(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full mx-4 shadow-xl">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Send {token.symbol}</h2>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {!showConfirmation ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">From</label>
                <div className="input-primary w-full p-2 flex justify-between items-center">
                  <span>{wallet?.name || 'Unnamed Wallet'}</span>
                  <span className="text-gray-500">{token.balance.toFixed(token.decimals)} {token.symbol}</span>
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
                  <p className="mt-1 text-sm text-green-500">Valid address</p>
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
                    disabled={!isAddressValid}
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
                <button
                  type="submit"
                  className="btn-primary w-full"
                  disabled={isLoading || !isAddressValid || !!amountError || amount === ''}
                >
                  {isLoading ? 'Sending...' : 'Send'}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Amount</p>
                  <p className="font-medium">{amount} {token.symbol}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">To</p>
                  <p className="font-medium break-all">{address}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Network Fee</p>
                  <p className="font-medium">{estimatedFee.toFixed(6)} SOL</p>
                </div>
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={() => setShowConfirmation(false)}
                  className="flex-1 btn-secondary"
                  disabled={isLoading}
                >
                  Back
                </button>
                <button
                  onClick={handleConfirmSend}
                  className="flex-1 btn-primary"
                  disabled={isLoading}
                >
                  {isLoading ? 'Sending...' : 'Confirm Send'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}