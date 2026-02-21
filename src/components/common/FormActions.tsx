import { Button } from '@/components/ui/button';

interface FormActionsProps {
  onCancel: () => void;
  loading?: boolean;
  submitText?: string;
  loadingText?: string;
  cancelText?: string;
  disabled?: boolean;
  showCancel?: boolean;
  variant?: 'default' | 'destructive';
  className?: string;
}

export const FormActions = ({
  onCancel,
  loading = false,
  submitText = 'Salvar',
  loadingText = 'Salvando...',
  cancelText = 'Cancelar',
  disabled = false,
  showCancel = true,
  variant = 'default',
  className = ''
}: FormActionsProps) => {
  return (
    <div className={`flex justify-end gap-3 pt-4 border-t border-border/50 ${className}`}>
      {showCancel && (
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          disabled={loading}
          className="h-11 px-6 border-2 hover:bg-muted/80 transition-all duration-200"
        >
          {cancelText}
        </Button>
      )}
      <Button 
        type="submit" 
        disabled={loading || disabled}
        variant={variant}
        className={`h-11 px-8 shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-60 ${
          variant === 'default' 
            ? 'bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80' 
            : ''
        }`}
      >
        {loading ? (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            {loadingText}
          </div>
        ) : (
          submitText
        )}
      </Button>
    </div>
  );
};