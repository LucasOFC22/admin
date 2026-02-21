import { Card, CardContent } from '@/components/ui/card';
import { Activity, Users, Shield, Building2 } from 'lucide-react';

interface CargosStats {
  total: number;
  ativos: number;
  inativos: number;
  admin: number;
  custom: number;
}

interface CargosStatsGridProps {
  stats: CargosStats;
  uniqueDepartmentsCount: number;
}

const CargosStatsGrid = ({ stats, uniqueDepartmentsCount }: CargosStatsGridProps) => {
  return (
    <>
      {/* Hero Section com estatísticas */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 text-white shadow-xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Building2 className="h-6 w-6" />
              </div>
              Central de Cargos
            </h2>
            <p className="text-blue-100 text-lg">
              Gerencie cargos, hierarquias e permissões em um só lugar
            </p>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full lg:w-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-blue-100 text-sm">Total</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-200">{stats.ativos}</div>
              <div className="text-blue-100 text-sm">Ativos</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-200">{stats.admin}</div>
              <div className="text-blue-100 text-sm">Admin</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-amber-200">{stats.custom}</div>
              <div className="text-blue-100 text-sm">Customizados</div>
            </div>
          </div>
        </div>
      </div>

      {/* Métricas detalhadas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg bg-white/60 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-600">Cargos Ativos</p>
                <p className="text-2xl font-bold text-green-600">{stats.ativos}</p>
                <p className="text-xs text-slate-500">
                  {stats.total > 0 ? ((stats.ativos / stats.total) * 100).toFixed(1) : 0}% do total
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Activity className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-white/60 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-600">Inativos</p>
                <p className="text-2xl font-bold text-orange-600">{stats.inativos}</p>
                <p className="text-xs text-slate-500">
                  Cargos desabilitados
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <Users className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-white/60 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-600">Administrativos</p>
                <p className="text-2xl font-bold text-amber-600">{stats.admin}</p>
                <p className="text-xs text-slate-500">
                  Com permissões especiais
                </p>
              </div>
              <div className="p-3 bg-amber-100 rounded-full">
                <Shield className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-white/60 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-600">Departamentos</p>
                <p className="text-2xl font-bold text-purple-600">{uniqueDepartmentsCount}</p>
                <p className="text-xs text-slate-500">
                  Áreas organizadas
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Building2 className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default CargosStatsGrid;