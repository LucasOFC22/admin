import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useUnifiedUsers, UnifiedUserFilters, UsuarioComCargo, SortField, SortOrder, PaginationOptions } from '@/hooks/useUnifiedUsers';
import UnifiedUsersStats from './UnifiedUsersStats';
import UnifiedUsersFilters from './UnifiedUsersFilters';
import UnifiedUsersTable from './UnifiedUsersTable';
import UnifiedUserModal from './UnifiedUserModal';
import DeleteUserConfirmationDialog from './DeleteUserConfirmationDialog';
import { UnifiedUsersExportButton } from './UnifiedUsersExportButton';
import { UnifiedUsersPagination } from './UnifiedUsersPagination';
import { motion } from 'framer-motion';
import { useActivityLogger } from '@/hooks/useActivityLogger';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';

const UnifiedUsersManagement = () => {
  const { logActivity } = useActivityLogger();
  const { hasPermission } = usePermissionGuard();
  
  // Permissões
  const canCreate = hasPermission('admin.usuarios.criar');
  const canEdit = hasPermission('admin.usuarios.editar');
  const canDelete = hasPermission('admin.usuarios.excluir');
  
  const {
    users,
    cargos,
    isLoading,
    error,
    createUser,
    updateUser,
    deleteUser,
    toggleAccess,
    resetPassword,
    resendVerificationEmail,
    filterUsers,
    sortUsers,
    paginateUsers,
    getUserStats
  } = useUnifiedUsers();

  const [filters, setFilters] = useState<UnifiedUserFilters>({
    searchTerm: '',
    typeFilter: 'all',
    statusFilter: 'all',
    cargoFilter: null,
    emailVerifiedFilter: 'all',
    dateFrom: undefined,
    dateTo: undefined
  });

  const [userModalOpen, setUserModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UsuarioComCargo | undefined>();
  const [userToDelete, setUserToDelete] = useState<UsuarioComCargo | null>(null);

  // Estados para ordenação e paginação
  const [sortField, setSortField] = useState<SortField>('nome');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Aplicar filtros, ordenação e paginação
  const filteredUsers = filterUsers(filters);
  const sortedUsers = sortUsers(filteredUsers, sortField, sortOrder);
  const totalUsers = sortedUsers.length;
  const totalPages = Math.ceil(totalUsers / pageSize);
  const paginatedUsers = paginateUsers(sortedUsers, { page: currentPage, pageSize });

  const stats = getUserStats();

  const handleCreateUser = () => {
    setSelectedUser(undefined);
    setUserModalOpen(true);
    
    logActivity({
      acao: 'modal_criar_usuario_aberto',
      modulo: 'usuarios',
      detalhes: {}
    });
  };

  const handleEditUser = (user: UsuarioComCargo) => {
    setSelectedUser(user);
    setUserModalOpen(true);
    
    logActivity({
      acao: 'modal_editar_usuario_aberto',
      modulo: 'usuarios',
      detalhes: {
        usuario_id: user.id,
        usuario_nome: user.nome,
        cargo_id: user.cargo
      }
    });
  };

  const handleDeleteUser = (user: UsuarioComCargo) => {
    setUserToDelete(user);
    setDeleteModalOpen(true);
    
    logActivity({
      acao: 'modal_excluir_usuario_aberto',
      modulo: 'usuarios',
      detalhes: {
        usuario_id: user.id,
        usuario_nome: user.nome,
        cargo_id: user.cargo
      }
    });
  };

  const handleSaveUser = async (userData: any) => {
    if (selectedUser) {
      await updateUser(selectedUser.id, userData);
      
      logActivity({
        acao: 'usuario_atualizado',
        modulo: 'usuarios',
        detalhes: {
          usuario_id: selectedUser.id,
          usuario_nome: userData.nome,
          cargo_id: userData.cargo
        }
      });
    } else {
      await createUser(userData);
      
      logActivity({
        acao: 'usuario_criado',
        modulo: 'usuarios',
        detalhes: {
          usuario_nome: userData.nome,
          usuario_email: userData.email,
          cargo_id: userData.cargo
        }
      });
    }
  };

  const handleConfirmDelete = async (userId: number) => {
    const user = users.find(u => u.id === userId);
    await deleteUser(userId);
    
    if (user) {
      logActivity({
        acao: 'usuario_excluido',
        modulo: 'usuarios',
        detalhes: {
          usuario_id: userId,
          usuario_nome: user.nome,
          cargo_id: user.cargo
        }
      });
    }
  };

  const handleToggleAccess = async (id: number, accessType: 'cliente' | 'admin', value: boolean) => {
    const user = users.find(u => u.id === id);
    await toggleAccess(id, accessType, value);
    
    if (user) {
      logActivity({
        acao: 'acesso_usuario_alterado',
        modulo: 'usuarios',
        detalhes: {
          usuario_id: id,
          usuario_nome: user.nome,
          tipo_acesso: accessType,
          novo_valor: value
        }
      });
    }
  };

  const handleResetPassword = async (email: string) => {
    await resetPassword(email);
    
    logActivity({
      acao: 'senha_reset_solicitado',
      modulo: 'usuarios',
      detalhes: {
        usuario_email: email
      }
    });
  };

  const handleResendVerification = async (email: string) => {
    await resendVerificationEmail(email);
    
    logActivity({
      acao: 'email_verificacao_reenviado',
      modulo: 'usuarios',
      detalhes: {
        usuario_email: email
      }
    });
  };

  const hasActiveFilters = 
    filters.searchTerm !== '' || 
    filters.typeFilter !== 'all' || 
    filters.statusFilter !== 'all' ||
    filters.cargoFilter !== null ||
    (filters.emailVerifiedFilter && filters.emailVerifiedFilter !== 'all') ||
    !!filters.dateFrom ||
    !!filters.dateTo;

  const handleClearFilters = () => {
    setFilters({
      searchTerm: '',
      typeFilter: 'all',
      statusFilter: 'all',
      cargoFilter: null,
      emailVerifiedFilter: 'all',
      dateFrom: undefined,
      dateTo: undefined
    });
    setCurrentPage(1); // Reset página ao limpar filtros
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Se já está ordenando por este campo, inverte a ordem
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Se é um novo campo, começa com ordem crescente
      setSortField(field);
      setSortOrder('asc');
    }
    setCurrentPage(1); // Reset página ao ordenar
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1); // Reset para primeira página ao mudar tamanho
  };

  // Reset página quando filtros mudarem
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  return (
    <div className="flex flex-col h-full">
      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="px-4 lg:px-6 pt-4 lg:pt-6 pb-0 flex items-center justify-end gap-2"
      >
        <UnifiedUsersExportButton users={sortedUsers} loading={isLoading} />
        {canCreate && (
          <Button onClick={handleCreateUser} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Novo Usuário</span>
            <span className="sm:hidden">Novo</span>
          </Button>
        )}
      </motion.div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 lg:p-6 space-y-6">
        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-destructive/10 border border-destructive/20 rounded-lg p-4"
          >
            <div className="flex items-center">
              <div className="text-destructive text-sm">
                <strong>Erro:</strong> {error}
              </div>
            </div>
          </motion.div>
        )}

        {/* Stats */}
        <UnifiedUsersStats stats={stats} loading={isLoading} />

        {/* Filters */}
        <UnifiedUsersFilters
          filters={filters}
          onFiltersChange={setFilters}
          cargos={cargos}
          loading={isLoading}
        />

        {/* Users Table */}
        <UnifiedUsersTable
          users={paginatedUsers}
          onEdit={handleEditUser}
          onDelete={handleDeleteUser}
          onToggleAccess={handleToggleAccess}
          onResetPassword={handleResetPassword}
          onResendVerification={handleResendVerification}
          loading={isLoading}
          hasFilters={hasActiveFilters}
          onClearFilters={handleClearFilters}
          onCreateUser={canCreate ? handleCreateUser : undefined}
          sortField={sortField}
          sortOrder={sortOrder}
          onSort={handleSort}
          canEdit={canEdit}
          canDelete={canDelete}
        />

        {/* Paginação */}
        {!isLoading && totalUsers > 0 && (
          <UnifiedUsersPagination
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={totalUsers}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        )}
      </div>

      {/* User Modal */}
      <UnifiedUserModal
        isOpen={userModalOpen}
        onClose={() => setUserModalOpen(false)}
        user={selectedUser}
        cargos={cargos}
        onSave={handleSaveUser}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteUserConfirmationDialog
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        user={userToDelete}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};

export default UnifiedUsersManagement;
