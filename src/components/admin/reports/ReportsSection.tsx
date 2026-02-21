
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Calendar, TrendingUp, Users, FileText, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ContactsReport from './ContactsReport';
import QuotesReport from './QuotesReport';
import OverviewCharts from './OverviewCharts';
import { useIsMobile } from '@/hooks/use-mobile';

const ReportsSection = () => {
  const [dateRange, setDateRange] = useState('30d');
  const [activeTab, setActiveTab] = useState('overview');
  const isMobile = useIsMobile();

  const reportStats = [
    {
      title: 'Total de Leads',
      value: '1,234',
      change: '+12%',
      icon: Users,
      color: 'blue'
    },
    {
      title: 'Cotações Criadas',
      value: '89',
      change: '+8%',
      icon: FileText,
      color: 'green'
    },
    {
      title: 'Conversas de Chat',
      value: '456',
      change: '+23%',
      icon: MessageCircle,
      color: 'purple'
    },
    {
      title: 'Taxa de Conversão',
      value: '67%',
      change: '+5%',
      icon: TrendingUp,
      color: 'orange'
    }
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Page Header */}
      <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100">
        <div className={`flex ${isMobile ? 'flex-col space-y-4' : 'items-center justify-between'}`}>
          <div>
            <h1 className={`font-bold text-gray-900 ${isMobile ? 'text-2xl' : 'text-3xl'}`}>Relatórios e Analytics</h1>
            <p className={`text-gray-600 mt-2 ${isMobile ? 'text-sm' : ''}`}>Análise detalhada do desempenho do sistema</p>
          </div>
          <div className={`flex gap-3 ${isMobile ? 'flex-col' : ''}`}>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className={`border-gray-200 ${isMobile ? 'w-full' : 'w-40'}`}>
                <Calendar size={16} className="mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Últimos 7 dias</SelectItem>
                <SelectItem value="30d">Últimos 30 dias</SelectItem>
                <SelectItem value="90d">Últimos 90 dias</SelectItem>
                <SelectItem value="1y">Último ano</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className={`shadow-sm ${isMobile ? 'w-full' : ''}`}>
              <Download size={16} className="mr-2" />
              Exportar PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className={`grid ${isMobile ? 'grid-cols-1 gap-4' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'}`}>
        {reportStats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="shadow-sm border-gray-100 hover:shadow-md transition-shadow duration-200">
              <CardContent className={`${isMobile ? 'p-4' : 'p-6'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`font-medium text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'}`}>{stat.title}</p>
                    <p className={`font-bold text-gray-900 mt-1 ${isMobile ? 'text-xl' : 'text-2xl'}`}>{stat.value}</p>
                    <p className={`text-green-600 mt-1 ${isMobile ? 'text-xs' : 'text-sm'}`}>{stat.change} vs período anterior</p>
                  </div>
                  <div className={`rounded-lg bg-${stat.color}-500 flex items-center justify-center ${isMobile ? 'w-10 h-10' : 'w-12 h-12'}`}>
                    <stat.icon className="text-white" size={isMobile ? 20 : 24} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Reports Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className={`border-b border-gray-100 ${isMobile ? 'p-3' : 'px-6'}`}>
            <TabsList className={`bg-transparent border-none ${isMobile ? 'grid grid-cols-2 w-full' : ''}`}>
              <TabsTrigger 
                value="overview" 
                className={`data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600 ${isMobile ? 'text-xs' : ''}`}
              >
                Visão Geral
              </TabsTrigger>
              <TabsTrigger 
                value="contacts" 
                className={`data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600 ${isMobile ? 'text-xs' : ''}`}
              >
                Contatos
              </TabsTrigger>
              <TabsTrigger 
                value="quotes" 
                className={`data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600 ${isMobile ? 'text-xs' : ''}`}
              >
                Cotações
              </TabsTrigger>
            </TabsList>
          </div>

          <div className={`${isMobile ? 'p-4' : 'p-6'}`}>
            <TabsContent value="overview" className="mt-0">
              <OverviewCharts dateRange={dateRange} />
            </TabsContent>

            <TabsContent value="contacts" className="mt-0">
              <ContactsReport dateRange={dateRange} />
            </TabsContent>

            <TabsContent value="quotes" className="mt-0">
              <QuotesReport dateRange={dateRange} />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default ReportsSection;
