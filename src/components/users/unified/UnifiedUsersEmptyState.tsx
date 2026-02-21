import { motion } from 'framer-motion';
import { UserPlus, Users, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface UnifiedUsersEmptyStateProps {
  hasFilters: boolean;
  onCreateUser?: () => void;
  onClearFilters?: () => void;
}

export const UnifiedUsersEmptyState = ({ 
  hasFilters, 
  onCreateUser, 
  onClearFilters 
}: UnifiedUsersEmptyStateProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="border rounded-lg p-12 text-center bg-gradient-to-b from-background to-muted/20"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6"
      >
        {hasFilters ? (
          <Search className="w-10 h-10 text-primary" />
        ) : (
          <Users className="w-10 h-10 text-primary" />
        )}
      </motion.div>

      <motion.h3
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-xl font-semibold text-foreground mb-2"
      >
        {hasFilters ? 'Nenhum usuário encontrado' : 'Nenhum usuário cadastrado'}
      </motion.h3>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-muted-foreground mb-8 max-w-md mx-auto"
      >
        {hasFilters 
          ? 'Não encontramos usuários com os filtros aplicados. Tente ajustar sua busca ou limpar os filtros.'
          : 'Comece criando seu primeiro usuário para gerenciar acessos e permissões do sistema.'
        }
      </motion.p>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex items-center justify-center gap-3"
      >
        {hasFilters ? (
          <Button onClick={onClearFilters} variant="outline">
            Limpar Filtros
          </Button>
        ) : (
          <Button onClick={onCreateUser} className="gap-2">
            <UserPlus className="w-4 h-4" />
            Criar Primeiro Usuário
          </Button>
        )}
      </motion.div>
    </motion.div>
  );
};
