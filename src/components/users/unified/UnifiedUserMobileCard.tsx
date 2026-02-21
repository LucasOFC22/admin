import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreVertical, Edit, Trash2, UserCheck, ShieldCheck, CheckCircle, XCircle, Mail, Phone, Briefcase, Clock, AlertCircle, KeyRound, MailCheck } from 'lucide-react';
import { UsuarioComCargo } from '@/hooks/useUnifiedUsers';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'framer-motion';

interface UnifiedUserMobileCardProps {
  user: UsuarioComCargo;
  onEdit: (user: UsuarioComCargo) => void;
  onDelete: (user: UsuarioComCargo) => void;
  onToggleAccess: (id: number, accessType: 'cliente' | 'admin', value: boolean) => void;
  onResetPassword: (email: string) => void;
  onResendVerification: (email: string) => void;
  loading?: boolean;
  index: number;
  canEdit?: boolean;
  canDelete?: boolean;
}

export const UnifiedUserMobileCard = ({ 
  user, 
  onEdit, 
  onDelete, 
  onToggleAccess,
  onResetPassword,
  onResendVerification,
  loading = false,
  index,
  canEdit = true,
  canDelete = true
}: UnifiedUserMobileCardProps) => {
  const isCliente = user.acesso_area_cliente === true;
  const isAdmin = user.acesso_area_admin === true;
  const isAtivo = user.ativo === true;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      <Card className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1 min-w-0">
            <h3 className="font-semibold text-base truncate">{user.nome}</h3>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Mail className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{user.email}</span>
            </div>
          </div>
          {(canEdit || canDelete) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="shrink-0">
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
        </div>

        {/* Info adicional */}
        <div className="space-y-2 text-sm">
          {user.telefone && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Phone className="w-3.5 h-3.5 shrink-0" />
              <span>{user.telefone}</span>
            </div>
          )}
          {user.cargo_info && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Briefcase className="w-3.5 h-3.5 shrink-0" />
              <span>{user.cargo_info.nome}</span>
            </div>
          )}
          {user.data_ultima_atividade && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <span>
                Última atividade{' '}
                {formatDistanceToNow(new Date(user.data_ultima_atividade), {
                  addSuffix: true,
                  locale: ptBR
                })}
              </span>
            </div>
          )}
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-2">
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
        </div>

        {/* Switches */}
        <div className="space-y-3 pt-3 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Acesso Cliente</span>
            <Switch
              checked={isCliente}
              onCheckedChange={(checked) => onToggleAccess(user.id, 'cliente', checked)}
              disabled={loading || !canEdit}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Acesso Admin</span>
            <Switch
              checked={isAdmin}
              onCheckedChange={(checked) => onToggleAccess(user.id, 'admin', checked)}
              disabled={loading || !canEdit}
            />
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
