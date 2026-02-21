import { useState } from 'react';
import { Users, Plus, Upload, Lock, Download } from 'lucide-react';

import PageHeader from '@/components/admin/PageHeader';
import { Button } from '@/components/ui/button';
import ContatosGrid from '@/components/admin/contatos/ContatosGrid';
import { EditContactModal } from '@/components/admin/whatsapp/contacts/EditContactModal';
import ImportContactsModal from '@/components/admin/contatos/ImportContactsModal';
import ExportContactsModal from '@/components/admin/contatos/ExportContactsModal';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from '@/lib/toast';
import PermissionGuard from '@/components/admin/permissions/PermissionGuard';

const ContatosWhatsApp = () => {
  const [isContatoModalOpen, setIsContatoModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [selectedContatoId, setSelectedContatoId] = useState<string | null>(null);
  const { hasPermission } = usePermissionGuard();

  const canCreate = hasPermission('admin.whatsapp.contatos.criar');
  const canEdit = hasPermission('admin.whatsapp.contatos.editar');
  const canImport = hasPermission('admin.whatsapp.contatos.importar');
  const canExport = hasPermission('admin.whatsapp.contatos.exportar');

  const handleEdit = (contato: any) => {
    if (!canEdit) {
      toast.error('Você não tem permissão para editar contatos');
      return;
    }
    setSelectedContatoId(contato.id);
    setIsContatoModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsContatoModalOpen(false);
    setSelectedContatoId(null);
  };

  const handleSuccess = () => {
    window.location.reload();
  };

  const handleOpenCreateModal = () => {
    if (!canCreate) {
      toast.error('Você não tem permissão para criar contatos');
      return;
    }
    setIsContatoModalOpen(true);
  };

  const handleOpenImportModal = () => {
    if (!canImport) {
      toast.error('Você não tem permissão para importar contatos');
      return;
    }
    setIsImportModalOpen(true);
  };

  const handleOpenExportModal = () => {
    if (!canExport) {
      toast.error('Você não tem permissão para exportar contatos');
      return;
    }
    setIsExportModalOpen(true);
  };

  return (
    <>
      <PermissionGuard 
        permissions="admin.whatsapp.contatos.visualizar"
        showMessage={true}
      >
        <div className="flex flex-col h-full">
          <PageHeader
            title="Contatos WhatsApp" 
            subtitle="Gerencie seus contatos do WhatsApp"
            icon={Users}
            breadcrumbs={[
              { label: "Dashboard", href: "/" },
              { label: "WhatsApp", href: "/whatsapp" },
              { label: "Contatos" }
            ]}
            actions={
              <div className="flex gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>
                        <Button 
                          variant="outline" 
                          onClick={handleOpenExportModal} 
                          size="sm"
                          disabled={!canExport}
                        >
                          {canExport ? <Download className="h-4 w-4 mr-2" /> : <Lock className="h-4 w-4 mr-2" />}
                          Exportar
                        </Button>
                      </span>
                    </TooltipTrigger>
                    {!canExport && (
                      <TooltipContent>
                        <p>Você não tem permissão para exportar contatos</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>
                        <Button 
                          variant="outline" 
                          onClick={handleOpenImportModal} 
                          size="sm"
                          disabled={!canImport}
                        >
                          {canImport ? <Upload className="h-4 w-4 mr-2" /> : <Lock className="h-4 w-4 mr-2" />}
                          Importar
                        </Button>
                      </span>
                    </TooltipTrigger>
                    {!canImport && (
                      <TooltipContent>
                        <p>Você não tem permissão para importar contatos</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>
                        <Button 
                          onClick={handleOpenCreateModal} 
                          size="sm"
                          disabled={!canCreate}
                        >
                          {canCreate ? <Plus className="h-4 w-4 mr-2" /> : <Lock className="h-4 w-4 mr-2" />}
                          Novo Contato
                        </Button>
                      </span>
                    </TooltipTrigger>
                    {!canCreate && (
                      <TooltipContent>
                        <p>Você não tem permissão para criar contatos</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              </div>
            }
          />
          
          <div className="flex-1 min-h-0 p-6">
            <ContatosGrid onEdit={handleEdit} />
          </div>
        </div>

        {canCreate && (
          <EditContactModal
            open={isContatoModalOpen && !selectedContatoId}
            onClose={handleCloseModal}
            contactId={null}
            onSuccess={handleSuccess}
          />
        )}

        {canEdit && (
          <EditContactModal
            open={isContatoModalOpen && !!selectedContatoId}
            onClose={handleCloseModal}
            contactId={selectedContatoId}
            onSuccess={handleSuccess}
          />
        )}

        {canImport && (
          <ImportContactsModal
            isOpen={isImportModalOpen}
            onClose={() => setIsImportModalOpen(false)}
          />
        )}

        {canExport && (
          <ExportContactsModal
            isOpen={isExportModalOpen}
            onClose={() => setIsExportModalOpen(false)}
          />
        )}
      </PermissionGuard>
    </>
  );
};

export default ContatosWhatsApp;
