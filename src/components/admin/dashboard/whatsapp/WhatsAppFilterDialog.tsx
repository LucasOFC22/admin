import { useState } from 'react';
import { motion } from 'framer-motion';
import { Filter, Calendar, Users, Layers, X, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { DashboardFilters } from '@/hooks/useWhatsAppDashboardStats';

interface WhatsAppFilterDialogProps {
  filters: DashboardFilters;
  filas: string[];
  onApplyFilters: (filters: DashboardFilters) => void;
  onClearFilters: () => void;
}

const WhatsAppFilterDialog = ({
  filters,
  filas,
  onApplyFilters,
  onClearFilters
}: WhatsAppFilterDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState<DashboardFilters>(filters);

  const handleApply = () => {
    onApplyFilters(localFilters);
    setIsOpen(false);
  };

  const handleClear = () => {
    onClearFilters();
    setLocalFilters({
      dataInicio: new Date(new Date().setHours(0, 0, 0, 0)),
      dataFim: new Date(),
      fila: null,
      atendente: null
    });
  };

  const activeFiltersCount = [
    filters.fila,
    filters.atendente
  ].filter(Boolean).length;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Filter className="h-4 w-4" />
          Filtros
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-primary" />
            Filtros do Dashboard
          </DialogTitle>
        </DialogHeader>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6 py-4"
        >
          {/* Período */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              Período
            </Label>
            <div className="grid grid-cols-2 gap-3">
              {/* Data Início */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="justify-start text-left font-normal"
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {localFilters.dataInicio 
                      ? format(localFilters.dataInicio, 'dd/MM/yyyy', { locale: ptBR })
                      : 'Data início'
                    }
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={localFilters.dataInicio || undefined}
                    onSelect={(date) => setLocalFilters(prev => ({ ...prev, dataInicio: date || null }))}
                    locale={ptBR}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              {/* Data Fim */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="justify-start text-left font-normal"
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {localFilters.dataFim 
                      ? format(localFilters.dataFim, 'dd/MM/yyyy', { locale: ptBR })
                      : 'Data fim'
                    }
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={localFilters.dataFim || undefined}
                    onSelect={(date) => setLocalFilters(prev => ({ ...prev, dataFim: date || null }))}
                    locale={ptBR}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Fila */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <Layers className="h-4 w-4 text-muted-foreground" />
              Fila de Atendimento
            </Label>
            <Select
              value={localFilters.fila || 'all'}
              onValueChange={(value) => setLocalFilters(prev => ({ 
                ...prev, 
                fila: value === 'all' ? null : value 
              }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas as filas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as filas</SelectItem>
                {filas.map((fila) => (
                  <SelectItem key={fila} value={fila}>
                    {fila}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Atalhos de período */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-muted-foreground">
              Atalhos de período
            </Label>
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'Hoje', days: 0 },
                { label: '7 dias', days: 7 },
                { label: '15 dias', days: 15 },
                { label: '30 dias', days: 30 }
              ].map((shortcut) => (
                <Button
                  key={shortcut.label}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const end = new Date();
                    const start = new Date();
                    start.setDate(start.getDate() - shortcut.days);
                    start.setHours(0, 0, 0, 0);
                    setLocalFilters(prev => ({
                      ...prev,
                      dataInicio: start,
                      dataFim: end
                    }));
                  }}
                  className="text-xs"
                >
                  {shortcut.label}
                </Button>
              ))}
            </div>
          </div>
        </motion.div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="ghost"
            onClick={handleClear}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            Limpar
          </Button>
          <Button onClick={handleApply} className="gap-2">
            <Check className="h-4 w-4" />
            Aplicar Filtros
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default WhatsAppFilterDialog;
