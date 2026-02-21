import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Search, 
  UserPlus, 
  Settings, 
  Shield, 
  Mail, 
  Phone,
  Calendar,
  MoreVertical,
  Edit,
  Trash2,
  Lock,
  AlertCircle,
  Eye,
  Ban
} from 'lucide-react';
import { useCustomNotifications } from '@/hooks/useCustomNotifications';
import { useUsers } from '@/hooks/useUsers';
import { useHierarchyControl } from '@/hooks/useHierarchyControl';

const UsersManagement = () => {
  const { notify } = useCustomNotifications();
  const [searchTerm, setSearchTerm] = useState('');
  const { users, loading, error, createUser, updateUser, deleteUser, filterUsers, refetch } = useUsers();
  const { userLevel, canEdit, canDelete, canViewDetails, validateLevel, isLoading: hierarchyLoading } = useHierarchyControl();

  const filteredUsers = filterUsers({
    searchTerm,
    statusFilter: 'all',
    cargoFilter: 'all'
  });

  const getRoleBadge = (tipo: string) => {
    const variants = {
      admin: 'bg-red-100 text-red-800',
      cliente: 'bg-green-100 text-green-800'
    };
    return variants[tipo as keyof typeof variants] || 'bg-gray-100 text-gray-800';
  };

  const getStatusBadge = (ativo: boolean) => {
    return ativo 
      ? 'bg-green-100 text-green-800'
      : 'bg-gray-100 text-gray-800';
  };

  const handleCreateUser = () => {
    notify.info(
      'Criar Usuário',
      'Abrindo formulário para criação de novo usuário'
    );
  };

  const handleEditUser = (user: any) => {
    const validation = validateLevel(user.nivel_hierarquico || 1, 'edit');
    if (!validation.allowed) {
      notify.error('Acesso Negado', validation.message || 'Você não tem permissão para editar este usuário.');
      return;
    }
    
    notify.info(
      'Editar Usuário',
      `Editando perfil de ${user.name}`
    );
  };

  const handleDeleteUser = async (user: any) => {
    const validation = validateLevel(user.nivel_hierarquico || 1, 'delete');
    if (!validation.allowed) {
      notify.error('Acesso Negado', validation.message || 'Você não tem permissão para excluir este usuário.');
      return;
    }
    
    try {
      await deleteUser(user.id);
    } catch (error) {
      console.error('Erro ao deletar usuário:', error);
    }
  };

  const handleViewDetails = (user: any) => {
    const validation = validateLevel(user.nivel_hierarquico || 1, 'view');
    if (!validation.allowed) {
      notify.warning('Acesso Restrito', validation.message || 'Você pode visualizar este usuário apenas na listagem.');
      return;
    }
    
    notify.info(
      'Detalhes do Usuário',
      `Visualizando detalhes de ${user.name}`
    );
  };

  const handleSuspendUser = (user: any) => {
    notify.warning(
      'Usuário Suspenso',
      `Acesso de ${user.name} foi temporariamente suspenso`
    );
  };

  const handleResetPassword = async (user: any) => {
    try {
      await notify.promise(
        new Promise(resolve => setTimeout(resolve, 1500)),
        {
          loading: 'Enviando nova senha...',
          success: `Nova senha enviada para ${user.email}`,
          error: 'Erro ao redefinir senha'
        }
      );
    } catch (error) {
      console.error('Erro ao redefinir senha:', error);
    }
  };

  const handleBulkAction = () => {
    notify.info(
      'Ações em Lote',
      'Selecione usuários para aplicar ações em massa'
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gerenciar Usuários</h2>
          <p className="text-gray-600">Controle de acesso e permissões do sistema</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={handleBulkAction} variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Ações em Lote
          </Button>
          <Button onClick={handleCreateUser} size="sm">
            <UserPlus className="h-4 w-4 mr-2" />
            Novo Usuário
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar usuários por nome, email ou função..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {/* Loading State */}
      {(loading || hierarchyLoading) && (
        <Card className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando usuários...</p>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Card className="p-6 border-red-200 bg-red-50">
          <div className="flex items-center space-x-2 text-red-800">
            <AlertCircle className="h-5 w-5" />
            <span className="font-medium">Erro ao carregar usuários</span>
          </div>
          <p className="text-red-600 mt-2">{error}</p>
          <Button 
            onClick={refetch} 
            variant="outline" 
            className="mt-4 border-red-300 text-red-700 hover:bg-red-100"
          >
            Tentar novamente
          </Button>
        </Card>
      )}

      {/* Empty State */}
      {!loading && !hierarchyLoading && !error && filteredUsers.length === 0 && (
        <Card className="p-8 text-center">
          <div className="text-gray-400 mb-4">
            <Shield className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Nenhum usuário encontrado
          </h3>
          <p className="text-gray-600 mb-4">
            {searchTerm 
              ? 'Nenhum usuário corresponde aos critérios de busca.'
              : 'Não há usuários cadastrados no sistema.'
            }
          </p>
          <Button onClick={handleCreateUser}>
            <UserPlus className="h-4 w-4 mr-2" />
            Criar primeiro usuário
          </Button>
        </Card>
      )}

      {/* Users List */}
      <div className="grid gap-4">
        {filteredUsers.map((user, index) => (
          <motion.div
            key={user.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="p-6 hover:shadow-lg transition-shadow duration-200">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src="" />
                    <AvatarFallback>
                      {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {user.name}
                      </h3>
                      {user.nivel_hierarquico && (
                        <span className="text-xs font-medium text-muted-foreground px-2 py-0.5 rounded bg-muted">
                          N{user.nivel_hierarquico}
                        </span>
                      )}
                      <Badge className={getRoleBadge(user.tipo)}>
                        <Shield className="h-3 w-3 mr-1" />
                        {user.tipo === 'admin' ? 'Administrador' : 'Cliente'}
                      </Badge>
                      <Badge className={getStatusBadge(user.ativo)}>
                        {user.ativo ? 'ativo' : 'inativo'}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center text-sm text-gray-600">
                          <Mail className="h-4 w-4 mr-2" />
                          {user.email}
                        </div>
                        {user.telefone && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Phone className="h-4 w-4 mr-2" />
                            {user.telefone}
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        {user.lastLoginAt && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Calendar className="h-4 w-4 mr-2" />
                            Último acesso: {new Date(user.lastLoginAt).toLocaleString('pt-BR')}
                          </div>
                        )}
                        {user.empresa && (
                          <div className="flex items-center text-sm text-gray-600">
                            <span className="font-medium">Empresa:</span>
                            <span className="ml-2">{user.empresa}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={() => handleViewDetails(user)}
                          variant="outline"
                          size="sm"
                          disabled={!canViewDetails(user.nivel_hierarquico || 1)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {canViewDetails(user.nivel_hierarquico || 1) 
                          ? 'Ver detalhes' 
                          : `Apenas para níveis ${user.nivel_hierarquico || 1}+`}
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={() => handleEditUser(user)}
                          variant="outline"
                          size="sm"
                          disabled={!canEdit(user.nivel_hierarquico || 1)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {canEdit(user.nivel_hierarquico || 1) 
                          ? 'Editar usuário' 
                          : `Apenas para níveis ${user.nivel_hierarquico || 1}+`}
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={() => handleResetPassword(user)}
                          variant="outline"
                          size="sm"
                          disabled={!canEdit(user.nivel_hierarquico || 1)}
                        >
                          <Lock className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {canEdit(user.nivel_hierarquico || 1) 
                          ? 'Redefinir senha' 
                          : 'Sem permissão'}
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={() => handleSuspendUser(user)}
                          variant="outline"
                          size="sm"
                          className="text-yellow-600 hover:text-yellow-700"
                          disabled={!canEdit(user.nivel_hierarquico || 1)}
                        >
                          <Ban className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {canEdit(user.nivel_hierarquico || 1) 
                          ? 'Suspender usuário' 
                          : 'Sem permissão'}
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={() => handleDeleteUser(user)}
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          disabled={!canDelete(user.nivel_hierarquico || 1)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {canDelete(user.nivel_hierarquico || 1) 
                          ? 'Excluir usuário' 
                          : `Apenas para níveis acima de ${user.nivel_hierarquico || 1}`}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default UsersManagement;
