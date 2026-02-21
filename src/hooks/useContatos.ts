import { useState, useEffect } from 'react';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { contactsService, Contact } from '@/services/contactsService';
import { Contato } from '@/components/admin/contacts/types';
import { useToast } from '@/hooks/use-toast';
import { getErrorMessage } from '@/types/errors';
import { useLogging } from '@/hooks/useLogging';

export const useContatos = () => {
  const { user } = useUnifiedAuth();
  const { toast } = useToast();
  const { logContato } = useLogging();
  
  // Estados principais
  const [contatos, setContatos] = useState<Contato[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedContato, setSelectedContato] = useState<Contato | null>(null);
  const [selectedContatos, setSelectedContatos] = useState<string[]>([]);
  
  // Estados de diálogos
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isRespondDialogOpen, setIsRespondDialogOpen] = useState(false);
  
  // Estados de filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [date, setDate] = useState<Date | undefined>();
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Carregar contatos
  const loadContatos = async () => {
    try {
      setIsLoading(true);
      
      let data: Contact[] = [];
      
      if (searchTerm) {
        data = await contactsService.searchContacts(searchTerm);
      } else if (selectedDepartment) {
        data = await contactsService.getContactsByDepartment(selectedDepartment);
      } else if (selectedStatus) {
        data = await contactsService.getContactsByStatus(selectedStatus);
      } else {
        data = await contactsService.getContacts();
      }
      
      const formattedContatos: Contato[] = data.map((contact: Contact) => ({
        id: contact.contact_id.toString(),
        name: contact.name || '',
        email: contact.email || '',
        phone: contact.phone || '',
        department: contact.department || 'comercial',
        subject: contact.subject || '',
        message: contact.message || '',
        status: (contact.status === 'novo' || contact.status === 'em_andamento' || contact.status === 'respondido' || contact.status === 'fechado') 
          ? contact.status as 'novo' | 'em_andamento' | 'respondido' | 'fechado'
          : 'novo',
        source: 'supabase' as const,
        createdAt: contact.created_at || new Date().toISOString()
      }));
      
      if (Array.isArray(formattedContatos)) {
        setContatos(formattedContatos);
      } else {
        setContatos([]);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar contatos:', error);
      setContatos([]);
      toast({
        title: "Erro",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Recarregar dados
  const refetch = () => {
    loadContatos();
  };

  useEffect(() => {
    if (user) {
      loadContatos();
    }
  }, [user, searchTerm, selectedDepartment, selectedLocation, selectedStatus, date]);

  // Handlers
  const handleViewClick = (contato: Contato) => {
    setSelectedContato(contato);
    setIsViewDialogOpen(true);
    
    logContato({
      tipo_de_acao: 'visualizar',
      contato_id: contato.id,
      tipo_contato: contato.department
    });
  };

  const handleDeleteClick = (contato: Contato) => {
    setSelectedContato(contato);
    setIsDeleteDialogOpen(true);
  };

  const handleRespondClick = (contato: Contato) => {
    setSelectedContato(contato);
    setIsRespondDialogOpen(true);
    
    logContato({
      tipo_de_acao: 'responder',
      contato_id: contato.id,
      tipo_contato: contato.department
    });
  };

  const handleArchiveClick = async (contato: Contato) => {
    try {
      await contactsService.markAsArchived(parseInt(contato.id));
      
      await logContato({
        tipo_de_acao: 'arquivar',
        contato_id: contato.id,
        tipo_contato: contato.department,
        dados_anteriores: { status: contato.status },
        dados_novos: { status: 'arquivado' }
      });
      
      toast({
        title: "Sucesso",
        description: "Contato arquivado com sucesso.",
      });
      refetch();
    } catch (error) {
      toast({
        title: "Erro",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    }
  };

  const handleSelectContato = (id: string) => {
    setSelectedContatos(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedContatos.length === contatos.length) {
      setSelectedContatos([]);
    } else {
      setSelectedContatos(contatos.map(c => c.id));
    }
  };

  const handleClearSelection = () => {
    setSelectedContatos([]);
  };

  const handleBulkAction = async (action: string) => {
    if (selectedContatos.length === 0) return;

    try {
      switch (action) {
        case 'archive':
          for (const id of selectedContatos.map(id => parseInt(id))) {
            await contactsService.markAsArchived(id);
          }
          
          await logContato({
            tipo_de_acao: 'arquivar',
            dados_novos: {
              acao: 'arquivamento_em_massa',
              quantidade: selectedContatos.length,
              ids: selectedContatos
            }
          });
          
          toast({
            title: "Sucesso",
            description: `${selectedContatos.length} contatos arquivados.`,
          });
          break;
        case 'mark-responded':
          for (const id of selectedContatos.map(id => parseInt(id))) {
            await contactsService.updateContact(id, { status: 'respondido' });
          }
          
          await logContato({
            tipo_de_acao: 'editar',
            dados_novos: {
              acao: 'marcacao_respondido_em_massa',
              quantidade: selectedContatos.length,
              ids: selectedContatos,
              novo_status: 'respondido'
            }
          });
          
          toast({
            title: "Sucesso",
            description: `${selectedContatos.length} contatos marcados como respondidos.`,
          });
          break;
      }
      
      setSelectedContatos([]);
      refetch();
    } catch (error) {
      toast({
        title: "Erro",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedDepartment('');
    setSelectedLocation('');
    setSelectedStatus('');
    setDate(undefined);
  };

  const hasFiltersApplied = !!(searchTerm || selectedDepartment || selectedLocation || selectedStatus || date);

  return {
    // Estados
    contatos,
    isLoading,
    selectedContato,
    selectedContatos,
    
    // Diálogos
    isViewDialogOpen,
    setIsViewDialogOpen,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    isRespondDialogOpen,
    setIsRespondDialogOpen,
    
    // Filtros
    searchTerm,
    setSearchTerm,
    isFilterOpen,
    setIsFilterOpen,
    date,
    setDate,
    selectedDepartment,
    setSelectedDepartment,
    selectedLocation,
    setSelectedLocation,
    selectedStatus,
    setSelectedStatus,
    viewMode,
    setViewMode,
    
    // Funções
    refetch,
    clearFilters,
    hasFiltersApplied,
    
    // Handlers
    handleViewClick,
    handleDeleteClick,
    handleRespondClick,
    handleArchiveClick,
    handleSelectContato,
    handleSelectAll,
    handleClearSelection,
    handleBulkAction,
    
    // Usuário
    user
  };
};
