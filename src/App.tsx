import { Suspense, type ReactNode } from "react";
import { Toaster } from "@/components/ui/toaster";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import PageLoader from "@/components/ui/page-loader";
import { AppProviders } from "@/contexts/AppProviders";
import ScrollToTop from "@/components/ScrollToTop";

// ProtectedRoute com autenticação cross-domain
import ProtectedRoute from "@/components/ProtectedRoute";

// Layout Admin
import AdminPersistentLayout from "@/layouts/AdminPersistentLayout";

// Páginas de erro
import NotFound from "./pages/NotFound";
import Forbidden from "./pages/Forbidden";
import ServerError from "./pages/ServerError";

// Páginas Admin
import AdminDashboardContent from "./pages/admin-content/AdminDashboardContent";
import CotacoesContent from "./pages/admin-content/CotacoesContent";
import WhatsAppTickets from "./pages/WhatsAppTickets";
import WhatsAppKanban from "./pages/WhatsAppKanban";
import ContatosWhatsApp from "./pages/ContatosWhatsApp";
import WhatsAppFilas from "./pages/admin/WhatsAppFilas";
import WhatsAppLogs from "./pages/admin/WhatsAppLogs";
import WhatsAppCampanhas from "./pages/admin/WhatsAppCampanhas";
import TagsKanban from "./pages/admin/TagsKanban";
import ColetasAdmin from "./pages/ColetasAdmin";
import BaixaRapidaCte from "./pages/admin/BaixaRapidaCte";
import UnifiedUsersPage from "./pages/UnifiedUsersPage";
import AdminContacts from "./pages/AdminContacts";
import Cargos from "./pages/Cargos";
import Configuracoes from "./pages/Configuracoes";
import ConsultarNFe from "./pages/ConsultarNFe";
import Manifestos from "./pages/Manifestos";
import Conhecimentos from "./pages/Conhecimentos";
import ErrorLogs from "./pages/ErrorLogs";
import ErrosEnvio from "./pages/ErrosEnvio";
import ContasReceber from "./pages/admin/ContasReceber";
import CalendarioFinanceiro from "./pages/admin/CalendarioFinanceiro";
import DRE from "./pages/admin/DRE";
import SolicitacoesDocumentos from "./pages/SolicitacoesDocumentos";
import DocumentosClientes from "./pages/admin/DocumentosClientes";
import Ocorrencias from "./pages/Ocorrencias";
import MensagensRapidas from "./pages/MensagensRapidas";
import SolicitacoesAcessos from "./pages/SolicitacoesAcessos";
import FlowBuilders from "./pages/FlowBuilders";
import FlowBuilderEdit from "./pages/FlowBuilderEdit";
import FlowExecutionLogsPage from "./pages/admin/FlowExecutionLogsPage";
import ConexoesPage from "./pages/admin/ConexoesPage";
import ChatInterno from "./pages/ChatInterno";
import Malotes from "./pages/admin/Malotes";
import FichaCNPJ from "./pages/FichaCNPJ";
import Profile from "./pages/Profile";

// Email Config (mantido para gerenciamento)
import EmailConfigPage from "./pages/admin/EmailConfigPage";

// Logs
import LogsAtividades from "./pages/admin/LogsAtividades";
import LogsCentral from "./pages/admin/LogsCentral";
import LogsAutenticacao from "./pages/admin/LogsAutenticacao";
import LogsEmail from "./pages/admin/LogsEmail";
import LogsUsuarios from "./pages/admin/LogsUsuarios";
import LogsCargos from "./pages/admin/LogsCargos";
import LogsContatos from "./pages/admin/LogsContatos";
import LogsConfiguracoes from "./pages/admin/LogsConfiguracoes";
import LogsChatInterno from "./pages/admin/LogsChatInterno";
import LogsMalotes from "./pages/admin/LogsMalotes";
import LogsConexoes from "./pages/admin/LogsConexoes";
import LogsTags from "./pages/admin/LogsTags";
import LogsDocumentos from "./pages/admin/LogsDocumentos";
import LogsFilasWhatsApp from "./pages/admin/LogsFilasWhatsApp";
import LogsSistema from "./pages/admin/LogsSistema";
import LogsCampanhas from "./pages/admin/LogsCampanhas";
import LogsMensagensRapidas from "./pages/admin/LogsMensagensRapidas";
import LogsOcorrencias from "./pages/admin/LogsOcorrencias";
import LogsVagas from "./pages/admin/LogsVagas";
import VagasPage from "./pages/admin/VagasPage";
import Erros from "./pages/admin/Erros";
import AdminRastreamento from "./pages/admin/AdminRastreamento";
import AuditoriaSeguranca from "./pages/admin/AuditoriaSeguranca";

// QueryClient fora do componente para evitar recriações
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 10,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AppProviders>
      <Toaster />
      <BrowserRouter future={{ v7_relativeSplatPath: true }}>
        <ScrollToTop />
        <Routes>
          {/* Rota principal - Layout persistente com rotas aninhadas */}
          <Route path="/" element={
            <ProtectedRoute requiredAccess="admin">
              <Suspense fallback={<PageLoader />}>
                <AdminPersistentLayout />
              </Suspense>
            </ProtectedRoute>
          }>
            <Route index element={<AdminDashboardContent />} />
            <Route path="perfil" element={<Profile />} />
            <Route path="cotacoes" element={<CotacoesContent />} />
            
            {/* WhatsApp */}
            <Route path="whatsapp" element={<WhatsAppTickets />} />
            <Route path="whatsapp/:ticketId" element={<WhatsAppTickets />} />
            <Route path="whatsapp-contatos" element={<ContatosWhatsApp />} />
            <Route path="whatsapp-filas" element={<WhatsAppFilas />} />
            <Route path="whatsapp-logs" element={<WhatsAppLogs />} />
            <Route path="campanhas-whatsapp" element={<WhatsAppCampanhas />} />
            <Route path="tags-kanban" element={<TagsKanban />} />
            
            {/* Operacional */}
            <Route path="coletas" element={<ColetasAdmin />} />
            <Route path="consultar-nfe" element={<ConsultarNFe />} />
            <Route path="manifestos" element={<Manifestos />} />
            <Route path="conhecimentos" element={<Conhecimentos />} />
            <Route path="malotes" element={<Malotes />} />
            <Route path="ocorrencias" element={<Ocorrencias />} />
            <Route path="rastreamento" element={<AdminRastreamento />} />
            <Route path="baixa-rapida-cte" element={<BaixaRapidaCte />} />
            <Route path="erros-envio" element={<ErrosEnvio />} />
            
            {/* Usuários e Acessos */}
            <Route path="gerenciar-usuarios" element={<UnifiedUsersPage />} />
            <Route path="usuarios" element={<UnifiedUsersPage />} />
            <Route path="clientes-acesso" element={<UnifiedUsersPage />} />
            <Route path="contatos" element={<AdminContacts />} />
            <Route path="cargos" element={<Cargos />} />
            <Route path="solicitacoes-acessos" element={<SolicitacoesAcessos />} />
            <Route path="solicitacoes-documentos" element={<SolicitacoesDocumentos />} />
            <Route path="documentos-clientes" element={<DocumentosClientes />} />
            <Route path="vagas" element={<VagasPage />} />
            <Route path="ficha-cnpj/:cnpj" element={<FichaCNPJ />} />
            
            {/* Configurações */}
            <Route path="configuracoes" element={<Configuracoes />} />
            <Route path="mensagens-rapidas" element={<MensagensRapidas />} />
            <Route path="conexoes" element={<ConexoesPage />} />
            
            {/* Financeiro */}
            <Route path="contas-receber" element={<ContasReceber />} />
            <Route path="calendario-financeiro" element={<CalendarioFinanceiro />} />
            <Route path="dre" element={<DRE />} />
            
            {/* FlowBuilder */}
            <Route path="flowbuilders" element={<FlowBuilders />} />
            <Route path="flowbuilders/:id" element={<FlowBuilderEdit />} />
            <Route path="flow-logs" element={<FlowExecutionLogsPage />} />
            
            {/* Comunicação */}
            <Route path="chatinterno" element={<ChatInterno />} />
            <Route path="chatinterno/:conversationId" element={<ChatInterno />} />
            <Route path="email-config" element={<EmailConfigPage />} />
            
            {/* Erros e Logs */}
            <Route path="error-logs" element={<ErrorLogs />} />
            <Route path="erros" element={<Erros />} />
            <Route path="logs-atividades" element={<LogsAtividades />} />
            <Route path="logs-central" element={<LogsCentral />} />
            <Route path="logs-autenticacao" element={<LogsAutenticacao />} />
            <Route path="logs-email" element={<LogsEmail />} />
            <Route path="logs-usuarios" element={<LogsUsuarios />} />
            <Route path="logs-cargos" element={<LogsCargos />} />
            <Route path="logs-contatos" element={<LogsContatos />} />
            <Route path="logs-configuracoes" element={<LogsConfiguracoes />} />
            <Route path="logs-chat-interno" element={<LogsChatInterno />} />
            <Route path="logs-malotes" element={<LogsMalotes />} />
            <Route path="logs-conexoes" element={<LogsConexoes />} />
            <Route path="logs-tags" element={<LogsTags />} />
            <Route path="logs-documentos" element={<LogsDocumentos />} />
            <Route path="logs-filas" element={<LogsFilasWhatsApp />} />
            <Route path="logs-sistema" element={<LogsSistema />} />
            <Route path="logs-campanhas" element={<LogsCampanhas />} />
            <Route path="logs-mensagens-rapidas" element={<LogsMensagensRapidas />} />
            <Route path="logs-ocorrencias" element={<LogsOcorrencias />} />
            <Route path="logs-vagas" element={<LogsVagas />} />
            <Route path="auditoria-seguranca" element={<AuditoriaSeguranca />} />
          </Route>

          {/* WhatsApp Kanban - FORA do PersistentLayout */}
          
          <Route path="/whatsapp-kanban" element={
            <ProtectedRoute requiredAccess="admin">
              <Suspense fallback={<PageLoader />}>
                <AdminPersistentLayout />
              </Suspense>
            </ProtectedRoute>
          }>
            <Route index element={<WhatsAppKanban />} />
          </Route>
          
          {/* Páginas de erro */}
          <Route path="/forbidden" element={<Forbidden />} />
          <Route path="/server-error" element={<ServerError />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AppProviders>
  </QueryClientProvider>
);

export default App;
