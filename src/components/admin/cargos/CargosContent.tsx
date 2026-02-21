
import React from 'react';
import { motion } from 'framer-motion';
import CargosTable from './CargosTable';
import { Cargo } from '@/types/database';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Users, Award, Settings } from 'lucide-react';

interface CargosContentProps {
  roles: Cargo[];
  isLoading: boolean;
  onEditRole: (role: Cargo) => void;
  onDeleteRole: (role: Cargo) => void;
  stats?: {
    total: number;
    active: number;
    inactive: number;
    admin: number;
    custom: number;
  };
}

const CargosContent = ({ roles, isLoading, onEditRole, onDeleteRole, stats }: CargosContentProps) => {
  // Use stats from props or calculate fallback
  const displayStats = stats || {
    total: roles.length,
    active: roles.filter(r => r.ativo !== false).length,
    inactive: roles.filter(r => r.ativo === false).length,
    admin: roles.filter(r => r.nome.toLowerCase().includes('admin')).length,
    custom: roles.filter(r => !r.nome.toLowerCase().includes('admin')).length
  };

  return (
    <div className="space-y-6 p-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total de Cargos</p>
                  <p className="text-2xl font-bold text-gray-900">{displayStats.total}</p>
                </div>
                <Shield className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Cargos Ativos</p>
                  <p className="text-2xl font-bold text-green-600">{displayStats.active}</p>
                </div>
                <Users className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Cargos Admin</p>
                  <p className="text-2xl font-bold text-purple-600">{displayStats.admin}</p>
                </div>
                <Award className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Cargos Personalizados</p>
                  <p className="text-2xl font-bold text-orange-600">{displayStats.custom}</p>
                </div>
                <Settings className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Cargos Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Gestão de Cargos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CargosTable
              roles={roles}
              isLoading={isLoading}
              onEditRole={onEditRole}
              onDeleteRole={onDeleteRole}
            />
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default CargosContent;
