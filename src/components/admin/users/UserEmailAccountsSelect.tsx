import React from 'react';
import { Mail, Star, Check } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useEmailContas } from '@/hooks/useEmailContas';
import { cn } from '@/lib/utils';

interface UserEmailAccountsSelectProps {
  selectedIds: string[];
  defaultAccountId?: string;
  onSelectionChange: (ids: string[]) => void;
  onDefaultChange: (id: string | undefined) => void;
}

const UserEmailAccountsSelect: React.FC<UserEmailAccountsSelectProps> = ({
  selectedIds,
  defaultAccountId,
  onSelectionChange,
  onDefaultChange
}) => {
  const { contas, loading } = useEmailContas();

  const handleToggle = (contaId: string) => {
    if (selectedIds.includes(contaId)) {
      // Remover
      const newSelection = selectedIds.filter(id => id !== contaId);
      onSelectionChange(newSelection);
      // Se era a padrão, limpar
      if (defaultAccountId === contaId) {
        onDefaultChange(newSelection.length > 0 ? newSelection[0] : undefined);
      }
    } else {
      // Adicionar
      const newSelection = [...selectedIds, contaId];
      onSelectionChange(newSelection);
      // Se é a primeira, definir como padrão
      if (newSelection.length === 1) {
        onDefaultChange(contaId);
      }
    }
  };

  const handleSetDefault = (contaId: string) => {
    if (selectedIds.includes(contaId)) {
      onDefaultChange(contaId);
    }
  };

  if (loading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (contas.length === 0) {
    return (
      <Card className="p-4 text-center text-muted-foreground">
        <Mail className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Nenhuma conta de email configurada</p>
        <p className="text-xs mt-1">Configure em Configurações → Email</p>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {contas.filter(c => c.ativo).map((conta) => {
        const isSelected = selectedIds.includes(conta.id);
        const isDefault = defaultAccountId === conta.id;

        return (
          <Card
            key={conta.id}
            className={cn(
              "p-3 cursor-pointer transition-all",
              isSelected 
                ? "border-primary bg-primary/5" 
                : "hover:border-muted-foreground/30"
            )}
            onClick={(e) => {
              // Radix Checkbox dispara um "click" sintético no input oculto (BubbleInput)
              // quando o estado muda. Se o Card reagir a esse evento, ocorre toggle em loop
              // (React #185). Ignorar cliques originados no checkbox/input.
              const target = e.target as HTMLElement;
              if (target?.tagName === 'INPUT') return;
              if (target?.closest('button[role="checkbox"]')) return;
              handleToggle(conta.id);
            }}
          >
            <div className="flex items-center gap-3">
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => handleToggle(conta.id)}
                onClick={(e) => e.stopPropagation()}
              />
              
              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Mail className="h-4 w-4 text-primary" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm truncate">{conta.nome}</p>
                  {isDefault && (
                    <Badge variant="secondary" className="text-xs">
                      <Star className="h-3 w-3 mr-1 fill-current" />
                      Padrão
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">{conta.email}</p>
              </div>
              
              {isSelected && !isDefault && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSetDefault(conta.id);
                  }}
                >
                  Definir padrão
                </Button>
              )}
              
              {isSelected && isDefault && (
                <Check className="h-4 w-4 text-primary flex-shrink-0" />
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export default UserEmailAccountsSelect;
