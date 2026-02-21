import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CustomSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  children: React.ReactNode;
}

interface CustomSelectItemProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

interface CustomSelectContentProps {
  children: React.ReactNode;
  className?: string;
}

interface CustomSelectTriggerProps {
  children: React.ReactNode;
  className?: string;
}

const CustomSelectContext = React.createContext<{
  value: string;
  onValueChange: (value: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  placeholder?: string;
}>({
  value: '',
  onValueChange: () => {},
  isOpen: false,
  setIsOpen: () => {},
});

export const CustomSelect: React.FC<CustomSelectProps> = ({
  value,
  onValueChange,
  placeholder,
  className,
  children
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <CustomSelectContext.Provider value={{ value, onValueChange, isOpen, setIsOpen, placeholder }}>
      <div ref={selectRef} className={cn("relative", className)}>
        {children}
      </div>
    </CustomSelectContext.Provider>
  );
};

export const CustomSelectTrigger: React.FC<CustomSelectTriggerProps> = ({
  children,
  className
}) => {
  const { isOpen, setIsOpen } = React.useContext(CustomSelectContext);

  return (
    <button
      type="button"
      onClick={() => setIsOpen(!isOpen)}
      className={cn(
        "flex h-12 w-full items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-corporate-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200",
        className
      )}
    >
      {children}
      <ChevronDown className={cn("h-4 w-4 opacity-50 transition-transform duration-200", isOpen && "rotate-180")} />
    </button>
  );
};

export const CustomSelectValue: React.FC<{ placeholder?: string }> = ({ placeholder }) => {
  const { value, placeholder: contextPlaceholder } = React.useContext(CustomSelectContext);
  
  if (!value) {
    return <span className="text-muted-foreground">{placeholder || contextPlaceholder}</span>;
  }
  
  return <span>{value}</span>;
};

export const CustomSelectContent: React.FC<CustomSelectContentProps> = ({
  children,
  className
}) => {
  const { isOpen } = React.useContext(CustomSelectContext);

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        "absolute top-full left-0 z-[9999] mt-2 w-full rounded-xl border border-gray-100 bg-white shadow-2xl overflow-hidden backdrop-blur-sm animate-in fade-in-0 zoom-in-95",
        className
      )}
      style={{ position: 'absolute' }}
    >
      <div className="max-h-60 overflow-y-auto p-2">
        {children}
      </div>
    </div>
  );
};

export const CustomSelectItem: React.FC<CustomSelectItemProps> = ({
  value,
  children,
  className
}) => {
  const { value: selectedValue, onValueChange, setIsOpen } = React.useContext(CustomSelectContext);
  const isSelected = selectedValue === value;

  const handleClick = () => {
    onValueChange(value);
    setIsOpen(false);
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        "relative flex w-full cursor-pointer select-none items-center justify-between rounded-md py-3 px-4 text-sm outline-none transition-all duration-200 hover:bg-gradient-to-r hover:from-corporate-50 hover:to-corporate-100 focus:bg-gradient-to-r focus:from-corporate-50 focus:to-corporate-100 text-gray-700 font-medium",
        isSelected && "bg-gradient-to-r from-corporate-100 to-corporate-200",
        className
      )}
    >
      <span>{children}</span>
      {isSelected && (
        <Check className="h-4 w-4 text-corporate-600" />
      )}
    </div>
  );
};