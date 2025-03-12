import React, { useRef, useEffect, useState } from 'react';

interface PinInputProps {
  value?: string;
  onChange?: (value: string) => void;
  onComplete?: (value: string) => void;
  error?: boolean;
  disabled?: boolean;
  id?: string;
  autoFocus?: boolean;
}

export default function PinInput({
  value: initialValue = '',
  onChange,
  onComplete,
  error,
  disabled,
  id,
  autoFocus = false
}: PinInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [value, setValue] = useState(initialValue);
  const PIN_LENGTH = 6;

  // Create an array of the current pin values, padded with empty strings
  const pinArray = value.split('').concat(Array(PIN_LENGTH - value.length).fill(''));

  const handleClick = () => {
    inputRef.current?.focus();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    // Only allow numbers and limit to PIN_LENGTH digits
    if (/^\d*$/.test(newValue) && newValue.length <= PIN_LENGTH) {
      setValue(newValue);
      onChange?.(newValue);
      // If PIN is complete, call onComplete
      if (newValue.length === PIN_LENGTH) {
        onComplete?.(newValue);
        // Move focus to the next input
        const nextInput = e.target.form?.querySelector<HTMLInputElement>(`input:not([id="${id}"])`);
        nextInput?.focus();
      }
    }
  };

  // Focus input on mount only if autoFocus is true
  useEffect(() => {
    if (autoFocus && !disabled) {
      inputRef.current?.focus();
    }
  }, [autoFocus, disabled]);

  return (
    <div className="relative" onClick={handleClick}>
      {/* Hidden input field that handles the actual input */}
      <input
        ref={inputRef}
        type="number"
        inputMode="numeric"
        pattern="\d*"
        value={value}
        onChange={handleChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-10"
        disabled={disabled}
        id={id}
        required
      />

      {/* Visual PIN boxes */}
      <div className="grid grid-cols-6 gap-2">
        {pinArray.map((digit, index) => (
          <div
            key={index}
            className={`
              h-12 w-12 flex items-center justify-center
              border-2 rounded-lg text-2xl font-bold
              ${error
                ? 'border-red-500 bg-red-500/10'
                : digit
                  ? 'border-solana-green bg-solana-green/10'
                  : index === value.length && isFocused
                    ? 'border-solana-green'
                    : 'border-gray-600 bg-solana-dark'
              }
              ${disabled ? 'opacity-50' : ''}
              transition-all duration-200
              relative
            `}
          >
            {digit ? (
              '•'
            ) : (
              index === value.length && isFocused && !disabled && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-0.5 h-6 bg-solana-green pin-input-cursor"></div>
                </div>
              )
            )}
          </div>
        ))}
      </div>
    </div>
  );
}