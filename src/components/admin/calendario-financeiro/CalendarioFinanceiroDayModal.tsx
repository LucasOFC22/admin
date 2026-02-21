import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface DayDetailItem {
  id: string;
  cliente: string;
  cpfCnpj: string;
  documento: string;
  valor: number;
  status: 'aberto' | 'atrasado' | 'liquidado';
  tipo: 'receita' | 'despesa';
}

interface CalendarioFinanceiroDayModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: Date | null;
  items: DayDetailItem[];
  tipo: 'receita' | 'despesa';
}

import { formatCurrency } from '@/lib/formatters';

const getStatusBadge = (status: DayDetailItem['status']) => {
  switch (status) {
    case 'liquidado':
      return (
        <Badge className="bg-green-200 dark:bg-green-800/50 text-green-900 dark:text-green-100 hover:bg-green-200">
          Liquidado
        </Badge>
      );
    case 'aberto':
      return (
        <Badge className="bg-yellow-200 dark:bg-yellow-800/50 text-yellow-900 dark:text-yellow-100 hover:bg-yellow-200">
          Aberto
        </Badge>
      );
    case 'atrasado':
      return (
        <Badge className="bg-red-200 dark:bg-red-800/50 text-red-900 dark:text-red-100 hover:bg-red-200">
          Atrasado
        </Badge>
      );
  }
};

export const CalendarioFinanceiroDayModal: React.FC<CalendarioFinanceiroDayModalProps> = ({
  open,
  onOpenChange,
  date,
  items,
  tipo,
}) => {
  const total = items.reduce((acc, item) => acc + item.valor, 0);
  const isReceita = tipo === 'receita';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isReceita ? (
              <TrendingUp className="h-5 w-5 text-green-600" aria-hidden="true" />
            ) : (
              <TrendingDown className="h-5 w-5 text-red-600" aria-hidden="true" />
            )}
            {isReceita ? 'Receitas' : 'Despesas'} do Dia
            {date && (
              <span className="text-muted-foreground font-normal ml-2">
                - {format(date, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-2">
          {items.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum registro encontrado para este dia.
            </p>
          ) : (
            items.map((item) => (
              <Card key={item.id} className="p-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2 sm:gap-3">
                  <div className="md:col-span-2">
                    <Label className="text-xs text-muted-foreground">Cliente</Label>
                    <p className="font-semibold text-sm truncate" title={item.cliente}>
                      {item.cliente}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">CPF/CNPJ</Label>
                    <p className="text-sm">{item.cpfCnpj}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Título/Doc</Label>
                    <p className="text-sm font-medium">{item.documento || item.id || '-'}</p>
                  </div>
                  <div className="flex sm:flex-col justify-between sm:justify-start gap-2">
                    <div>
                      <Label className="text-xs text-muted-foreground">Valor</Label>
                      <p className={`font-semibold text-sm ${isReceita ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(item.valor)}
                      </p>
                    </div>
                    <div className="sm:hidden">
                      {getStatusBadge(item.status)}
                    </div>
                  </div>
                  <div className="hidden sm:block md:hidden lg:block">
                    <Label className="text-xs text-muted-foreground">Status</Label>
                    <div className="mt-0.5">{getStatusBadge(item.status)}</div>
                  </div>
                </div>
              </Card>
            ))
          )}

          {items.length > 0 && (
            <div className="mt-4 pt-4 border-t flex justify-between items-center">
              <span className="font-semibold">Total:</span>
              <span className={`text-xl font-bold ${isReceita ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(total)}
              </span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};