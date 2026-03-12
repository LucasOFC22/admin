import { useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AdminTab, tabMapping } from '@/config/adminSidebarConfig';

// Mapeamento de rotas para tabs (sem prefixo /admin - admin está na raiz)
const routeToTabMapping: Record<string, AdminTab> = {
  '/': 'dashboard',
  '/perfil': 'dashboard',
  '/cotacoes': 'cotacoes',
  '/whatsapp': 'whatsapp',
  '/whatsapp-kanban': 'whatsapp-kanban',
  '/whatsapp-filas': 'filas-whatsapp',
  '/whatsapp-logs': 'whatsapp-logs',
  '/tags-kanban': 'tags-kanban',
  '/erros-envio': 'erros-envio',
  '/coletas': 'coletas',
  '/gerenciar-usuarios': 'gerenciar-usuarios',
  '/usuarios': 'gerenciar-usuarios',
  '/clientes-acesso': 'gerenciar-usuarios',
  '/configuracoes': 'configuracoes',
  '/contatos': 'contacts',
  '/cargos': 'cargos',
  '/consultar-nfe': 'consultar-nfe',
  '/manifestos': 'manifestos',
  '/error-logs': 'erros',
  '/contas-receber': 'contas-receber',
  '/calendario-financeiro': 'calendario-financeiro',
  '/dre': 'dre',
  '/solicitacoes-documentos': 'solicitacoes-documentos',
  '/documentos-clientes': 'documentos-clientes',
  '/ocorrencias': 'ocorrencias',
  '/mensagens-rapidas': 'mensagens-rapidas',
  '/solicitacoes-acessos': 'solicitacoes-acessos',
  '/flowbuilders': 'flowbuilders',
  '/flow-logs': 'flow-logs',
  '/conexoes': 'conexoes',
  '/chatinterno': 'chat-interno',
  '/whatsapp-contatos': 'whatsapp-contatos',
  '/malotes': 'malotes',
  '/logs-atividades': 'logs-atividades',
  '/erros': 'erros',
  '/logs-mensagens-rapidas': 'logs-mensagens-rapidas',
  '/logs-ocorrencias': 'logs-ocorrencias',
  '/logs-central': 'logs-central',
  '/logs-autenticacao': 'logs-autenticacao',
  '/logs-email': 'logs-email',
  '/logs-usuarios': 'logs-usuarios',
  '/logs-cargos': 'logs-cargos',
  '/logs-contatos': 'logs-contatos',
  '/logs-configuracoes': 'logs-configuracoes',
  '/logs-chat-interno': 'logs-chat-interno',
  '/logs-malotes': 'logs-malotes',
  '/logs-conexoes': 'logs-conexoes',
  '/logs-tags': 'logs-tags',
  '/logs-documentos': 'logs-documentos',
  '/logs-filas': 'logs-filas',
  '/logs-sistema': 'logs-sistema',
  '/campanhas-whatsapp': 'campanhas-whatsapp',
  '/logs-campanhas': 'logs-campanhas',
  '/email': 'email',
  '/vagas': 'vagas',
  '/logs-vagas': 'logs-vagas',
  '/rastreamento': 'rastreamento',
  '/baixa-rapida-cte': 'baixa-rapida-cte',
  '/auditoria-seguranca': 'auditoria-seguranca'
};

// Mapeamento de tabs para rotas (usado no setActiveTab - sem prefixo /admin)
const tabToRouteMapping: Record<AdminTab, string> = {
  'dashboard': '/',
  'email': '/email',
  'contacts': '/contatos',
  'cotacoes': '/cotacoes',
  'whatsapp': '/whatsapp',
  'whatsapp-kanban': '/whatsapp-kanban',
  'filas-whatsapp': '/whatsapp-filas',
  'tags-kanban': '/tags-kanban',
  'whatsapp-contatos': '/whatsapp-contatos',
  'reports': '/relatorios',
  'cliente-acesso': '/gerenciar-usuarios',
  'erros-envio': '/erros-envio',
  'usuarios': '/gerenciar-usuarios',
  'gerenciar-usuarios': '/gerenciar-usuarios',
  'cargos': '/cargos',
  'rastreamento': '/rastreamento',
  'logs': '/logs-central',
  'ranking': '/ranking-clientes',
  'configuracoes': '/configuracoes',
  'consultar-nfe': '/consultar-nfe',
  'coletas': '/coletas',
  'manifestos': '/manifestos',
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
  'logs-contatos': '/logs-contatos',
  'logs-configuracoes': '/logs-configuracoes',
  'logs-chat-interno': '/logs-chat-interno',
  'logs-malotes': '/logs-malotes',
  'logs-flow-builder': '/flowbuilders',
  'logs-conexoes': '/logs-conexoes',
  'logs-cargos': '/logs-cargos',
  'logs-tags': '/logs-tags',
  'logs-documentos': '/logs-documentos',
  'logs-filas': '/logs-filas',
  'logs-sistema': '/logs-sistema',
  'campanhas-whatsapp': '/campanhas-whatsapp',
  'logs-campanhas': '/logs-campanhas',
  'vagas': '/vagas',
  'logs-vagas': '/logs-vagas',
  'baixa-rapida-cte': '/baixa-rapida-cte',
  'auditoria-seguranca': '/auditoria-seguranca'
};

export function useActiveAdminTab() {
  const location = useLocation();
  const navigate = useNavigate();

  // Determinar a tab ativa baseado na rota atual
  const activeTab = useMemo((): AdminTab => {
    const pathname = location.pathname;
    
    // Verificar correspondência exata primeiro
    if (routeToTabMapping[pathname]) {
      return routeToTabMapping[pathname];
    }
    
    // Verificar rotas com parâmetros dinâmicos (sem prefixo /admin)
    if (pathname.startsWith('/whatsapp/')) {
      return 'whatsapp';
    }
    if (pathname.startsWith('/flowbuilders/')) {
      return 'flowbuilders';
    }
    if (pathname.startsWith('/chatinterno/')) {
      return 'chat-interno';
    }
    if (pathname.startsWith('/email/')) {
      return 'email';
    }
    
    // Default para dashboard
    return 'dashboard';
  }, [location.pathname]);

  // Função para mudar a tab (navega para a rota correspondente)
  const setActiveTab = useCallback((tab: AdminTab) => {
    const route = tabToRouteMapping[tab];
    if (route && route !== location.pathname) {
      navigate(route);
    }
  }, [navigate, location.pathname]);

  return { activeTab, setActiveTab };
}
