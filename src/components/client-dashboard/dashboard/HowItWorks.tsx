import { FileText, Calculator, Truck, CheckCircle } from 'lucide-react';
const steps = [{
  icon: FileText,
  title: 'Solicite uma Cotação',
  description: 'Informe origem, destino e detalhes da carga para receber o valor do frete.'
}, {
  icon: Calculator,
  title: 'Receba o Valor',
  description: 'Nossa equipe analisa e retorna com o melhor preço para seu transporte.'
}, {
  icon: Truck,
  title: 'Agende a Coleta',
  description: 'Confirme a cotação e solicite a coleta da mercadoria no local desejado.'
}, {
  icon: CheckCircle,
  title: 'Acompanhe a Entrega',
  description: 'Rastreie sua carga em tempo real até a entrega no destino final.'
}];
const HowItWorks = () => {
  return <div className="bg-card rounded-xl border border-border p-4 sm:p-5 lg:p-6">
      <div className="mb-3 sm:mb-5">
        <h2 className="text-base sm:text-lg font-semibold text-foreground">Como Funciona</h2>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">Solicitar um frete com a FP Transcargas é simples e rápido</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 lg:gap-4">
        {steps.map((step, index) => {
        const Icon = step.icon;
        return <div key={index} className="relative flex flex-col items-start p-3 sm:p-4 rounded-lg bg-muted/30 border border-border/50 hover:border-blue-200 hover:bg-blue-50/30 transition-colors">
              {/* Step number */}
              <div className="absolute top-2 right-2 sm:top-3 sm:right-3 text-xl sm:text-2xl font-bold text-muted-foreground/15">
                {index + 1}
              </div>
              
              {/* Icon */}
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center mb-2 sm:mb-3">
                <Icon size={16} className="sm:hidden text-blue-600" />
                <Icon size={20} className="hidden sm:block text-blue-600" />
              </div>
              
              {/* Content */}
              <h3 className="font-semibold text-foreground text-xs sm:text-sm mb-0.5 sm:mb-1 leading-tight">{step.title}</h3>
              <p className="text-[10px] sm:text-xs text-muted-foreground leading-relaxed line-clamp-3 sm:line-clamp-none">{step.description}</p>
            </div>;
      })}
      </div>
    </div>;
};
export default HowItWorks;