import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreVertical, Edit, Trash2, UserCheck, ShieldCheck, CheckCircle, XCircle, AlertCircle, KeyRound, MailCheck } from 'lucide-react';
import { UsuarioComCargo } from '@/hooks/useUnifiedUsers';
import { SortField, SortOrder } from '@/hooks/useUnifiedUsers';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { UnifiedUsersTableSkeleton } from './UnifiedUsersTableSkeleton';
import { UnifiedUsersEmptyState } from './UnifiedUsersEmptyState';
import { UnifiedUserMobileCard } from './UnifiedUserMobileCard';
import { SortableTableHead } from './SortableTableHead';

interface UnifiedUsersTableProps {
  users: UsuarioComCargo[];
  onEdit: (user: UsuarioComCargo) => void;
  onDelete: (user: UsuarioComCargo) => void;
  onToggleAccess: (id: number, accessType: 'cliente' | 'admin', value: boolean) => void;
  onResetPassword: (email: string) => void;
  onResendVerification: (email: string) => void;
  loading?: boolean;
  hasFilters?: boolean;
  onClearFilters?: () => void;
  onCreateUser?: () => void;
  sortField?: SortField;
  sortOrder?: SortOrder;
  onSort?: (field: SortField) => void;
  canEdit?: boolean;
  canDelete?: boolean;
}

const UnifiedUsersTable = ({ 
  users, 
  onEdit, 
  onDelete, 
  onToggleAccess,
  onResetPassword,
  onResendVerification,
  loading = false,
  hasFilters = false,
  onClearFilters,
  onCreateUser,
  sortField = 'nome',
  sortOrder = 'asc',
  onSort,
  canEdit = true,
  canDelete = true
}: UnifiedUsersTableProps) => {
  if (loading) {
    return <UnifiedUsersTableSkeleton />;
  }

  if (users.length === 0) {
    return (
      <UnifiedUsersEmptyState
        hasFilters={hasFilters}
        onClearFilters={onClearFilters}
        onCreateUser={onCreateUser}
      />
    );
  }

  return (
    <>
      {/* Desktop Table */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="hidden md:block border rounded-lg overflow-hidden"
      >
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <SortableTableHead field="nome" label="Nome" currentSortField={sortField} currentSortOrder={sortOrder} onSort={onSort} />
                <SortableTableHead field="email" label="Email" currentSortField={sortField} currentSortOrder={sortOrder} onSort={onSort} />
                <TableHead>Telefone</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
                <SortableTableHead field="cargo" label="Cargo" currentSortField={sortField} currentSortOrder={sortOrder} onSort={onSort} />
                <TableHead>Acesso Cliente</TableHead>
                <TableHead>Acesso Admin</TableHead>
                <SortableTableHead field="data_ultima_atividade" label="Última Atividade" currentSortField={sortField} currentSortOrder={sortOrder} onSort={onSort} />
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user, index) => {
                const isCliente = user.acesso_area_cliente === true;
                const isAdmin = user.acesso_area_admin === true;
                const isAtivo = user.ativo === true;

                return (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03, duration: 0.3 }}
                    className="border-b hover:bg-muted/50 transition-colors"
                  >
                    <TableCell className="font-medium">{user.nome}</TableCell>
                    <TableCell className="text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <span>{user.email}</span>
                        {user.email_verified === true ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Verificado
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Pendente
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{user.telefone || '-'}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {isCliente && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            <UserCheck className="w-3 h-3 mr-1" />
                            Cliente
                          </Badge>
                        )}
                        {isAdmin && (
                          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                            <ShieldCheck className="w-3 h-3 mr-1" />
                            Admin
                          </Badge>
                        )}
                        {!isCliente && !isAdmin && (
                          <Badge variant="outline" className="bg-muted text-muted-foreground">
                            Sem acesso
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {isAtivo ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Ativo
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                          <XCircle className="w-3 h-3 mr-1" />
                          Inativo
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.cargo_info?.nome || '-'}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={isCliente}
                        onCheckedChange={(checked) => onToggleAccess(user.id, 'cliente', checked)}
                        disabled={loading || !canEdit}
                      />
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={isAdmin}
                        onCheckedChange={(checked) => onToggleAccess(user.id, 'admin', checked)}
                        disabled={loading || !canEdit}
                      />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.data_ultima_atividade
                        ? formatDistanceToNow(new Date(user.data_ultima_atividade), {
                            addSuffix: true,
                            locale: ptBR
                          })
                        : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      {(canEdit || canDelete) && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {canEdit && (
                              <DropdownMenuItem onSelect={() => queueMicrotask(() => onEdit(user))}>
                                <Edit className="w-4 h-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                            )}
                            {canEdit && (
                              <DropdownMenuItem onSelect={() => queueMicrotask(() => onResetPassword(user.email))}>
                                <KeyRound className="w-4 h-4 mr-2" />
                                Resetar Senha
                              </DropdownMenuItem>
                            )}
                            {canEdit && user.email_verified === false && (
                              <DropdownMenuItem onSelect={() => queueMicrotask(() => onResendVerification(user.email))}>
                                <MailCheck className="w-4 h-4 mr-2" />
                                Reenviar Verificação
                              </DropdownMenuItem>
                            )}
                            {canDelete && (
                              <DropdownMenuItem
                                onSelect={() => queueMicrotask(() => onDelete(user))}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Excluir
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </motion.tr>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </motion.div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {users.map((user, index) => (
          <UnifiedUserMobileCard
            key={user.id}
            user={user}
            onEdit={onEdit}
            onDelete={onDelete}
            onToggleAccess={onToggleAccess}
            onResetPassword={onResetPassword}
            onResendVerification={onResendVerification}
            loading={loading}
            index={index}
            canEdit={canEdit}
            canDelete={canDelete}
          />
        ))}
      </div>
    </>
  );
};

export default UnifiedUsersTable;
