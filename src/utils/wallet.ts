import { Buffer } from 'buffer';
import { Keypair } from '@solana/web3.js';
import { mnemonicToSeedSync, generateMnemonic } from 'bip39';
import { derivePath } from 'ed25519-hd-key';
import bs58 from 'bs58';

// Polyfill Buffer
if (typeof window !== 'undefined') {
  window.Buffer = window.Buffer || Buffer;
}

// Constants
// BIP44 derivation path for Solana (44'/501'/0'/0')
// https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki
// Coin type 501 = Solana
const DERIVATION_PATH = "m/44'/501'/0'/0'";

// Helper function to convert hex string to Uint8Array
export function hexToUint8Array(hexString: string): Uint8Array {
  // Remove any non-hex characters (like spaces or 0x prefix)
  const cleanHex = hexString.replace(/[^a-fA-F0-9]/g, '');
  return new Uint8Array(
    cleanHex.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []
  );
}

// Helper function to convert Uint8Array to hex string
export function uint8ArrayToHex(arr: Uint8Array): string {
  return Array.from(arr)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Generate a new mnemonic phrase and keypair
export function generateNewWallet(): { mnemonic: string; keypair: Keypair } {
  // Generate a 12-word mnemonic (128 bits of entropy)
  // This is the standard for Solana wallets
  const mnemonic = generateMnemonic(128);
  const keypair = getKeypairFromMnemonic(mnemonic);
  return { mnemonic, keypair };
}

// Import wallet from mnemonic phrase
export function getKeypairFromMnemonic(mnemonic: string): Keypair {
  try {
    // Validate mnemonic
    const words = mnemonic.trim().split(/\s+/g);
    if (words.length !== 12 && words.length !== 24) {
      throw new Error('Mnemonic must be 12 or 24 words');
    }

    // Generate seed from mnemonic
    const seed = mnemonicToSeedSync(mnemonic);

    // Derive the Ed25519 private key using the correct path for Solana
    const derivedSeed = derivePath(DERIVATION_PATH, seed.toString('hex')).key;

    // Create a Keypair from the derived seed
    return Keypair.fromSeed(derivedSeed.slice(0, 32));
  } catch (error) {
    if (error instanceof Error) {
      throw new Error('Invalid mnemonic: ' + error.message);
    }
    throw new Error('Invalid mnemonic');
  }
}

// Import wallet from private key
export function getKeypairFromPrivateKey(privateKeyString: string): Keypair {
  try {
    let secretKey: Uint8Array;

    // Try to decode as base58 first (most common Solana format)
    try {
      secretKey = bs58.decode(privateKeyString);
    } catch {
      // If not base58, try as hex
      secretKey = hexToUint8Array(privateKeyString);
    }

    // Validate the key length
    if (secretKey.length !== 64) {
      throw new Error('Private key must be 64 bytes');
    }

    return Keypair.fromSecretKey(secretKey);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error('Invalid private key format: ' + error.message);
    }
    throw new Error('Invalid private key format');
  }
}

// Encrypt wallet data
export async function encryptWalletData(data: string, password: string): Promise<string> {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // Derive key from password
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  const derivedKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    key,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt']
  );

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encryptedData = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv
    },
    derivedKey,
    encoder.encode(data)
  );

  // Combine salt, iv, and encrypted data
  const result = new Uint8Array(salt.length + iv.length + new Uint8Array(encryptedData).length);
  result.set(salt, 0);
  result.set(iv, salt.length);
  result.set(new Uint8Array(encryptedData), salt.length + iv.length);

  return uint8ArrayToHex(result);
}

// Decrypt wallet data
export async function decryptWalletData(encryptedData: string, password: string): Promise<string> {
  const decoder = new TextDecoder();
  const data = hexToUint8Array(encryptedData);

  const salt = data.slice(0, 16);
  const iv = data.slice(16, 28);
  const encrypted = data.slice(28);

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  const derivedKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    key,
    { name: 'AES-GCM', length: 256 },
    true,
    ['decrypt']
  );

  const decryptedData = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv
    },
    derivedKey,
    encrypted
  );

  return decoder.decode(decryptedData);
}

// Store encrypted wallet data
export function storeWalletData(encryptedData: string): void {
  localStorage.setItem('wallet_data', encryptedData);
}

// Retrieve encrypted wallet data
export function getStoredWalletData(): string | null {
  return localStorage.getItem('wallet_data');
}

export function generateRandomWalletName(): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  let result = '';
  const length = 8;
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);

  for (let i = 0; i < length; i++) {
    result += characters.charAt(array[i] % characters.length);
  }

  return result;
}