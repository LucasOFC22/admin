import { TableHead } from '@/components/ui/table';
import { ArrowUp, ArrowDown, ChevronsUpDown } from 'lucide-react';
import { SortField, SortOrder } from '@/hooks/useUnifiedUsers';

interface SortableTableHeadProps {
  field: SortField;
  label: string;
  currentSortField?: SortField;
  currentSortOrder?: SortOrder;
  onSort?: (field: SortField) => void;
}

export const SortableTableHead = ({
  field,
  label,
  currentSortField,
  currentSortOrder,
  onSort
}: SortableTableHeadProps) => {
  const isSorted = currentSortField === field;
  const canSort = !!onSort;

  return (
    <TableHead 
      className={canSort ? 'cursor-pointer select-none hover:bg-muted/50' : ''}
      onClick={() => canSort && onSort(field)}
    >
      <div className="flex items-center gap-2">
        <span>{label}</span>
        {canSort && (
          <span className="inline-block">
            {isSorted ? (
              currentSortOrder === 'asc' ? (
                <ArrowUp className="w-4 h-4" />
              ) : (
                <ArrowDown className="w-4 h-4" />
              )
            ) : (
              <ChevronsUpDown className="w-4 h-4 text-muted-foreground/50" />
            )}
          </span>
        )}
      </div>
    </TableHead>
  );
};
