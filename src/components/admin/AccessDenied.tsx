import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldX, ArrowLeft, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface AccessDeniedProps {
  permissions?: string[];
  title?: string;
  description?: string;
  showBackButton?: boolean;
  showPermissions?: boolean;
}

const AccessDenied: React.FC<AccessDeniedProps> = ({
  permissions = [],
  title = 'Acesso Negado',
  description = 'Você não tem permissão para acessar este recurso.',
  showBackButton = true,
  showPermissions = true
}) => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        <Card className="max-w-md w-full p-8 text-center border-destructive/20 bg-gradient-to-b from-destructive/5 to-background">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
            className="mx-auto w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mb-6"
          >
            <motion.div
              animate={{ 
                rotate: [0, -10, 10, -10, 0],
              }}
              transition={{ 
                delay: 0.5,
                duration: 0.5,
                ease: 'easeInOut'
              }}
            >
              <ShieldX className="h-10 w-10 text-destructive" />
            </motion.div>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-2xl font-bold text-foreground mb-2"
          >
            {title}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-muted-foreground mb-6"
          >
            {description}
          </motion.p>

          {showPermissions && permissions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mb-6"
            >
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-3">
                <Lock className="h-4 w-4" />
                <span>Permissões necessárias:</span>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {permissions.map((permission, index) => (
                  <motion.span
                    key={permission}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className="px-3 py-1 text-xs font-mono bg-muted rounded-full text-muted-foreground"
                  >
                    {permission}
                  </motion.span>
                ))}
              </div>
            </motion.div>
          )}

          {showBackButton && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Button
                variant="outline"
                onClick={() => navigate('/')}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar ao Dashboard
              </Button>
            </motion.div>
          )}
        </Card>
      </motion.div>
    </div>
  );
};

export default AccessDenied;
