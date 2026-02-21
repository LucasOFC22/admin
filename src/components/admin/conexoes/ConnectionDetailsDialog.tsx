import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { 
  Edit, 
  Trash2, 
  QrCode, 
  RefreshCw, 
  LogOut, 
  CheckCircle, 
  Facebook, 
  Instagram 
} from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import ConnectionStatusBadge from './ConnectionStatusBadge';
import { conexoesService } from '@/services/conexoesService';
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
  qrcode?: string;
}

interface ConnectionDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company: { id: string; name: string } | null;
  conexoes: Conexao[];
  onRefresh: () => void;
}

const ConnectionDetailsDialog = ({
  open,
  onOpenChange,
  company,
  conexoes,
  onRefresh,
}: ConnectionDetailsDialogProps) => {
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [selectedConexaoId, setSelectedConexaoId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleOpenQrCode = (conexaoId: string) => {
    setSelectedConexaoId(conexaoId);
    setQrDialogOpen(true);
  };

  const handleStartSession = async (conexaoId: string) => {
    try {
      await conexoesService.startSession(conexaoId);
      toast({
        title: 'Reconectando',
        description: 'Iniciando sessão da conexão...',
      });
      onRefresh();
    } catch (error) {
      toast({
        title: 'Erro ao reconectar',
        description: (error as Error).message,
        variant: 'destructive',
      });
    }
  };

  const handleRequestNewQrCode = async (conexaoId: string) => {
    try {
      await conexoesService.requestNewQrCode(conexaoId);
      toast({
        title: 'Novo QR Code solicitado',
        description: 'Aguarde a geração do novo código...',
      });
      onRefresh();
    } catch (error) {
      toast({
        title: 'Erro ao solicitar QR Code',
        description: (error as Error).message,
        variant: 'destructive',
      });
    }
  };

  const handleDisconnect = async (conexaoId: string) => {
    try {
      await conexoesService.disconnectSession(conexaoId);
      toast({
        title: 'Desconectado',
        description: 'Conexão desconectada com sucesso',
      });
      onRefresh();
    } catch (error) {
      toast({
        title: 'Erro ao desconectar',
        description: (error as Error).message,
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      await conexoesService.deleteConnection(deleteId);
      toast({
        title: 'Conexão deletada',
        description: 'A conexão foi removida com sucesso',
      });
      onRefresh();
      setDeleteId(null);
    } catch (error) {
      toast({
        title: 'Erro ao deletar',
        description: (error as Error).message,
        variant: 'destructive',
      });
    }
  };

  const getChannelIcon = (canal: string) => {
    switch (canal) {
      case 'facebook':
        return <Facebook className="h-4 w-4 text-blue-600" />;
      case 'instagram':
        return <Instagram className="h-4 w-4 text-pink-600" />;
      case 'whatsapp':
        return <FaWhatsapp className="h-4 w-4 text-green-600" />;
      default:
        return null;
    }
  };

  const renderActionButtons = (conexao: Conexao) => {
    if (conexao.status === 'qrcode') {
      return (
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleOpenQrCode(conexao.id)}
        >
          <QrCode className="h-4 w-4 mr-1" />
          Ver QR Code
        </Button>
      );
    }

    if (conexao.status === 'DISCONNECTED') {
      return (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="text-green-600 border-green-600 hover:bg-green-50"
            onClick={() => handleStartSession(conexao.id)}
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Reconectar
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-blue-600 border-blue-600 hover:bg-blue-50"
            onClick={() => handleRequestNewQrCode(conexao.id)}
          >
            <QrCode className="h-4 w-4 mr-1" />
            Novo QR
          </Button>
        </div>
      );
    }

    if (['CONNECTED', 'PAIRING', 'TIMEOUT'].includes(conexao.status)) {
      return (
        <Button
          size="sm"
          variant="outline"
          className="text-red-600 border-red-600 hover:bg-red-50"
          onClick={() => handleDisconnect(conexao.id)}
        >
          <LogOut className="h-4 w-4 mr-1" />
          Desconectar
        </Button>
      );
    }

    if (conexao.status === 'OPENING') {
      return (
        <Button size="sm" variant="outline" disabled>
          Conectando...
        </Button>
      );
    }

    return null;
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>
              Conexões de: {company?.name}
            </DialogTitle>
          </DialogHeader>

          <div className="mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center">Canal</TableHead>
                  <TableHead className="text-center">Nome</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center">Sessão</TableHead>
                  <TableHead className="text-center">Última Atualização</TableHead>
                  <TableHead className="text-center">Padrão</TableHead>
                  <TableHead className="text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {conexoes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      Nenhuma conexão encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  conexoes.map((conexao) => (
                    <TableRow key={conexao.id}>
                      <TableCell className="text-center">
                        {getChannelIcon(conexao.canal)}
                      </TableCell>
                      <TableCell className="text-center">{conexao.nome}</TableCell>
                      <TableCell className="text-center">
                        <ConnectionStatusBadge status={conexao.status} />
                      </TableCell>
                      <TableCell className="text-center">
                        {renderActionButtons(conexao)}
                      </TableCell>
                      <TableCell className="text-center text-sm">
                        {format(parseISO(conexao.updated_at), 'dd/MM/yy HH:mm')}
                      </TableCell>
                      <TableCell className="text-center">
                        {conexao.is_default && (
                          <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex gap-2 justify-center">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            title="Editar"
                          >
                            <Edit className="h-4 w-4 text-orange-500" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => setDeleteId(conexao.id)}
                            title="Deletar"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

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
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ConnectionDetailsDialog;
