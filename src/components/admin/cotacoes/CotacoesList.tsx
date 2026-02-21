import { RefreshCw, Calculator } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import CotacaoCard from './CotacaoCard';
import { MappedQuote } from '@/utils/cotacaoMapper';
import { motion } from 'framer-motion';

interface CotacoesListProps {
  cotacoes: MappedQuote[];
  isLoading: boolean;
  onRefresh: () => void;
  onEdit?: (cotacao: MappedQuote) => void;
  onPrint?: (id: string) => void;
  onViewDetails?: (cotacao: MappedQuote) => void;
  onChangeStatus?: (cotacao: MappedQuote) => void;
}

export const CotacoesList = ({ 
  cotacoes, 
  isLoading, 
  onRefresh,
  onEdit,
  onPrint,
  onViewDetails,
  onChangeStatus
}: CotacoesListProps) => {
  if (isLoading) {
    return (
      <Card className="border border-border/60">
        <CardContent className="p-0">
          <div className="flex items-center justify-center py-20">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-10 w-10 border-2 border-muted border-t-foreground mx-auto"></div>
              <p className="text-sm text-muted-foreground">Carregando cotações...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (cotacoes.length === 0) {
    return (
      <Card className="border border-border/60">
        <CardContent className="p-0">
          <div className="text-center py-20 px-6">
            <div className="bg-muted/40 rounded-full p-6 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <Calculator className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              Nenhuma cotação encontrada
            </h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
              Não foram encontradas cotações que correspondam aos filtros aplicados.
            </p>
            <Button onClick={onRefresh} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Recarregar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-border/60">
      <CardHeader className="pb-4 border-b border-border/40">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base font-medium">
            <Calculator className="h-4 w-4 text-muted-foreground" />
            Cotações
            <Badge variant="secondary" className="ml-2 text-xs">
              {cotacoes.length} itens
            </Badge>
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[70vh] md:h-[600px]">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-4 md:p-5 space-y-4"
          >
            {cotacoes.map((cotacao) => (
              <CotacaoCard 
                key={cotacao.id} 
                cotacao={cotacao}
                onStatusChange={(id, status) => console.log('Status change:', id, status)}
                onEdit={onEdit || (() => {})}
                onPrint={onPrint || (() => {})}
                onViewDetails={onViewDetails || (() => {})}
                onChangeStatus={onChangeStatus || (() => {})}
              />
            ))}
          </motion.div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
