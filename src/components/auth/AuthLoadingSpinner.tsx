
import { Loader2 } from 'lucide-react';

interface AuthLoadingSpinnerProps {
  message?: string;
}

const AuthLoadingSpinner = ({ message = "Verificando autenticação..." }: AuthLoadingSpinnerProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-100/30">
      <div className="text-center">
        <div className="relative">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <div className="absolute inset-0 h-8 w-8 border-2 border-blue-200 rounded-full animate-pulse mx-auto"></div>
        </div>
        <p className="text-slate-600 text-sm">{message}</p>
      </div>
    </div>
  );
};

export default AuthLoadingSpinner;
