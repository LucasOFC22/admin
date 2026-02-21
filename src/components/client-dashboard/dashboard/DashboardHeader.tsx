
import { Button } from "@/components/ui/button";
import { LogOut, RefreshCw, Settings, Power, RotateCcw } from "lucide-react";
import { User as AuthUser } from "@/lib/auth";

interface DashboardHeaderProps {
  currentUser: AuthUser | null;
  autoRefreshEnabled: boolean;
  isRefreshing: boolean;
  isLoadingQuotes: boolean;
  onToggleAutoRefresh: () => void;
  onManualRefresh: () => void;
  onLogout: () => void;
}

const DashboardHeader = ({
  currentUser,
  autoRefreshEnabled,
  isRefreshing,
  isLoadingQuotes,
  onToggleAutoRefresh,
  onManualRefresh,
  onLogout
}: DashboardHeaderProps) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-br from-corporate-500 to-corporate-600 rounded-xl p-3 shadow-sm">
            <Settings className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Controles do Dashboard</h2>
            <p className="text-sm text-gray-600">Gerencie suas preferências e atualizações</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            variant={autoRefreshEnabled ? "default" : "outline"}
            size="sm"
            onClick={onToggleAutoRefresh}
            className={`transition-all duration-200 ${
              autoRefreshEnabled 
                ? 'bg-green-600 hover:bg-green-700 shadow-sm' 
                : 'border-green-200 text-green-600 hover:bg-green-50'
            }`}
          >
            <Power size={16} className="mr-2" />
            Auto {autoRefreshEnabled ? "ON" : "OFF"}
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={onManualRefresh}
            disabled={isRefreshing || isLoadingQuotes}
            className="border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200"
          >
            <RotateCcw size={16} className={`mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
          
          <Button 
            variant="outline" 
            onClick={onLogout} 
            className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 transition-all duration-200"
          >
            <LogOut size={16} className="mr-2" />
            Sair
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;
