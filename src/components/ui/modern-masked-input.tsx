
import React, { forwardRef, useRef, useImperativeHandle } from 'react';
import { cn } from '@/lib/utils';

interface MaskedInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  mask: string;
  maskChar?: string | null;
  value?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
}

const MaskedInput = forwardRef<HTMLInputElement, MaskedInputProps>(
  ({ mask, maskChar = '_', value = '', onChange, onBlur, className, ...props }, ref) => {
    const inputRef = useRef<HTMLInputElement>(null);

    useImperativeHandle(ref, () => inputRef.current!);

    const applyMask = (inputValue: string): string => {
      if (!mask) return inputValue;
      
      const cleanValue = inputValue.replace(/\D/g, '');
      let maskedValue = '';
      let valueIndex = 0;
      
      for (let i = 0; i < mask.length && valueIndex < cleanValue.length; i++) {
        if (mask[i] === '9') {
          maskedValue += cleanValue[valueIndex];
          valueIndex++;
        } else {
          maskedValue += mask[i];
        }
      }
      
      return maskedValue;
    };

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const maskedValue = applyMask(event.target.value);
      
      if (onChange) {
        const syntheticEvent = {
          ...event,
          target: {
            ...event.target,
            value: maskedValue
          }
        };
        onChange(syntheticEvent);
      }
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
      // Allow backspace, delete, tab, escape, enter
      if ([8, 9, 27, 13, 46].indexOf(event.keyCode) !== -1 ||
          // Allow Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
          (event.keyCode === 65 && event.ctrlKey) ||
          (event.keyCode === 67 && event.ctrlKey) ||
          (event.keyCode === 86 && event.ctrlKey) ||
          (event.keyCode === 88 && event.ctrlKey)) {
        return;
      }
      
      // Ensure that it is a number and stop the keypress
      if ((event.shiftKey || (event.keyCode < 48 || event.keyCode > 57)) && (event.keyCode < 96 || event.keyCode > 105)) {
        event.preventDefault();
      }
    };

    return (
      <input
        ref={inputRef}
        {...props}
        value={applyMask(value)}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={onBlur}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
      />
    );
  }
);

MaskedInput.displayName = "MaskedInput";

export { MaskedInput };
