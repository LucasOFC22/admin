import { useState } from "react";
import { useNavigate } from "react-router-dom";

import MaloteCard from "@/components/malote/MaloteCard";
import MaloteForm from "@/components/malote/MaloteForm";
import MaloteView from "@/components/malote/MaloteView";
import SendSignatureModal from "@/components/malote/SendSignatureModal";
import { useMalotes } from "@/hooks/useMalotes";
import { Malote } from "@/types/malote";
import { Button } from "@/components/ui/button";
import { Plus, FileText, Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useNotification } from "@/hooks/useCustomNotifications";
import { usePermissionGuard } from "@/hooks/usePermissionGuard";
import PermissionGuard from "@/components/admin/permissions/PermissionGuard";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AdminTab } from "@/config/adminSidebarConfig";

type ViewMode = 'list' | 'create' | 'edit' | 'view';

const Malotes = () => {
  const navigate = useNavigate();
  const notification = useNotification();
  const { hasPermission } = usePermissionGuard();
  const { malotes, isLoading, addMalote, updateMalote, deleteMalote, getMalote, enviarLinkAssinatura } = useMalotes();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedMalote, setSelectedMalote] = useState<Malote | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchNumero, setSearchNumero] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [signatureModalOpen, setSignatureModalOpen] = useState(false);
  const [signatureMalote, setSignatureMalote] = useState<Malote | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const canCreate = hasPermission('admin.malotes.criar');
  const canEdit = hasPermission('admin.malotes.editar');
  const canDelete = hasPermission('admin.malotes.excluir');

  const filteredMalotes = malotes.filter(m => {
    const matchMotorista = m.motorista.toLowerCase().includes(searchTerm.toLowerCase());
    const matchNumero = searchNumero ? m.numero?.toString().includes(searchNumero) : true;
    return matchMotorista && matchNumero;
  });

  const handleCreate = () => {
    setSelectedMalote(null);
    setViewMode('create');
  };

  const handleView = (id: string) => {
    const malote = getMalote(id);
    if (malote) {
      setSelectedMalote(malote);
      setViewMode('view');
    }
  };

  const handleEdit = (id: string) => {
    const malote = getMalote(id);
    if (malote) {
      if (malote.assinado) {
        notification.error('Ação bloqueada', 'Malote já assinado não pode ser editado');
        return;
      }
      setSelectedMalote(malote);
      setViewMode('edit');
    }
  };

  const handlePrint = (id: string) => {
    const malote = getMalote(id);
    if (malote) {
      setSelectedMalote(malote);
      setViewMode('view');
      setTimeout(() => window.print(), 100);
    }
  };

  const handleSave = async (maloteData: Omit<Malote, 'id' | 'createdAt' | 'updatedAt' | 'assinado'>) => {
    setIsSaving(true);
    try {
      if (selectedMalote) {
        await updateMalote(selectedMalote.id, maloteData);
        notification.success('Sucesso', 'Malote atualizado com sucesso!');
      } else {
        await addMalote(maloteData);
        notification.success('Sucesso', 'Malote criado com sucesso!');
      }
      setViewMode('list');
      setSelectedMalote(null);
    } catch (error) {
      notification.error('Erro', 'Falha ao salvar malote. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    const malote = getMalote(id);
    if (malote?.assinado) {
      notification.error('Ação bloqueada', 'Malote já assinado não pode ser excluído');
      return;
    }
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (deleteId) {
      try {
        await deleteMalote(deleteId);
        notification.success('Sucesso', 'Malote excluído com sucesso!');
      } catch (error) {
        notification.error('Erro', 'Falha ao excluir malote. Tente novamente.');
      }
      setDeleteId(null);
    }
  };

  const handleSendSignature = (id: string) => {
    const malote = getMalote(id);
    if (malote) {
      setSignatureMalote(malote);
      setSignatureModalOpen(true);
    }
  };

  const handleSendSignatureConfirm = async (maloteId: string, telefone: string) => {
    try {
      await enviarLinkAssinatura(maloteId, telefone);
      notification.success('Enviado!', 'Link de assinatura enviado com sucesso via WhatsApp');
    } catch (error) {
      notification.error('Erro no envio', 'Não foi possível enviar o link de assinatura. Verifique o número e tente novamente.');
      throw error; // Re-throw para o modal saber que falhou
    }
  };

  const handleCancel = () => {
    setViewMode('list');
    setSelectedMalote(null);
  };

  const handleTabChange = (tab: AdminTab) => {
    navigate(`/${tab === 'dashboard' ? '' : tab}`);
  };

  return (
    
      <PermissionGuard 
        permissions="admin.malotes.visualizar"
        showMessage={true}
      >
        <div className="p-6">
          {viewMode === 'list' && (
          <div className="animate-fade-in">
            {/* Barra de ações */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Malotes de Viagem</h2>
                <p className="text-muted-foreground mt-1">
                  {malotes.length} malote(s) cadastrado(s)
                </p>
              </div>
              {canCreate && (
                <Button onClick={handleCreate} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Novo Malote
                </Button>
              )}
            </div>

            {/* Busca */}
            <div className="flex gap-3 mb-6">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por motorista..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Input
                placeholder="Nº Malote"
                value={searchNumero}
                onChange={(e) => setSearchNumero(e.target.value)}
                className="w-32"
              />
            </div>

            {/* Loading */}
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : filteredMalotes.length === 0 ? (
              <div className="bg-card border border-border rounded-lg p-12 text-center">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {searchTerm ? 'Nenhum malote encontrado' : 'Nenhum malote cadastrado'}
                </h3>
                <p className="text-muted-foreground mb-6">
                  {searchTerm 
                    ? 'Tente buscar com outros termos' 
                    : 'Clique em "Novo Malote" para criar o primeiro'}
                </p>
                {!searchTerm && (
                  <Button onClick={handleCreate} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Criar Malote
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredMalotes.map((malote) => (
                  <MaloteCard
                    key={malote.id}
                    malote={malote}
                    onView={handleView}
                    onEdit={canEdit ? handleEdit : undefined}
                    onPrint={handlePrint}
                    onDelete={canDelete ? handleDelete : undefined}
                    onSendSignature={handleSendSignature}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {(viewMode === 'create' || viewMode === 'edit') && (
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-6">
              {viewMode === 'create' ? 'Novo Malote' : 'Editar Malote'}
            </h2>
            <MaloteForm
              initialData={selectedMalote || undefined}
              onSave={handleSave}
              onCancel={handleCancel}
              isLoading={isSaving}
            />
          </div>
        )}

        {viewMode === 'view' && selectedMalote && (
          <MaloteView
            malote={selectedMalote}
            onBack={handleCancel}
            onPrint={() => window.print()}
          />
        )}
      </div>

      {/* Modal de envio de assinatura */}
      <SendSignatureModal
        open={signatureModalOpen}
        onClose={() => {
          setSignatureModalOpen(false);
          setSignatureMalote(null);
        }}
        malote={signatureMalote}
        onSend={handleSendSignatureConfirm}
      />

        {/* Dialog de confirmação de exclusão */}
        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir este malote? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </PermissionGuard>
    
  );
};

export default Malotes;
