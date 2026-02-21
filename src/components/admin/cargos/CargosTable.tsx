
import { Edit, Trash, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Cargo } from '@/types/database';

interface CargosTableProps {
  roles: Cargo[];
  isLoading: boolean;
  onEditRole: (role: Cargo) => void;
  onDeleteRole: (role: Cargo) => void;
}

const CargosTable = ({ roles, isLoading, onEditRole, onDeleteRole }: CargosTableProps) => {
  // Ensure roles is always an array
  const safeRoles = Array.isArray(roles) ? roles : [];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Carregando cargos do n8n...</span>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead>Nível</TableHead>
            <TableHead>Permissões</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-28 text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {safeRoles.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                Nenhum cargo encontrado.
              </TableCell>
            </TableRow>
          ) : (
            safeRoles.map((role) => (
              <TableRow key={role.id}>
                <TableCell className="font-medium">
                  {role.nome}
                  {role.nome === 'Administrador' && (
                    <Badge variant="secondary" className="ml-2 bg-purple-100 text-purple-800">
                      <Shield className="w-3 h-3 mr-1" />
                      Sistema
                    </Badge>
                  )}
                </TableCell>
                <TableCell>{role.descricao || '—'}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="bg-gray-100 text-gray-800">
                    Nível {role.level || 1}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                    {role.permissoes ? role.permissoes.length : 0} permissões
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={role.ativo !== false ? "default" : "destructive"}
                    className={role.ativo !== false ? "bg-green-100 text-green-800" : ""}
                  >
                    {role.ativo !== false ? 'Ativo' : 'Inativo'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEditRole(role)}
                      title={role.nome === 'Administrador' ? 'Visualizar' : 'Editar'}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    {role.nome !== 'Administrador' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => onDeleteRole(role)}
                        title="Excluir"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default CargosTable;
