import { useState, KeyboardEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CnpjCpfChipsInputProps {
  values: string[];
  onChange: (values: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

const CnpjCpfChipsInput = ({
  values,
  onChange,
  disabled = false,
  placeholder = 'Digite CPF ou CNPJ',
  className
}: CnpjCpfChipsInputProps) => {
  const [inputValue, setInputValue] = useState('');

  const handleAdd = () => {
    const trimmed = inputValue.trim();
    if (trimmed && !values.includes(trimmed)) {
      onChange([...values, trimmed]);
      setInputValue('');
    }
  };

  const handleRemove = (index: number) => {
    onChange(values.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex gap-2">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleAdd}
          disabled={disabled || !inputValue.trim()}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      
      {values.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {values.map((value, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="flex items-center gap-1.5 px-2.5 py-1 text-sm"
            >
              {value}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

export default CnpjCpfChipsInput;
