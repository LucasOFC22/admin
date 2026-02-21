
import { User, CheckCircle, Clock, AlertCircle, TrendingUp, Package, FileText } from "lucide-react";
import { User as AuthUser } from "@/lib/auth";
import { QuoteDetails } from "@/types/quote";
import { formatCnpjCpf } from "@/lib/utils";
import { useClientDocumentStore } from "@/stores/clientDocumentStore";

interface DashboardWelcomeProps {
  currentUser: AuthUser | null;
  quotes: QuoteDetails[];
}

const DashboardWelcome = ({ currentUser, quotes }: DashboardWelcomeProps) => {
  const { selectedDocument } = useClientDocumentStore();
  const totalQuotes = quotes.length;
  const pendingQuotes = quotes.filter(q => q.status === "Aguardando análise").length;
  const approvedQuotes = quotes.filter(q => q.status === "Aprovada").length;
  const proposalsSent = quotes.filter(q => q.status === "proposta_enviada").length;

  return (
    <div className="mb-8">
      {/* Welcome Header */}
      <div className="relative bg-gradient-to-br from-corporate-600 via-corporate-700 to-corporate-800 rounded-3xl p-8 text-white mb-8 overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-6 mb-6">
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
              <User className="h-10 w-10" />
            </div>
            <div>
              <h1 className="text-4xl font-bold mb-2">Olá, {currentUser?.nome || "Cliente"}!</h1>
              <p className="text-corporate-100 text-xl font-medium">Bem-vindo ao seu painel de controle</p>
              <p className="text-corporate-200 text-base mt-1">Gerencie suas cotações e acompanhe seus serviços</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="flex items-center gap-3">
                <FileText className="h-6 w-6 text-blue-300" />
                <div>
                  <p className="text-sm text-corporate-100 mb-1">CNPJ/CPF vinculado</p>
                  <span className="font-semibold text-lg font-mono">
                    {selectedDocument ? formatCnpjCpf(selectedDocument) : 'Não informado'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-6 w-6 text-blue-300" />
                <div>
                  <p className="text-sm text-corporate-100 mb-1">Última atividade</p>
                  <span className="font-semibold text-lg">Hoje</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="group bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:border-corporate-200 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-blue-50 rounded-xl p-3 group-hover:bg-blue-100 transition-colors">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-gray-900">{totalQuotes}</p>
              <p className="text-sm font-medium text-gray-600">Total de Cotações</p>
            </div>
          </div>
          <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full w-full"></div>
          </div>
        </div>

        <div className="group bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:border-amber-200 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-amber-50 rounded-xl p-3 group-hover:bg-amber-100 transition-colors">
              <Clock className="h-6 w-6 text-amber-600" />
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-amber-600">{pendingQuotes}</p>
              <p className="text-sm font-medium text-gray-600">Em Análise</p>
            </div>
          </div>
          <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-amber-500 rounded-full" style={{width: totalQuotes > 0 ? `${(pendingQuotes / totalQuotes) * 100}%` : '0%'}}></div>
          </div>
        </div>

        <div className="group bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:border-green-200 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-green-50 rounded-xl p-3 group-hover:bg-green-100 transition-colors">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-green-600">{approvedQuotes}</p>
              <p className="text-sm font-medium text-gray-600">Aprovadas</p>
            </div>
          </div>
          <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 rounded-full" style={{width: totalQuotes > 0 ? `${(approvedQuotes / totalQuotes) * 100}%` : '0%'}}></div>
          </div>
        </div>

        <div className="group bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:border-purple-200 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-purple-50 rounded-xl p-3 group-hover:bg-purple-100 transition-colors">
              <AlertCircle className="h-6 w-6 text-purple-600" />
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-purple-600">{proposalsSent}</p>
              <p className="text-sm font-medium text-gray-600">Propostas Enviadas</p>
            </div>
          </div>
          <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-purple-500 rounded-full" style={{width: totalQuotes > 0 ? `${(proposalsSent / totalQuotes) * 100}%` : '0%'}}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardWelcome;
