import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Edit, Trash2, CheckCircle, Power, PowerOff } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/lib/toast';
import ConnectionStatusBadge from './ConnectionStatusBadge';
import EditConnectionDialog from './EditConnectionDialog';
import { conexoesService } from '@/services/conexoesService';
import { backendService } from '@/services/api/backendService';
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

interface Conexao {
  id: string;
  nome: string;
  canal: 'whatsapp' | 'facebook' | 'instagram';
  status: string;
  updated_at: string;
  is_default: boolean;
  whatsapp_token?: string;
  whatsapp_phone_id?: string;
  whatsapp_verify_token?: string;
  whatsapp_webhook_url?: string;
  telefone?: string;
}

interface ConnectionListProps {
  conexoes: Conexao[];
  onRefresh: () => void;
  canEdit?: boolean;
  canDelete?: boolean;
}

const ConnectionList = ({ conexoes, onRefresh, canEdit = true, canDelete = true }: ConnectionListProps) => {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedConexao, setSelectedConexao] = useState<Conexao | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [validatingId, setValidatingId] = useState<string | null>(null);

  const handleEdit = (conexao: Conexao) => {
    setSelectedConexao(conexao);
    setEditDialogOpen(true);
  };

  // Validação via backend - token nunca exposto no frontend
  const handleValidateConnection = async (conexao: Conexao) => {
    if (!conexao.whatsapp_phone_id) {
      toast.error('Phone ID é obrigatório');
      return;
    }

    setValidatingId(conexao.id);
    try {
      // Chama o backend Node.js que busca as credenciais do Supabase internamente
      const result = await backendService.validarTokenWhatsApp(conexao.id);

      if (result.success && result.data?.success) {
        await conexoesService.updateConnectionStatus(conexao.id, 'CONNECTED');
        toast.success(`Conexão validada! Número: ${result.data?.display_phone_number}`);
        onRefresh();
      } else {
        await conexoesService.updateConnectionStatus(conexao.id, 'INVALID_TOKEN');
        toast.error(result.error || 'Token ou Phone ID inválido');
        onRefresh();
      }
    } catch (error) {
      toast.error((error as Error).message || 'Erro ao validar conexão');
    } finally {
      setValidatingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      await conexoesService.deleteConnection(deleteId);
      toast.success('Conexão deletada com sucesso');
      onRefresh();
      setDeleteId(null);
    } catch (error) {
      toast.error((error as Error).message || 'Erro ao deletar conexão');
    }
  };

  if (conexoes.length === 0) {
    return (
      <div className="bg-card border rounded-lg p-12 text-center">
        <FaWhatsapp className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Nenhuma conexão configurada</h3>
        <p className="text-muted-foreground">
          Crie sua primeira conexão com a API oficial do WhatsApp Business
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-card border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Canal</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Phone ID</TableHead>
              <TableHead>Última Atualização</TableHead>
              <TableHead>Padrão</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {conexoes.map((conexao) => (
              <TableRow key={conexao.id}>
                <TableCell className="font-medium">{conexao.nome}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <FaWhatsapp className="h-4 w-4 text-green-600" />
                    WhatsApp
                  </div>
                </TableCell>
                <TableCell>
                  <ConnectionStatusBadge status={conexao.status} />
                </TableCell>
                <TableCell>{conexao.telefone || '-'}</TableCell>
                <TableCell>
                  <code className="text-xs bg-muted px-2 py-1 rounded">
                    {conexao.whatsapp_phone_id || 'Não configurado'}
                  </code>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {format(parseISO(conexao.updated_at), 'dd/MM/yyyy HH:mm')}
                </TableCell>
                <TableCell>
                  {conexao.is_default && (
                    <Badge variant="secondary">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Padrão
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2 justify-end">
                    {conexao.whatsapp_phone_id && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleValidateConnection(conexao)}
                        disabled={validatingId === conexao.id}
                        title="Validar conexão"
                      >
                        {validatingId === conexao.id ? (
                          <Power className="h-4 w-4 animate-spin" />
                        ) : conexao.status === 'CONNECTED' ? (
                          <Power className="h-4 w-4 text-green-600" />
                        ) : (
                          <PowerOff className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                    {canEdit && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(conexao)}
                        title="Editar"
                      >
                        <Edit className="h-4 w-4 text-orange-500" />
                      </Button>
                    )}
                    {canDelete && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDeleteId(conexao.id)}
                        title="Deletar"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <EditConnectionDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        conexao={selectedConexao}
        onSuccess={onRefresh}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar esta conexão? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ConnectionList;
