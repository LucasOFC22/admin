import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { errorLogService } from '@/services/error/errorLogService';
import { devLog } from '@/utils/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorId: string | null;
}

export class ErrorBoundary extends Component<Props, State> {
  private errorId: string = '';

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorId: null
    };
  }

  async componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    devLog.error('❌ Error Boundary capturou erro:', error, errorInfo);

    // Log do erro no Supabase
    try {
      await errorLogService.logError({
        titulo: error.name || 'Erro React',
        descricao: error.message,
        categoria: 'react',
        nivel: 'error',
        dados_extra: {
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString()
        }
      });
    } catch (logError) {
      devLog.error('❌ Erro ao salvar log de erro:', logError);
    }

    // Callback personalizado se fornecido
    this.props.onError?.(error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorId: null
    });
  };

  render() {
    if (this.state.hasError) {
      // Fallback customizado se fornecido
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Fallback padrão
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="max-w-md w-full mx-4 p-6 bg-card rounded-lg border shadow-lg text-center space-y-4">
            <div className="flex justify-center">
              <AlertTriangle className="h-16 w-16 text-destructive" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-xl font-semibold text-foreground">
                Oops! Algo deu errado
              </h1>
              <p className="text-sm text-muted-foreground">
                Ocorreu um erro inesperado na aplicação. Nossa equipe foi notificada automaticamente.
              </p>
              {this.state.errorId && (
                <p className="text-xs text-muted-foreground font-mono bg-muted p-2 rounded">
                  ID do Erro: {this.state.errorId}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Button 
                onClick={this.handleRetry}
                className="w-full"
                variant="default"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Tentar Novamente
              </Button>
              
              <div className="flex gap-2">
                <Button 
                  onClick={this.handleReload}
                  variant="outline"
                  className="flex-1"
                >
                  Recarregar Página
                </Button>
                
                <Button 
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="flex-1"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Início
                </Button>
              </div>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="text-xs text-left bg-muted p-3 rounded">
                <summary className="cursor-pointer font-medium">
                  Detalhes do Erro (Desenvolvimento)
                </summary>
                <pre className="mt-2 whitespace-pre-wrap break-words">
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook para usar ErrorBoundary programaticamente
export const useErrorHandler = () => {
  const logError = async (error: Error, context?: any) => {
    devLog.error('❌ Erro capturado:', error);
    
    try {
      await errorLogService.logError({
        titulo: error.name || 'Erro JavaScript',
        descricao: error.message,
        categoria: 'javascript',
        nivel: 'error',
        dados_extra: {
          stack: error.stack,
          context,
          url: window.location.href,
          timestamp: new Date().toISOString()
        }
      });
    } catch (logError) {
      devLog.error('❌ Erro ao salvar log:', logError);
    }
  };

  return { logError };
};