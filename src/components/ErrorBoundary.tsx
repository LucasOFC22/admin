import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { logErrorToDatabase } from '@/hooks/useErrorLogger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  async componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary capturou erro:', error, errorInfo);

    // Registrar erro no banco de dados
    await logErrorToDatabase({
      titulo: error.name || 'Erro React',
      descricao: error.message || 'Erro desconhecido',
      categoria: 'react',
      nivel: 'error',
      dados_extra: {
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        errorInfo: errorInfo
      }
    });
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-red-100 p-4 rounded-full">
                <AlertTriangle className="h-12 w-12 text-red-600" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Algo deu errado
            </h1>
            <p className="text-gray-600 mb-6">
              Ocorreu um erro inesperado. O erro foi registrado e nossa equipe será notificada.
            </p>
            {this.state.error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-left">
                <p className="text-sm font-mono text-red-800 break-words">
                  {this.state.error.message}
                </p>
              </div>
            )}
            <div className="space-y-3">
              <Button
                onClick={this.handleReload}
                className="w-full bg-red-600 hover:bg-red-700"
              >
                Recarregar Página
              </Button>
              <Button
                onClick={() => window.history.back()}
                variant="outline"
                className="w-full"
              >
                Voltar
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
