import { Cotacao } from '@/types/cotacao';

export interface CotacaoViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cotacao: Cotacao;
}
