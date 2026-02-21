import React from 'react';
import { VirtualizedList } from './VirtualizedList';
import { ScrollArea } from './scroll-area';

interface VirtualizedModalListProps<T> {
  items: T[];
  itemHeight: number;
  renderItem: (props: { index: number; style: React.CSSProperties; data: T[] }) => React.ReactElement;
  className?: string;
  maxHeight?: number;
  emptyMessage?: string;
}

/**
 * Lista virtualizada otimizada para uso em modais
 * 
 * Otimizações:
 * - Renderiza apenas itens visíveis
 * - Altura máxima configurável
 * - Integração com ScrollArea para scrollbar customizada
 * - Performance otimizada para grandes datasets
 */
export const VirtualizedModalList = <T,>({
  items,
  itemHeight,
  renderItem,
  className = '',
  maxHeight = 400,
  emptyMessage = 'Nenhum item encontrado'
}: VirtualizedModalListProps<T>) => {
  // Calcular altura da lista baseado nos itens
  const listHeight = Math.min(items.length * itemHeight, maxHeight);

  if (!items.length) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height: maxHeight }}>
        <p className="text-muted-foreground text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <ScrollArea className={className} style={{ height: listHeight }}>
      <VirtualizedList
        items={items}
        height={listHeight}
        itemHeight={itemHeight}
        renderItem={renderItem}
        overscanCount={3}
      />
    </ScrollArea>
  );
};

/**
 * Hook para criar item renderer otimizado
 * Memoiza o componente para evitar re-renders desnecessários
 */
export const useOptimizedItemRenderer = <T,>(
  renderFunction: (item: T, index: number) => React.ReactNode
) => {
  return React.useCallback(
    ({ index, style, data }: { index: number; style: React.CSSProperties; data: T[] }) => {
      const item = data[index];
      return (
        <div style={style} key={index}>
          {renderFunction(item, index)}
        </div>
      );
    },
    [renderFunction]
  );
};

export default VirtualizedModalList;
