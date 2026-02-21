import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Validação de segurança na inicialização
import '@/config/security'
import '@/config/security-warnings'


// Sistema de captura global de erros
import { setupGlobalErrorHandlers } from '@/utils/errorHandler'
import ErrorBoundary from '@/components/ErrorBoundary'

// Inicializar handlers globais de erro
setupGlobalErrorHandlers();

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
