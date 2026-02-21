import { ReactNode } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';

interface BaseFieldProps {
  label: string;
  name: string;
  required?: boolean;
  error?: string;
  description?: string;
  className?: string;
}

interface InputFieldProps extends BaseFieldProps {
  type: 'input';
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  inputType?: 'text' | 'email' | 'password' | 'tel';
}

interface TextareaFieldProps extends BaseFieldProps {
  type: 'textarea';
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}

interface SwitchFieldProps extends BaseFieldProps {
  type: 'switch';
  checked: boolean;
  onChange: (checked: boolean) => void;
  activeText?: string;
  inactiveText?: string;
}

interface CustomFieldProps extends BaseFieldProps {
  type: 'custom';
  children: ReactNode;
}

type FormFieldProps = InputFieldProps | TextareaFieldProps | SwitchFieldProps | CustomFieldProps;

export const FormField = (props: FormFieldProps) => {
  const { label, name, required, error, description, className = '' } = props;

  const renderField = () => {
    switch (props.type) {
      case 'input':
        return (
          <Input
            id={name}
            name={name}
            type={props.inputType || 'text'}
            value={props.value}
            onChange={(e) => props.onChange(e.target.value)}
            placeholder={props.placeholder}
            required={required}
            className="h-11 border-2 border-border/50 focus:border-primary/60 transition-all duration-200 bg-background/50"
          />
        );

      case 'textarea':
        return (
          <Textarea
            id={name}
            name={name}
            value={props.value}
            onChange={(e) => props.onChange(e.target.value)}
            placeholder={props.placeholder}
            rows={props.rows || 4}
            required={required}
            className="border-2 border-border/50 focus:border-primary/60 transition-all duration-200 bg-background/50 resize-none"
          />
        );

      case 'switch':
        return (
          <div className="flex items-center justify-between p-5 border-2 border-border/50 rounded-xl bg-gradient-to-r from-accent/10 to-accent/5 hover:from-accent/15 hover:to-accent/10 transition-all duration-300">
            <div className="space-y-1.5">
              <Label htmlFor={name} className="text-sm font-semibold text-foreground flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${props.checked ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
                {label}
              </Label>
              {(props.activeText || props.inactiveText) && (
                <p className="text-sm text-muted-foreground/80">
                  {props.checked ? props.activeText : props.inactiveText}
                </p>
              )}
              {description && (
                <p className="text-sm text-muted-foreground/60">
                  {description}
                </p>
              )}
            </div>
            <Switch
              id={name}
              checked={props.checked}
              onCheckedChange={props.onChange}
              className="data-[state=checked]:bg-primary"
            />
          </div>
        );

      case 'custom':
        return props.children;

      default:
        return null;
    }
  };

  if (props.type === 'switch') {
    return (
      <div className={`space-y-3 ${className}`}>
        {renderField()}
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <Label htmlFor={name} className="text-sm font-semibold text-foreground">
        {label} {required && '*'}
      </Label>
      {renderField()}
      {description && !error && (
        <p className="text-sm text-muted-foreground/60">{description}</p>
      )}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
};