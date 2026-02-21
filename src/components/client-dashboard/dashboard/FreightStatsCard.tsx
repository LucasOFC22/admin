import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Truck, TrendingUp } from "lucide-react";
import { usePermissionGuard } from "@/hooks/usePermissionGuard";

interface FreightStatsCardProps {
  fretes7dias?: number;
  fretes15dias?: number;
  fretes30dias?: number;
  isLoading?: boolean;
}

const FreightStatsCard = ({ 
  fretes7dias = 0, 
  fretes15dias = 0, 
  fretes30dias = 0,
  isLoading = false 
}: FreightStatsCardProps) => {
  const { canView } = usePermissionGuard();
  
  const canViewFretes = canView('clientes.dashboard.fretes');
  
  if (!canViewFretes) {
    return null;
  }

  if (isLoading) {
    return (
      <Card className="border border-border shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <div className="w-1 h-5 bg-blue-600 rounded-full" />
              Meus Fretes
            </CardTitle>
            <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
              <Truck className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-12 bg-muted rounded-lg"></div>
            <div className="h-12 bg-muted rounded-lg"></div>
            <div className="h-12 bg-muted rounded-lg"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const stats = [
    { 
      label: 'Últimos 7 dias', 
      value: fretes7dias,
    },
    { 
      label: 'Últimos 15 dias', 
      value: fretes15dias,
    },
    { 
      label: 'Últimos 30 dias', 
      value: fretes30dias,
    },
  ];

  return (
    <Card className="border border-border shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <div className="w-1 h-5 bg-blue-600 rounded-full" />
            Meus Fretes
          </CardTitle>
          <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
            <Truck className="h-5 w-5 text-blue-600" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {stats.map((stat) => (
            <div 
              key={stat.label}
              className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/50 hover:border-blue-200 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-400" />
                <span className="text-sm text-muted-foreground font-medium">{stat.label}</span>
              </div>
              <div className="flex items-center gap-2">
                {stat.value > 0 && (
                  <TrendingUp className="h-3.5 w-3.5 text-green-500" />
                )}
                <span className="text-xl font-bold text-foreground">{stat.value}</span>
              </div>
            </div>
          ))}
        </div>
        
        {/* Summary */}
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total no período</span>
            <span className="font-bold text-blue-600 text-lg">
              {fretes7dias + fretes15dias + fretes30dias}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FreightStatsCard;
