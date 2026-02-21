import React from 'react';
import { Search, Filter, FilterX } from 'lucide-react';

interface TicketsSearchBarProps {
  searchParam: string;
  onSearchChange: (value: string) => void;
  showFilters: boolean;
  hasActiveFilters: boolean;
  onToggleFilters: () => void;
}

export const TicketsSearchBar: React.FC<TicketsSearchBarProps> = ({
  searchParam,
  onSearchChange,
  showFilters,
  hasActiveFilters,
  onToggleFilters
}) => {
  return (
    <div className="p-2 sm:p-3">
      <div className="flex items-center gap-2">
        <Search className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0" />
        <input
          type="search"
          placeholder="Buscar..."
          className="border-none outline-none flex-1 text-xs sm:text-sm p-1 bg-transparent min-w-0"
          value={searchParam}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        <button
          onClick={onToggleFilters}
          className="bg-transparent border-none rounded p-1.5 sm:p-2 cursor-pointer flex items-center flex-shrink-0"
          aria-label="filter"
        >
          {hasActiveFilters || showFilters ? (
            <Filter className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
          ) : (
            <FilterX className="h-4 w-4 sm:h-5 sm:w-5 text-red-400" />
          )}
        </button>
      </div>
    </div>
  );
};
