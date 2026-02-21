
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DashboardHeader from "./DashboardHeader";
import StatCard from "./StatCard";
import ActivityCard from "./ActivityCard";
import QuickAccessCard from "./QuickAccessCard";
import { quickAccessLinks, containerVariants, statsIcons, statsColors, activityIcons } from "./dashboardData";
import { useDashboardData } from "@/hooks/useDashboardData";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, BarChart3, FileText, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const Dashboard = () => {
  const { stats, activities, isLoading, error } = useDashboardData();

  // Convert stats object to array for rendering
  const statsItems = [
    {
      key: "usuarios",
      title: "Usuários Ativos",
      value: stats.usuarios.total.toString(),
      icon: statsIcons.usuarios,
      color: "bg-blue-50 text-blue-600",
      change: stats.usuarios.change
    },
    {
      key: "cargos",
      title: "Cargos Cadastrados",
      value: stats.cargos.total.toString(),
      icon: statsIcons.cargos,
      color: "bg-blue-50 text-blue-600",
      change: stats.cargos.change
    },
    {
      key: "permissoes",
      title: "Permissões Ativas",
      value: stats.permissoes.total.toString(),
      icon: statsIcons.permissoes,
      color: "bg-blue-50 text-blue-600",
      change: stats.permissoes.change
    },
    {
      key: "veiculos",
      title: "Veículos Registrados",
      value: stats.veiculos.total.toString(),
      icon: statsIcons.veiculos,
      color: "bg-blue-50 text-blue-600",
      change: stats.veiculos.change
    }
  ];
  
  // Map activities to expected format
  const mappedActivities = activities.map(activity => ({
    ...activity,
    icon: activityIcons[activity.icon as keyof typeof activityIcons] || activityIcons.activity
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 w-full">
      <div className="space-y-8 w-full max-w-none">
        {/* Header redesenhado */}
        <DashboardHeader />

        {/* Navegação por abas com design limpo */}
        <Tabs defaultValue="overview" className="w-full space-y-8">
          <div className="bg-white rounded-xl p-2 shadow-sm border border-blue-100">
            <TabsList className="bg-transparent w-auto gap-2">
              <TabsTrigger 
                value="overview" 
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white px-6 py-3 rounded-lg font-medium transition-all text-gray-600"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Visão Geral
              </TabsTrigger>
              <TabsTrigger 
                value="analytics" 
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white px-6 py-3 rounded-lg font-medium transition-all text-gray-600"
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Análises
              </TabsTrigger>
              <TabsTrigger 
                value="reports" 
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white px-6 py-3 rounded-lg font-medium transition-all text-gray-600"
              >
                <FileText className="h-4 w-4 mr-2" />
                Relatórios
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="overview" className="space-y-8">
            {error ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Alert variant="destructive" className="border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Erro ao carregar dados</AlertTitle>
                  <AlertDescription>
                    Não foi possível carregar os dados do dashboard. Tente atualizar a página.
                  </AlertDescription>
                </Alert>
              </motion.div>
            ) : (
              <>
                {/* Cards de estatísticas com design azul/branco - largura total */}
                <motion.div 
                  className="grid gap-6 md:grid-cols-2 xl:grid-cols-4 w-full"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {isLoading ? (
                    // Placeholders while loading
                    Array(4).fill(0).map((_, i) => (
                      <div key={i} className="space-y-3">
                        <Skeleton className="h-[140px] w-full rounded-xl" />
                      </div>
                    ))
                  ) : (
                    statsItems.map((item, index) => (
                      <StatCard 
                        key={item.key} 
                        title={item.title} 
                        value={item.value} 
                        icon={item.icon} 
                        color={item.color} 
                        change={item.change}
                        index={index}
                      />
                    ))
                  )}
                </motion.div>

                {/* Seção principal - Cards grandes redesenhados com largura total */}
                <div className="grid gap-8 lg:grid-cols-2 w-full">
                  {/* Atividades recentes redesenhadas */}
                  <ActivityCard 
                    activities={isLoading ? [] : mappedActivities} 
                    isLoading={isLoading}
                  />

                  {/* Acesso rápido redesenhado */}
                  <QuickAccessCard links={quickAccessLinks} />
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="analytics" className="min-h-[400px]">
            <motion.div 
              className="flex items-center justify-center h-[400px] bg-white rounded-2xl shadow-sm border border-blue-100"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="text-center space-y-4">
                <div className="bg-blue-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
                  <TrendingUp className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Análises em Desenvolvimento</h3>
                  <p className="text-gray-600 mt-2">Dashboards avançados de análise estarão disponíveis em breve.</p>
                </div>
              </div>
            </motion.div>
          </TabsContent>

          <TabsContent value="reports" className="min-h-[400px]">
            <motion.div 
              className="flex items-center justify-center h-[400px] bg-white rounded-2xl shadow-sm border border-blue-100"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="text-center space-y-4">
                <div className="bg-blue-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
                  <FileText className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Relatórios Personalizados</h3>
                  <p className="text-gray-600 mt-2">Sistema de relatórios avançados em desenvolvimento.</p>
                </div>
              </div>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
