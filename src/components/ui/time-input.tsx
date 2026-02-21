
import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface TimeInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "onChange"> {
  value?: string;
  onChange?: (value: string) => void;
}

const TimeInput = React.forwardRef<HTMLInputElement, TimeInputProps>(
  ({ className, value, onChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      
      // Format time to HH:MM
      let formattedValue = inputValue.replace(/[^\d:]/g, '');
      
      if (formattedValue.length === 4 && !formattedValue.includes(':')) {
        formattedValue = formattedValue.slice(0, 2) + ':' + formattedValue.slice(2);
      }
      
      if (formattedValue.length > 5) {
        formattedValue = formattedValue.slice(0, 5);
      }
      
      onChange?.(formattedValue);
    };

    return (
      <Input
        ref={ref}
        type="time"
        value={value}
        onChange={handleChange}
        className={cn(className)}
        {...props}
      />
    );
  }
);
TimeInput.displayName = "TimeInput";

export { TimeInput };
