import { useNavigate } from 'react-router-dom';
import { AdminTab, tabMapping } from '@/config/adminSidebarConfig';

// URLs externas para redirecionamento
const EXTERNAL_URLS: Record<string, string> = {
  'email': 'https://email.fptranscargas.com.br',
};

export const useAdminSidebarNavigation = () => {
  const navigate = useNavigate();

  const handleItemClick = (itemId: string, setActiveTab: (tab: AdminTab) => void, isMobile: boolean, setSidebarOpen: (open: boolean) => void) => {
    // Verificar se é uma URL externa
    if (EXTERNAL_URLS[itemId]) {
      window.open(EXTERNAL_URLS[itemId], '_blank');
      return;
    }

    if (tabMapping[itemId]) {
      if (isMobile) {
        setSidebarOpen(false);
      }
      
      setActiveTab(tabMapping[itemId]);
      
      // Mapeamento de rotas sem prefixo /admin
      const routeMap: Record<string, string> = {
        'dashboard': '/',
        'contacts': '/contatos',
        'cotacoes': '/cotacoes',
        'whatsapp': '/whatsapp',
        'whatsapp-kanban': '/whatsapp-kanban',
        'filas-whatsapp': '/whatsapp-kanban',
        'tags-kanban': '/tags-kanban',
        'whatsapp-contatos': '/whatsapp-contatos',
        'reports': '/relatorios',
        'cliente-acesso': '/clientes-acesso',
        'erros-envio': '/erros-envio',
        'usuarios': '/usuarios',
        'gerenciar-usuarios': '/gerenciar-usuarios',
        'cargos': '/cargos',
        'logs': '/logs',
        'ranking': '/ranking-clientes',
        'configuracoes': '/configuracoes',
        'consultar-nfe': '/consultar-nfe',
        'coletas': '/coletas',
        'manifestos': '/manifestos',
        'rastreamento': '/rastreamento',
        'malotes': '/malotes',
        'erros': '/error-logs',
        'contas-receber': '/contas-receber',
        'calendario-financeiro': '/calendario-financeiro',
        'dre': '/dre',
        'solicitacoes-documentos': '/solicitacoes-documentos',
        'documentos-clientes': '/documentos-clientes',
        'ocorrencias': '/ocorrencias',
        'mensagens-rapidas': '/mensagens-rapidas',
        'chat-interno': '/chatinterno',
        'solicitacoes-acessos': '/solicitacoes-acessos',
        'conexoes': '/conexoes',
        'flowbuilders': '/flowbuilders',
        'whatsapp-logs': '/whatsapp-logs',
        'logs-atividades': '/logs-atividades',
        'logs-mensagens-rapidas': '/logs-mensagens-rapidas',
        'logs-ocorrencias': '/logs-ocorrencias',
        'logs-central': '/logs-central',
        'logs-autenticacao': '/logs-autenticacao',
        'logs-email': '/logs-email',
        'flow-logs': '/flow-logs',
        'logs-usuarios': '/logs-usuarios',
        'logs-cargos': '/logs-cargos',
        'logs-contatos': '/logs-contatos',
        'logs-configuracoes': '/logs-configuracoes',
        'logs-chat-interno': '/logs-chat-interno',
        'logs-malotes': '/logs-malotes',
        'logs-conexoes': '/logs-conexoes',
        'logs-tags': '/logs-tags',
        'logs-documentos': '/logs-documentos',
        'logs-filas': '/logs-filas',
        'logs-sistema': '/logs-sistema',
        'campanhas-whatsapp': '/campanhas-whatsapp',
        'logs-campanhas': '/logs-campanhas',
        'vagas': '/vagas',
        'logs-vagas': '/logs-vagas',
        'baixa-rapida-cte': '/baixa-rapida-cte',
        'logs-coleta': '/logs-coleta',
        'auditoria-seguranca': '/auditoria-seguranca',
      };

      const route = routeMap[itemId] || '/';
      navigate(route);
    }
  };

  return { handleItemClick };
};
