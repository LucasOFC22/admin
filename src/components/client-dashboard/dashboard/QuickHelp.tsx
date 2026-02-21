import { HelpCircle, MessageCircle, Phone, Mail, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

const faqs = [
  {
    question: 'Como rastrear minha mercadoria?',
    answer: 'Use o menu "Rastrear" na barra lateral ou acesse a página de rastreamento com o número do seu conhecimento.',
  },
  {
    question: 'Como solicitar uma nova coleta?',
    answer: 'Acesse o menu Coleta > Criar e preencha os dados de coleta. Nossa equipe entrará em contato.',
  },
  {
    question: 'Onde vejo meus títulos e boletos?',
    answer: 'No menu Financeiro você encontra todos os títulos em aberto e pode gerar segunda via de boletos.',
  },
];

const QuickHelp = () => {
  return (
    <div className="bg-card rounded-xl border border-border p-4 sm:p-5 lg:p-6">
      <div className="flex items-start justify-between mb-3 sm:mb-5">
        <div>
          <h2 className="text-base sm:text-lg font-semibold text-foreground flex items-center gap-2">
            <HelpCircle size={16} className="sm:w-[18px] sm:h-[18px] text-blue-600" />
            Central de Ajuda
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">
            Dúvidas frequentes e canais de atendimento
          </p>
        </div>
      </div>

      {/* FAQ */}
      <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-5">
        {faqs.map((faq, index) => (
          <div key={index} className="p-2.5 sm:p-3 rounded-lg bg-muted/30 border border-border/50">
            <h4 className="font-medium text-foreground text-xs sm:text-sm mb-0.5 sm:mb-1">{faq.question}</h4>
            <p className="text-[10px] sm:text-xs text-muted-foreground leading-relaxed">{faq.answer}</p>
          </div>
        ))}
      </div>

      {/* Contact channels */}
      <div className="border-t border-border pt-3 sm:pt-4">
        <p className="text-[10px] sm:text-xs text-muted-foreground mb-2 sm:mb-3 font-medium uppercase tracking-wide">
          Precisa de mais ajuda?
        </p>
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 text-[10px] sm:text-xs h-7 sm:h-8 px-2 sm:px-3 border-border hover:border-blue-300 hover:bg-blue-50" asChild>
            <a href="https://wa.me/5511999999999" target="_blank" rel="noopener noreferrer">
              <MessageCircle size={12} className="sm:w-3.5 sm:h-3.5 text-blue-600" />
              WhatsApp
            </a>
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 text-[10px] sm:text-xs h-7 sm:h-8 px-2 sm:px-3 border-border hover:border-blue-300 hover:bg-blue-50" asChild>
            <a href="tel:+551133333333">
              <Phone size={12} className="sm:w-3.5 sm:h-3.5 text-blue-600" />
              Telefone
            </a>
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 text-[10px] sm:text-xs h-7 sm:h-8 px-2 sm:px-3 border-border hover:border-blue-300 hover:bg-blue-50" asChild>
            <a href="mailto:contato@fptranscargas.com.br">
              <Mail size={12} className="sm:w-3.5 sm:h-3.5 text-blue-600" />
              Email
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default QuickHelp;
