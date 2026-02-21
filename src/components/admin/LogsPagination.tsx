import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface LogsPaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export const LogsPagination = ({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange
}: LogsPaginationProps) => {
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);
  const safeTotalPages = Math.max(1, totalPages);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t">
      {/* Info e Page Size */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span>
          Mostrando <span className="font-medium text-foreground">{startItem}</span> a{' '}
          <span className="font-medium text-foreground">{endItem}</span> de{' '}
          <span className="font-medium text-foreground">{totalItems}</span> registro(s)
        </span>
        
        <div className="flex items-center gap-2">
          <span className="whitespace-nowrap">Por página:</span>
          <Select 
            value={pageSize.toString()} 
            onValueChange={(value) => onPageSizeChange(parseInt(value))}
          >
            <SelectTrigger className="w-[70px] h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
              <SelectItem value="200">200</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Controles de Paginação */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
        >
          <ChevronsLeft className="w-4 h-4" />
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>

        <div className="flex items-center gap-2 px-2">
          <span className="text-sm">
            Página <span className="font-medium">{currentPage}</span> de{' '}
            <span className="font-medium">{safeTotalPages}</span>
          </span>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= safeTotalPages}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(safeTotalPages)}
          disabled={currentPage >= safeTotalPages}
        >
          <ChevronsRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
