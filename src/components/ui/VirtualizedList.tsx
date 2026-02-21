import React, { useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';

interface VirtualizedListProps<T> {
  items: T[];
  height: number;
  width?: number;
  itemHeight: number;
  renderItem: (props: { index: number; style: React.CSSProperties; data: T[] }) => React.ReactElement;
  className?: string;
  overscanCount?: number;
}

// ✅ OTIMIZAÇÃO: Lista virtualizada para grandes datasets
export const VirtualizedList = React.memo(<T,>({
  items,
  height,
  width = 800,
  itemHeight,
  renderItem,
  className = '',
  overscanCount = 5
}: VirtualizedListProps<T>) => {
  // ✅ OTIMIZAÇÃO 1: Memoizar item data para evitar re-renders
  const itemData = useMemo(() => items, [items]);

  // ✅ OTIMIZAÇÃO 2: Componente de item memoizado
  const MemoizedItem = useMemo(() => 
    React.memo(({ index, style, data }: { index: number; style: React.CSSProperties; data: T[] }) => 
      renderItem({ index, style, data })
    ), 
    [renderItem]
  );

  if (!items.length) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height }}>
        <p className="text-gray-500">Nenhum item encontrado</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <List
        height={height}
        width={width}
        itemCount={items.length}
        itemSize={itemHeight}
        itemData={itemData}
        overscanCount={overscanCount}
      >
        {MemoizedItem}
      </List>
    </div>
  );
});

VirtualizedList.displayName = 'VirtualizedList';

// ✅ OTIMIZAÇÃO: Hook para paginação virtual
export const useVirtualPagination = <T,>(
  items: T[],
  pageSize: number = 50
) => {
  const [currentPage, setCurrentPage] = React.useState(0);

  const paginatedItems = useMemo(() => {
    const start = currentPage * pageSize;
    const end = start + pageSize;
    return items.slice(start, end);
  }, [items, currentPage, pageSize]);

  const totalPages = useMemo(() => 
    Math.ceil(items.length / pageSize), 
    [items.length, pageSize]
  );

  const hasNextPage = useMemo(() => 
    currentPage < totalPages - 1, 
    [currentPage, totalPages]
  );

  const hasPrevPage = useMemo(() => 
    currentPage > 0, 
    [currentPage]
  );

  const nextPage = React.useCallback(() => {
    if (hasNextPage) {
      setCurrentPage(prev => prev + 1);
    }
  }, [hasNextPage]);

  const prevPage = React.useCallback(() => {
    if (hasPrevPage) {
      setCurrentPage(prev => prev - 1);
    }
  }, [hasPrevPage]);

  const goToPage = React.useCallback((page: number) => {
    if (page >= 0 && page < totalPages) {
      setCurrentPage(page);
    }
  }, [totalPages]);

  return {
    items: paginatedItems,
    currentPage,
    totalPages,
    hasNextPage,
    hasPrevPage,
    nextPage,
    prevPage,
    goToPage,
    totalItems: items.length
  };
};

// ✅ OTIMIZAÇÃO: Hook para infinite scroll
export const useInfiniteScroll = <T,>(
  items: T[],
  loadMore: () => Promise<void>,
  hasMore: boolean = true,
  threshold: number = 100
) => {
  const [loading, setLoading] = React.useState(false);
  const [displayedItems, setDisplayedItems] = React.useState<T[]>([]);
  const loadMoreRef = React.useRef<HTMLDivElement>(null);

  // Intersection Observer para detectar scroll
  React.useEffect(() => {
    const target = loadMoreRef.current;
    if (!target || !hasMore) return;

    const observer = new IntersectionObserver(
      async ([entry]) => {
        if (entry.isIntersecting && !loading && hasMore) {
          setLoading(true);
          try {
            await loadMore();
          } finally {
            setLoading(false);
          }
        }
      },
      { rootMargin: `${threshold}px` }
    );

    observer.observe(target);

    return () => {
      observer.unobserve(target);
    };
  }, [loadMore, hasMore, loading, threshold]);

  // Atualizar items exibidos
  React.useEffect(() => {
    setDisplayedItems(items);
  }, [items]);

  return {
    displayedItems,
    loading,
    loadMoreRef
  };
};

export default VirtualizedList;