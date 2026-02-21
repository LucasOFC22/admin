import { CalendarDays, Clock, CheckCircle2, Building2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface WelcomeSectionProps {
  userName: string;
  lastLogin?: Date | null;
}

const WelcomeSection = ({ userName, lastLogin }: WelcomeSectionProps) => {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const firstName = userName?.split(' ')[0] || 'Cliente';
  const currentDate = format(new Date(), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR });

  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 p-4 sm:p-6 lg:p-8 text-white shadow-lg">
      <div className="relative z-10">
        {/* Main greeting */}
        <div className="mb-3 sm:mb-5">
          <p className="text-blue-100 text-[10px] sm:text-xs font-medium uppercase tracking-wider mb-1 sm:mb-1.5">
            Área do Cliente
          </p>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-0.5 sm:mb-1">
            {getGreeting()}, {firstName}!
          </h1>
          <p className="text-blue-100 text-xs sm:text-sm capitalize">
            {currentDate}
          </p>
        </div>

        {/* Info badges */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <div className="flex items-center gap-1.5 sm:gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-white/10">
            <CheckCircle2 size={12} className="sm:w-3.5 sm:h-3.5 text-green-300" />
            <span className="font-medium">Conta Ativa</span>
          </div>
          
          {lastLogin && (
            <div className="flex items-center gap-1.5 sm:gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-white/10">
              <Clock size={12} className="sm:w-3.5 sm:h-3.5" />
              <span className="hidden xs:inline">Último acesso: </span>
              <span>{format(lastLogin, "dd/MM 'às' HH:mm")}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WelcomeSection;
