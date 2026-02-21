
import { useState } from 'react';
import { Contato } from '@/components/admin/contacts/types';
import { n8nContactService as ContactService } from '@/services/n8n/contactService';
import { useToast } from '@/hooks/use-toast';

export const useContatosActions = () => {
  const [selectedContato, setSelectedContato] = useState<Contato | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isRespondDialogOpen, setIsRespondDialogOpen] = useState(false);
  const { toast } = useToast();

  // Handlers para ações
  const handleViewClick = (contato: Contato) => {
    setSelectedContato(contato);
    setIsViewDialogOpen(true);
  };

  const handleDeleteClick = (contato: Contato) => {
    setSelectedContato(contato);
    setIsDeleteDialogOpen(true);
  };

  const handleRespondClick = (contato: Contato) => {
    setSelectedContato(contato);
    setIsRespondDialogOpen(true);
  };

  const handleArchiveClick = async (contato: Contato) => {
    try {
      // Enviando status 'arquivado' que será mapeado para 'Arquivado' no N8N
      await ContactService.updateContactStatus(contato.id, 'arquivado');
      
      toast({
        title: "Contato arquivado",
        description: `O contato de ${contato.name} foi arquivado com sucesso no N8N.`,
      });
    } catch (error) {
      console.error('Erro ao arquivar contato:', error);
      toast({
        title: "Erro ao arquivar",
        description: error instanceof Error ? error.message : "Não foi possível arquivar o contato.",
        variant: "destructive",
      });
    }
  };

  // Função para marcar como lido removida - não é mais necessária

  const handleSelectContato = (contato: Contato, selectedContatos: string[], setSelectedContatos: (value: string[] | ((prev: string[]) => string[])) => void) => {
    setSelectedContatos(prev => {
      if (prev.includes(contato.id || '')) {
        return prev.filter(id => id !== contato.id);
      } else {
        return [...prev, contato.id || ''];
      }
    });
  };

  const handleSelectAll = (contatos: Contato[] | null, setSelectedContatos: (value: string[]) => void) => {
    if (contatos) {
      setSelectedContatos(contatos.map(c => c.id || ''));
    }
  };

  const handleClearSelection = (setSelectedContatos: (value: string[]) => void) => {
    setSelectedContatos([]);
  };

  const handleBulkAction = (action: string, ids: string[]) => {
    // Implement bulk actions
  };

  return {
    selectedContato,
    isViewDialogOpen,
    setIsViewDialogOpen,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    isRespondDialogOpen,
    setIsRespondDialogOpen,
    handleViewClick,
    handleDeleteClick,
    handleRespondClick,
    handleArchiveClick,
    handleSelectContato,
    handleSelectAll,
    handleClearSelection,
    handleBulkAction
  };
};
