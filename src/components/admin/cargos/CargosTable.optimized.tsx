import React, { useMemo, useCallback } from 'react';
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

// ✅ OTIMIZAÇÃO 1: Componente de linha memoizado
const CargoTableRow = React.memo(({ 
  role, 
  onEditRole, 
  onDeleteRole 
}: { 
  role: Cargo; 
  onEditRole: (role: Cargo) => void; 
  onDeleteRole: (role: Cargo) => void; 
}) => {
  // ✅ OTIMIZAÇÃO 2: useCallback para event handlers
  const handleEditRole = useCallback(() => {
    onEditRole(role);
  }, [onEditRole, role]);

  const handleDeleteRole = useCallback(() => {
    onDeleteRole(role);
  }, [onDeleteRole, role]);

  // ✅ OTIMIZAÇÃO 3: useMemo para valores computados
  const isSystemRole = useMemo(() => role.nome === 'Administrador', [role.nome]);
  
  const permissionsCount = useMemo(() => 
    role.permissoes ? role.permissoes.length : 0, 
    [role.permissoes]
  );

  const isActive = useMemo(() => role.ativo !== false, [role.ativo]);

  return (
    <TableRow>
      <TableCell className="font-medium">
        {role.nome}
        {isSystemRole && (
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
          {permissionsCount} permissões
        </Badge>
      </TableCell>
      <TableCell>
        <Badge 
          variant={isActive ? "default" : "destructive"}
          className={isActive ? "bg-green-100 text-green-800" : ""}
        >
          {isActive ? 'Ativo' : 'Inativo'}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleEditRole}
            title={isSystemRole ? 'Visualizar' : 'Editar'}
          >
            <Edit className="h-4 w-4" />
          </Button>
          {!isSystemRole && (
            <Button
              variant="ghost"
              size="icon"
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
              onClick={handleDeleteRole}
              title="Excluir"
            >
              <Trash className="h-4 w-4" />
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
});

CargoTableRow.displayName = 'CargoTableRow';

// ✅ OTIMIZAÇÃO 4: Componente principal memoizado
const CargosTable = React.memo(({ roles, isLoading, onEditRole, onDeleteRole }: CargosTableProps) => {
  // ✅ OTIMIZAÇÃO 5: useMemo para validação de dados
  const safeRoles = useMemo(() => Array.isArray(roles) ? roles : [], [roles]);

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
              <CargoTableRow
                key={role.id}
                role={role}
                onEditRole={onEditRole}
                onDeleteRole={onDeleteRole}
              />
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
});

CargosTable.displayName = 'CargosTable';

export default CargosTable;