
import { useState, useRef, useEffect } from 'react';
import { Search, FileText, Users, MessageCircle, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useGlobalSearch } from '@/hooks/useGlobalSearch';
import { motion, AnimatePresence } from 'framer-motion';

interface GlobalSearchProps {
  onNavigate: (type: 'quotes' | 'contacts' | 'chat', id?: string) => void;
}

const GlobalSearch = ({ onNavigate }: GlobalSearchProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const { searchResults, isSearching } = useGlobalSearch(searchTerm);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case 'quote':
        return <FileText className="w-4 h-4 text-blue-600" />;
      case 'contact':
        return <Users className="w-4 h-4 text-green-600" />;
      case 'chat':
        return <MessageCircle className="w-4 h-4 text-purple-600" />;
      default:
        return <Search className="w-4 h-4" />;
    }
  };

  const handleResultClick = (result: any) => {
    switch (result.type) {
      case 'quote':
        onNavigate('quotes', result.id);
        break;
      case 'contact':
        onNavigate('contacts', result.id);
        break;
      case 'chat':
        onNavigate('chat', result.id);
        break;
    }
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div ref={searchRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
        <Input
          placeholder="Buscar em todo sistema..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(e.target.value.length >= 2);
          }}
          onFocus={() => setIsOpen(searchTerm.length >= 2)}
          className="pl-10 w-80 bg-gray-50 border-gray-200 focus:bg-white"
        />
      </div>

      <AnimatePresence>
        {isOpen && (searchResults.length > 0 || isSearching) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-[350] max-h-96 overflow-y-auto"
          >
            {isSearching ? (
              <div className="p-4 text-center text-gray-500">
                <Search className="w-6 h-6 mx-auto mb-2 animate-spin" />
                Buscando...
              </div>
            ) : (
              <>
                <div className="px-4 py-2 border-b border-gray-100 text-sm text-gray-600 font-medium">
                  {searchResults.length} resultado(s) encontrado(s)
                </div>
                {searchResults.map((result) => (
                  <Button
                    key={`${result.type}-${result.id}`}
                    variant="ghost"
                    className="w-full justify-start p-4 h-auto hover:bg-gray-50 border-b border-gray-50 last:border-b-0"
                    onClick={() => handleResultClick(result)}
                  >
                    <div className="flex items-start gap-3 w-full">
                      <div className="mt-1">
                        {getIcon(result.type)}
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-medium text-gray-900">{result.title}</div>
                        <div className="text-sm text-gray-600">{result.subtitle}</div>
                        <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                          {result.description}
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-400 mt-1" />
                    </div>
                  </Button>
                ))}
                {searchResults.length === 0 && !isSearching && (
                  <div className="p-4 text-center text-gray-500">
                    Nenhum resultado encontrado
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GlobalSearch;
