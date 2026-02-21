import { Button } from "@/components/ui/button";
import { CheckCircle2, FileText, ArrowRight, Copy } from "lucide-react";
import { useEffect } from "react";
import { toast } from "@/lib/toast";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

interface ClientQuoteSuccessProps {
  cotacaoId?: string | null;
}

export const ClientQuoteSuccess = ({ cotacaoId }: ClientQuoteSuccessProps) => {
  useEffect(() => {
    toast.success("Cotação enviada!", {
      description: "Sua solicitação foi registrada com sucesso."
    });
  }, []);

  const copyToClipboard = () => {
    if (cotacaoId) {
      navigator.clipboard.writeText(cotacaoId);
      toast.success("ID copiado para a área de transferência");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-12 px-4 text-center"
    >
      {/* Ícone de sucesso */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
        className="relative mb-6"
      >
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10 text-primary" />
        </div>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3 }}
          className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center"
        >
          <CheckCircle2 className="w-4 h-4 text-primary-foreground" />
        </motion.div>
      </motion.div>

      {/* Mensagem */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-2 mb-6"
      >
        <h2 className="text-2xl font-bold text-foreground">
          Cotação Enviada!
        </h2>
        <p className="text-muted-foreground max-w-md">
          Sua solicitação foi registrada e nossa equipe entrará em contato em breve.
        </p>
      </motion.div>

      {/* ID da cotação */}
      {cotacaoId && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <div className="inline-flex items-center gap-3 px-4 py-3 rounded-xl bg-accent border border-border">
            <span className="text-sm text-muted-foreground">ID da Cotação:</span>
            <code className="text-lg font-mono font-semibold text-primary">
              {cotacaoId}
            </code>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={copyToClipboard}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      )}

      {/* Próximos passos */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="w-full max-w-sm space-y-3 mb-8"
      >
        <p className="text-sm font-medium text-foreground mb-3">Próximos passos:</p>
        <div className="space-y-2 text-left">
          {[
            "Análise dos detalhes da sua carga",
            "Proposta personalizada em até 24h",
            "Acompanhe pelo painel de cotações"
          ].map((step, index) => (
            <div key={index} className="flex items-center gap-3 text-sm text-muted-foreground">
              <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-xs font-semibold text-primary">{index + 1}</span>
              </div>
              {step}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Ações */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex flex-col sm:flex-row gap-3"
      >
        <Button asChild variant="outline" className="gap-2">
          <Link to="/area-cliente/cotacoes">
            <FileText className="h-4 w-4" />
            Ver Minhas Cotações
          </Link>
        </Button>
        <Button asChild className="gap-2">
          <Link to="/area-cliente">
            Ir para o Painel
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </motion.div>
    </motion.div>
  );
};
