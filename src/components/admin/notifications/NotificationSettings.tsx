
import React from 'react';
import { motion } from 'framer-motion';
import { Bell } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const NotificationSettings = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Configurações de Notificação
          </CardTitle>
          <CardDescription>
            Sistema de notificações foi desabilitado.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-yellow-50 border-yellow-200 border p-4 rounded-lg">
            <p className="text-sm text-yellow-700">
              As notificações baseadas em Firebase foram removidas do sistema.
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default NotificationSettings;
