import { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Settings, Save, RefreshCw, Shield, Globe, Building2, MessageCircle, FileText, Truck, Menu, Mail, Search, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import EmpresasConfigSection from '@/components/admin/configuracoes/EmpresasConfigSection';
import { useToast } from '@/hooks/use-toast';
import QuoteSystemConfig from '@/components/admin/configuracoes/QuoteSystemConfig';
import DepartmentConfigTab from '@/components/admin/configuracoes/DepartmentConfigTab';
import WhatsAppKanbanConfig from '@/components/admin/configuracoes/WhatsAppKanbanConfig';
import PermissionsConfig from '@/components/admin/configuracoes/PermissionsConfig';
import MalotesConfigTab from '@/components/admin/configuracoes/MalotesConfigTab';
import EmailConfigTab from '@/components/admin/configuracoes/EmailConfigTab';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { configService, SystemConfig } from '@/services/supabase/configService';
import { authActivityLogService } from '@/services/auth/activityLogService';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { useActivityLogger } from '@/hooks/useActivityLogger';
import PermissionGuard from '@/components/admin/permissions/PermissionGuard';
import { logService } from '@/services/logger/logService';
interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
}
interface NavGroup {
  title: string;
  items: NavItem[];
}
const navigationGroups: NavGroup[] = [{
  title: 'Sistema',
  items: [{
    id: 'system',
    label: 'Geral',
    icon: Globe,
    description: 'Modo manutenção, primeiro login'
  }, {
    id: 'permissoes',
    label: 'Permissões',
    icon: Shield,
    description: 'Controle de acesso e papéis'
  }]
}, {
  title: 'Negócios',
  items: [{
    id: 'cotacoes',
    label: 'Cotações',
    icon: FileText,
    description: 'Sistema de orçamentos'
  }, {
    id: 'cargos',
    label: 'Cargos',
    icon: Building2,
    description: 'Departamentos e funções'
  }, {
    id: 'malotes',
    label: 'Malotes',
    icon: Truck,
    description: 'Logística e entregas'
  }]
}, {
  title: 'Comunicação',
  items: [{
    id: 'email',
    label: 'Email',
    icon: Mail,
    description: 'Configurações de email'
  }, {
    id: 'whatsapp',
    label: 'WhatsApp',
    icon: MessageCircle,
    description: 'Integração com WhatsApp'
  }]
}];
// Helper para obter todas as IDs de seções válidas
const validSectionIds = navigationGroups.flatMap(g => g.items.map(i => i.id));

const Configuracoes = () => {
  const { toast } = useToast();
  const { user } = useUnifiedAuth();
  const { logActivity } = useActivityLogger();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [systemConfig, setSystemConfig] = useState<SystemConfig>({
    manuntecao: false,
    primeiro_login: true,
    painel_adm: true,
    painel_cliente: true
  });

  // Extrair seção do hash da URL
  const getActiveSection = () => {
    const hash = location.hash.replace('#', '');
    // Verificar se é uma seção válida ou sub-aba (ex: whatsapp-conta)
    const mainSection = hash.split('-')[0];
    if (validSectionIds.includes(hash)) return hash;
    if (validSectionIds.includes(mainSection)) return mainSection;
    return 'system';
  };

  const activeSection = getActiveSection();
  useEffect(() => {
    const loadSystemConfig = async () => {
      try {
        const config = await configService.getConfig();
        setSystemConfig(config);
        await logActivity({
          acao: 'configuracoes_visualizadas',
          modulo: 'configuracoes',
          detalhes: {
            pagina: 'configuracoes_sistema'
          }
        });
      } catch (error) {
        console.error('Erro ao carregar configurações:', error);
        toast({
          title: "Aviso",
          description: "Não foi possível carregar as configurações. Usando valores padrão.",
          variant: "default"
        });
      }
    };
    loadSystemConfig();
  }, [toast, logActivity]);
  const handleSaveSystem = async () => {
    setLoading(true);
    try {
      const oldConfig = await configService.getConfig();
      await configService.saveConfig(systemConfig);
      
      // Log para logs_configuracoes
      await logService.logConfiguracao({
        modulo: 'sistema_geral',
        tipo_de_acao: oldConfig.id ? 'editar' : 'criar',
        dados_anteriores: oldConfig as unknown as Record<string, unknown>,
        dados_novos: systemConfig as unknown as Record<string, unknown>
      });
      
      if (user?.id) {
        await authActivityLogService.logActivity({
          usuario_id: user.id,
          acao: 'configuracao_sistema_alterada',
          modulo: 'configuracoes',
          detalhes: {
            configuracoes_antigas: oldConfig,
            configuracoes_novas: systemConfig,
            campos_alterados: Object.keys(systemConfig).filter(key => oldConfig[key] !== systemConfig[key])
          }
        });
      }
      toast({
        title: "Sucesso",
        description: "Configurações do sistema salvas com sucesso!"
      });
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar as configurações.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const handleSectionChange = (sectionId: string) => {
    navigate(`#${sectionId}`, { replace: true });
    setMobileMenuOpen(false);
    logActivity({
      acao: 'aba_visualizada',
      modulo: 'configuracoes',
      detalhes: {
        aba: sectionId
      }
    });
  };
  const renderContent = () => {
    switch (activeSection) {
      case 'system':
        return <div className="space-y-6">
            <div className="border-b pb-4">
              <h2 className="text-xl font-semibold text-foreground">Configurações Gerais</h2>
              <p className="text-sm text-muted-foreground mt-1">Configure as informações básicas do sistema</p>
            </div>
            
            <div className="space-y-1">
              {/* Setting Row 1 */}
              <SettingRow label="Modo Manutenção" description="Desabilita o acesso público ao sistema" action={<Switch checked={systemConfig.manuntecao} onCheckedChange={checked => setSystemConfig(prev => ({
              ...prev,
              manuntecao: checked
            }))} />} />

              {/* Setting Row 2 */}
              <SettingRow label="Primeiro Login" description="Obriga no primeiro login trocar a senha" action={<Switch checked={systemConfig.primeiro_login} onCheckedChange={checked => setSystemConfig(prev => ({
              ...prev,
              primeiro_login: checked
            }))} />} />

              {/* Setting Row 3 */}
              <SettingRow label="Painel Administrativo" description="Habilita acesso ao painel administrativo" action={<Switch checked={systemConfig.painel_adm} onCheckedChange={checked => setSystemConfig(prev => ({
              ...prev,
              painel_adm: checked
            }))} />} />

              {/* Setting Row 4 */}
              <SettingRow label="Painel Cliente" description="Habilita acesso ao painel do cliente" action={<Switch checked={systemConfig.painel_cliente} onCheckedChange={checked => setSystemConfig(prev => ({
              ...prev,
              painel_cliente: checked
            }))} />} />
            </div>

            <EmpresasConfigSection />

            <div className="flex justify-end pt-6 border-t">
              <Button onClick={handleSaveSystem} disabled={loading}>
                {loading ? <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </> : <>
                    <Save className="w-4 h-4 mr-2" />
                    Salvar Configurações
                  </>}
              </Button>
            </div>
          </div>;
      case 'cotacoes':
        return <QuoteSystemConfig loading={loading} setLoading={setLoading} />;
      case 'cargos':
        return <DepartmentConfigTab />;
      case 'permissoes':
        return <PermissionsConfig />;
      case 'email':
        return <EmailConfigTab />;
      case 'whatsapp':
        return <WhatsAppKanbanConfig />;
      case 'malotes':
        return <MalotesConfigTab />;
      default:
        return null;
    }
  };
  // Get current section label for mobile header
  const getCurrentSectionLabel = () => {
    for (const group of navigationGroups) {
      const item = group.items.find(i => i.id === activeSection);
      if (item) return item.label;
    }
    return 'Configurações';
  };

  // Filter navigation groups based on search
  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return navigationGroups;
    
    const query = searchQuery.toLowerCase();
    return navigationGroups
      .map(group => ({
        ...group,
        items: group.items.filter(item => 
          item.label.toLowerCase().includes(query) ||
          item.description?.toLowerCase().includes(query) ||
          group.title.toLowerCase().includes(query)
        )
      }))
      .filter(group => group.items.length > 0);
  }, [searchQuery]);

  // Navigation content component to reuse in sidebar and sheet
  const NavigationContent = () => (
    <nav className="p-4 space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar configuração..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 pr-9 h-9 text-sm"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Navigation Groups */}
      {filteredGroups.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          Nenhuma configuração encontrada
        </p>
      ) : (
        filteredGroups.map(group => (
          <div key={group.title}>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
              {group.title}
            </h3>
            <ul className="space-y-1">
              {group.items.map(item => {
                const isActive = activeSection === item.id;
                return (
                  <li key={item.id}>
                    <button 
                      onClick={() => handleSectionChange(item.id)} 
                      className={cn(
                        "w-full flex items-start gap-3 px-3 py-2.5 text-sm rounded-lg transition-colors text-left",
                        isActive 
                          ? "bg-primary/10 text-primary" 
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <span className={cn("block", isActive && "font-medium")}>{item.label}</span>
                        {item.description && (
                          <span className="block text-xs text-muted-foreground mt-0.5 truncate">
                            {item.description}
                          </span>
                        )}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))
      )}
    </nav>
  );

  return (
    <>
      <PermissionGuard 
        permissions="admin.configuracoes.visualizar"
        showMessage={true}
      >
        <div className="flex flex-col h-full overflow-hidden">
        
        {/* Mobile Header */}
        <div className="md:hidden border-b bg-background p-3 flex items-center gap-3">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="h-9 w-9">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <div className="pt-4">
                <NavigationContent />
              </div>
            </SheetContent>
          </Sheet>
          <span className="font-medium text-sm">{getCurrentSectionLabel()}</span>
        </div>
        
        <div className="flex-1 overflow-hidden">
          <div className="flex h-full">
            {/* Sidebar Navigation - Hidden on mobile */}
            <aside className="hidden md:block w-56 border-r bg-background flex-shrink-0">
              <ScrollArea className="h-full">
                <NavigationContent />
              </ScrollArea>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                <motion.div 
                  key={activeSection} 
                  initial={{ opacity: 0, x: 10 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  transition={{ duration: 0.2 }} 
                  className="p-4 sm:p-6 max-w-4xl"
                >
                  {renderContent()}
                </motion.div>
              </ScrollArea>
            </main>
            </div>
          </div>
        </div>
      </PermissionGuard>
    </>
  );
};

// Component for consistent setting rows
interface SettingRowProps {
  label: string;
  description?: string;
  action: React.ReactNode;
}
const SettingRow = ({
  label,
  description,
  action
}: SettingRowProps) => {
  return <div className="flex items-center justify-between py-4 border-b last:border-b-0">
      <div className="flex-1 min-w-0 pr-4">
        <Label className="text-sm font-medium text-foreground">{label}</Label>
        {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <div className="flex-shrink-0">
        {action}
      </div>
    </div>;
};
export default Configuracoes;