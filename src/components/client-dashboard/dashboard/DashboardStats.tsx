
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { QuoteDetails } from "@/types/quote";
import { BarChart3, TrendingUp, Calendar, MapPin } from "lucide-react";
import { useClientActivityLogger } from '@/hooks/useClientActivityLogger';
import { useEffect } from 'react';

interface DashboardStatsProps {
  quotes: QuoteDetails[];
}

const DashboardStats = ({ quotes }: DashboardStatsProps) => {
  const { logActivity } = useClientActivityLogger();
  
  useEffect(() => {
    logActivity({
      acao: 'cliente_stats_carregar',
      modulo: 'cliente-dashboard',
      detalhes: { total_quotes: quotes.length }
    });
  }, [quotes.length]);
  const getStatusCount = (status: string) => 
    quotes.filter(q => q.status === status).length;

  const getMonthlyQuotes = () => {
    const currentMonth = new Date().getMonth();
    return quotes.filter(q => {
      const quoteDate = new Date(q.date);
      return quoteDate.getMonth() === currentMonth;
    }).length;
  };

  const getTopRoutes = () => {
    const routeCount: { [key: string]: number } = {};
    quotes.forEach(q => {
      const route = `${q.origin} → ${q.destination}`;
      routeCount[route] = (routeCount[route] || 0) + 1;
    });
    
    return Object.entries(routeCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);
  };

  const topRoutes = getTopRoutes();
  const monthlyQuotes = getMonthlyQuotes();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status das Cotações</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Aguardando Análise</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-2 bg-gray-200 rounded-full">
                    <div 
                      className="h-2 bg-amber-500 rounded-full"
                      style={{ width: `${quotes.length > 0 ? (getStatusCount("Aguardando análise") / quotes.length) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">{getStatusCount("Aguardando análise")}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Analisadas</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-2 bg-gray-200 rounded-full">
                    <div 
                      className="h-2 bg-blue-500 rounded-full"
                      style={{ width: `${quotes.length > 0 ? (getStatusCount("Analisada") / quotes.length) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">{getStatusCount("Analisada")}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Aprovadas</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-2 bg-gray-200 rounded-full">
                    <div 
                      className="h-2 bg-green-500 rounded-full"
                      style={{ width: `${quotes.length > 0 ? (getStatusCount("Aprovada") / quotes.length) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">{getStatusCount("Aprovada")}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Atividade do Mês</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{monthlyQuotes}</div>
            <p className="text-xs text-muted-foreground">
              {monthlyQuotes > 0 ? "cotações solicitadas este mês" : "Nenhuma cotação este mês"}
            </p>
            <div className="mt-4 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-sm text-green-600">Ativo</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Rotas Mais Solicitadas
          </CardTitle>
          <CardDescription>
            As rotas que você mais solicita cotações
          </CardDescription>
        </CardHeader>
        <CardContent>
          {topRoutes.length > 0 ? (
            <div className="space-y-3">
              {topRoutes.map(([route, count], index) => (
                <div key={route} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-corporate-100 text-corporate-600 rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium">
                      {index + 1}
                    </div>
                    <span className="text-sm">{route}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{count} cotações</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">Nenhuma rota encontrada</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardStats;
