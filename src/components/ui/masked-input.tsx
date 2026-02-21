
import * as React from "react";
import InputMask from "react-input-mask";
import { cn } from "@/lib/utils";

export interface MaskedInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "mask" | "maskChar"> {
  mask: string;
  maskChar?: string | null;
  alwaysShowMask?: boolean;
}

const MaskedInput = React.forwardRef<HTMLInputElement, MaskedInputProps>(
  ({ className, mask, maskChar = "_", alwaysShowMask = false, ...props }, ref) => {
    return (
      <InputMask
        mask={mask}
        maskChar={maskChar}
        alwaysShowMask={alwaysShowMask}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        inputRef={ref}
        {...props}
      />
    );
  }
);
MaskedInput.displayName = "MaskedInput";

export { MaskedInput };
