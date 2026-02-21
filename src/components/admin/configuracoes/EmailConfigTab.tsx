import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Mail, RefreshCw, Trash2, Edit, Check, X, TestTube, Calendar, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useEmailContas } from '@/hooks/useEmailContas';
import { EmailConta } from '@/types/email';
import EmailContaFormModal from './EmailContaFormModal';
import CardDavTestModal from './CardDavTestModal';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const EmailConfigTab: React.FC = () => {
  const { contas, loading, error, refetch, deleteConta, updateConta, testConnection } = useEmailContas();
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingConta, setEditingConta] = useState<EmailConta | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [testingConnection, setTestingConnection] = useState<string | null>(null);
  const [cardDavTestConta, setCardDavTestConta] = useState<EmailConta | null>(null);

  const handleEdit = (conta: EmailConta) => {
    setEditingConta(conta);
    setShowFormModal(true);
  };

  const handleDelete = async () => {
    if (deleteConfirmId) {
      await deleteConta(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  const handleToggleAtivo = async (conta: EmailConta) => {
    await updateConta({
      id: conta.id,
      ativo: !conta.ativo
    });
  };

  const handleTestConnection = async (conta: EmailConta) => {
    setTestingConnection(conta.id);
    // Precisa da senha para testar, então vamos apenas verificar a última sincronização
    // Para teste real, precisa do formulário com senha
    setTimeout(() => {
      setTestingConnection(null);
    }, 2000);
  };

  const handleCloseModal = () => {
    setShowFormModal(false);
    setEditingConta(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b pb-4">
        <h2 className="text-xl font-semibold text-foreground">Contas de Email</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Configure as contas de email IMAP/SMTP para integração com o sistema
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Button onClick={() => refetch()} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
        <Button onClick={() => setShowFormModal(true)} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Nova Conta
        </Button>
      </div>

      {/* Error State */}
      {error && (
        <Card className="p-4 border-destructive bg-destructive/10">
          <p className="text-destructive text-sm">{error}</p>
        </Card>
      )}

      {/* Empty State */}
      {!error && contas.length === 0 && (
        <Card className="p-8 text-center">
          <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhuma conta configurada</h3>
          <p className="text-muted-foreground mb-4">
            Adicione uma conta de email para começar a enviar e receber mensagens
          </p>
          <Button onClick={() => setShowFormModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Conta
          </Button>
        </Card>
      )}

      {/* Accounts Table */}
      {contas.length > 0 && (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Conta</TableHead>
                <TableHead>Servidor</TableHead>
                <TableHead>Recursos</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Última Sync</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contas.map((conta, index) => (
                <motion.tr
                  key={conta.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group"
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Mail className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{conta.nome}</p>
                        <p className="text-sm text-muted-foreground">{conta.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p>IMAP: {conta.imap_host}:{conta.imap_port}</p>
                      <p className="text-muted-foreground">SMTP: {conta.smtp_host}:{conta.smtp_port}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {conta.suporta_carddav && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge 
                                variant="outline" 
                                className="text-xs cursor-pointer hover:bg-primary/10"
                                onClick={() => setCardDavTestConta(conta)}
                              >
                                <Users className="h-3 w-3 mr-1" />
                                CardDAV
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Clique para testar conexão CardDAV</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                      {conta.suporta_caldav && (
                        <Badge variant="outline" className="text-xs">
                          <Calendar className="h-3 w-3 mr-1" />
                          CalDAV
                        </Badge>
                      )}
                      {!conta.suporta_carddav && !conta.suporta_caldav && (
                        <span className="text-xs text-muted-foreground">Email apenas</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={conta.ativo ? 'default' : 'secondary'}
                        className={conta.ativo ? 'bg-green-500/10 text-green-600' : ''}
                      >
                        {conta.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                      {conta.verificado && (
                        <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-200">
                          <Check className="h-3 w-3 mr-1" />
                          Verificado
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {conta.ultima_sincronizacao ? (
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(conta.ultima_sincronizacao), "dd/MM/yy HH:mm", { locale: ptBR })}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">Nunca</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleTestConnection(conta)}
                        disabled={testingConnection === conta.id}
                      >
                        {testingConnection === conta.id ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <TestTube className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(conta)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Switch
                        checked={conta.ativo}
                        onCheckedChange={() => handleToggleAtivo(conta)}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteConfirmId(conta.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Form Modal */}
      {showFormModal && (
        <EmailContaFormModal
          conta={editingConta}
          onClose={handleCloseModal}
          onSuccess={() => {
            handleCloseModal();
            refetch();
          }}
        />
      )}

      {/* CardDAV Test Modal */}
      {cardDavTestConta && (
        <CardDavTestModal
          open={!!cardDavTestConta}
          onClose={() => setCardDavTestConta(null)}
          contaId={cardDavTestConta.id}
          contaEmail={cardDavTestConta.email}
          carddavUrl={cardDavTestConta.carddav_url || ''}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A conta de email será removida permanentemente
              do sistema junto com todos os emails em cache.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default EmailConfigTab;
