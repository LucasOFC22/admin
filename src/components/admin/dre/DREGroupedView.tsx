import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { DRELancamento } from './DRETableGrid';
import { formatCurrency } from '@/lib/formatters';

export type GroupByType = 'banco' | 'fornecedor' | 'conta' | 'operacao' | 'grupo' | 'tipo-lancamento';

interface DREGroupedViewProps {
  lancamentos: DRELancamento[];
  groupBy: GroupByType;
  title: string;
}

export const DREGroupedView: React.FC<DREGroupedViewProps> = ({
  lancamentos,
  groupBy,
  title
}) => {
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

  const getGroupKey = (item: DRELancamento): string => {
    switch (groupBy) {
      case 'banco':
        return item.banco || 'Sem Banco';
      case 'fornecedor':
        return item.nome || 'Sem Fornecedor';
      case 'conta':
        return item.conta || 'Sem Conta';
      case 'operacao':
        return item.conta || 'Sem Operação';
      case 'grupo':
        return item.classe || 'Sem Grupo';
      case 'tipo-lancamento':
        return item.tipo;
      default:
        return 'Outros';
    }
  };

  const groupedData = lancamentos.reduce((acc, item) => {
    const key = getGroupKey(item);
    if (!acc[key]) {
      acc[key] = {
        items: [],
        totalReceitas: 0,
        totalDespesas: 0
      };
    }
    acc[key].items.push(item);
    if (item.tipo === 'RECEITA') {
      acc[key].totalReceitas += item.valor;
    } else {
      acc[key].totalDespesas += item.valor;
    }
    return acc;
  }, {} as Record<string, { items: DRELancamento[]; totalReceitas: number; totalDespesas: number }>);

  const sortedGroups = Object.entries(groupedData).sort((a, b) => {
    const totalA = a[1].totalReceitas - a[1].totalDespesas;
    const totalB = b[1].totalReceitas - b[1].totalDespesas;
    return totalB - totalA;
  });

  // formatCurrency imported from @/lib/formatters

  const toggleItem = (key: string) => {
    setOpenItems(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <Card>
      <CardHeader className="pb-2 sm:pb-6">
        <CardTitle className="text-base sm:text-lg">{title}</CardTitle>
        <p className="text-xs sm:text-sm text-muted-foreground">
          {sortedGroups.length} grupos · {lancamentos.length} lançamentos
        </p>
      </CardHeader>
      <CardContent className="space-y-2 px-2 sm:px-6">
        {sortedGroups.map(([groupName, data]) => {
          const saldo = data.totalReceitas - data.totalDespesas;
          const isOpen = openItems[groupName];

          return (
            <Collapsible key={groupName} open={isOpen} onOpenChange={() => toggleItem(groupName)}>
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between p-2 sm:p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                  <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
                    {isOpen ? (
                      <ChevronDown className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                    )}
                    <span className="font-medium text-xs sm:text-sm truncate">
                      {groupName}
                    </span>
                    <Badge variant="secondary" className="text-[10px] sm:text-xs flex-shrink-0">
                      {data.items.length}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-4 flex-shrink-0 ml-2">
                    <div className="text-right hidden sm:block">
                      <span className="text-xs text-muted-foreground">Rec: </span>
                      <span className="text-xs sm:text-sm text-green-600 font-medium">
                        {formatCurrency(data.totalReceitas)}
                      </span>
                    </div>
                    <div className="text-right hidden sm:block">
                      <span className="text-xs text-muted-foreground">Desp: </span>
                      <span className="text-xs sm:text-sm text-red-600 font-medium">
                        {formatCurrency(data.totalDespesas)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs sm:text-sm font-bold ${saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(saldo)}
                      </span>
                    </div>
                  </div>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-2 ml-4 sm:ml-6 space-y-1">
                  {data.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-1.5 sm:p-2 border-l-2 border-muted pl-2 sm:pl-3 text-xs sm:text-sm">
                      <div className="flex-1 min-w-0">
                        <p className="truncate">{item.nome}</p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">{item.documento}</p>
                      </div>
                      <span className={`font-medium flex-shrink-0 ml-2 ${item.tipo === 'RECEITA' ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(item.valor)}
                      </span>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </CardContent>
    </Card>
  );
};
