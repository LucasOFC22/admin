import { Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { MensagemRapida } from '@/services/mensagensRapidas/mensagensRapidasService';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface MensagensRapidasTableProps {
  mensagens: MensagemRapida[];
  isLoading: boolean;
  onEdit?: (mensagem: MensagemRapida) => void;
  onDelete?: (mensagem: MensagemRapida) => void;
}

const MensagensRapidasTable = ({
  mensagens,
  isLoading,
  onEdit,
  onDelete,
}: MensagensRapidasTableProps) => {
  if (isLoading) {
    return (
      <div className="text-center py-8 text-gray-500">
        Carregando mensagens...
      </div>
    );
  }

  if (mensagens.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Nenhuma mensagem rápida cadastrada
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Comando</TableHead>
          <TableHead>Título</TableHead>
          <TableHead>Criado em</TableHead>
          <TableHead>Atualizado em</TableHead>
          <TableHead className="text-right">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {mensagens.map((mensagem) => (
          <TableRow key={mensagem.id}>
            <TableCell className="font-mono font-semibold text-primary">
              /{mensagem.comando}
            </TableCell>
            <TableCell>{mensagem.titulo}</TableCell>
            <TableCell className="text-sm text-gray-500">
              {format(new Date(mensagem.created_at), "dd/MM/yyyy 'às' HH:mm", {
                locale: ptBR,
              })}
            </TableCell>
            <TableCell className="text-sm text-gray-500">
              {format(new Date(mensagem.updated_at), "dd/MM/yyyy 'às' HH:mm", {
                locale: ptBR,
              })}
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                {onEdit && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(mensagem)}
                    title="Editar"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                )}
                {onDelete && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(mensagem)}
                    title="Deletar"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default MensagensRapidasTable;
