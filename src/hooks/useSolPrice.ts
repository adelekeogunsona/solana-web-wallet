import { useState, useEffect } from 'react';

interface SolPriceData {
  amount: string;
  base: string;
  currency: string;
}

interface SolPriceResponse {
  data: SolPriceData;
}

interface CachedPrice {
  price: number;
  timestamp: number;
}

const CACHE_KEY = 'solana-wallet:sol-price';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

function getCachedPrice(): CachedPrice | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const { price, timestamp } = JSON.parse(cached);
    const now = Date.now();

    // Return null if cache has expired
    if (now - timestamp > CACHE_DURATION) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }

    return { price, timestamp };
  } catch {
    return null;
  }
}

function setCachedPrice(price: number) {
  try {
    const cacheData: CachedPrice = {
      price,
      timestamp: Date.now(),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
  } catch {
    // Ignore cache write errors
  }
}

export function useSolPrice() {
  const [price, setPrice] = useState<number | null>(() => {
    // Initialize from cache if available
    const cached = getCachedPrice();
    return cached?.price ?? null;
  });
  const [loading, setLoading] = useState(!price); // Only show loading if no cached price
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        // Check cache first
        const cached = getCachedPrice();
        if (cached) {
          setPrice(cached.price);
          setLoading(false);
          return;
        }

        const response = await fetch('https://api.coinbase.com/v2/prices/SOL-USD/spot');
        if (!response.ok) {
          throw new Error('Failed to fetch SOL price');
        }
        const data: SolPriceResponse = await response.json();
        const newPrice = parseFloat(data.data.amount);

        setPrice(newPrice);
        setCachedPrice(newPrice);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch SOL price');
        // Keep using cached price if available, only set to null if no cache
        if (!getCachedPrice()) {
          setPrice(null);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPrice();
    // Refresh price every 60 seconds, but only if cache has expired
    const interval = setInterval(() => {
      const cached = getCachedPrice();
      if (!cached) {
        fetchPrice();
      }
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  return { price, loading, error };
}