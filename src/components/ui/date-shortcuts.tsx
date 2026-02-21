import { Button } from '@/components/ui/button';
import { 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  subMonths, 
  addWeeks,
  format 
} from 'date-fns';

export type DateShortcut = 'mes-passado' | 'mes-atual' | 'semana-atual' | 'prox-semana';

interface DateShortcutsProps {
  onSelect: (startDate: string, endDate: string) => void;
  shortcuts?: DateShortcut[];
}

const shortcutLabels: Record<DateShortcut, string> = {
  'mes-passado': 'Mês Passado',
  'mes-atual': 'Mês Atual',
  'semana-atual': 'Semana Atual',
  'prox-semana': 'Próx. Semana',
};

const getShortcutDates = (shortcut: DateShortcut): { start: Date; end: Date } => {
  const today = new Date();
  
  switch (shortcut) {
    case 'mes-passado': {
      const lastMonth = subMonths(today, 1);
      return {
        start: startOfMonth(lastMonth),
        end: endOfMonth(lastMonth),
      };
    }
    case 'mes-atual': {
      return {
        start: startOfMonth(today),
        end: endOfMonth(today),
      };
    }
    case 'semana-atual': {
      return {
        start: startOfWeek(today, { weekStartsOn: 0 }),
        end: endOfWeek(today, { weekStartsOn: 0 }),
      };
    }
    case 'prox-semana': {
      const nextWeek = addWeeks(today, 1);
      return {
        start: startOfWeek(nextWeek, { weekStartsOn: 0 }),
        end: endOfWeek(nextWeek, { weekStartsOn: 0 }),
      };
    }
    default:
      return { start: today, end: today };
  }
};

export const DateShortcuts = ({ 
  onSelect, 
  shortcuts = ['mes-passado', 'mes-atual', 'semana-atual'],
}: DateShortcutsProps) => {
  const handleClick = (shortcut: DateShortcut) => {
    const { start, end } = getShortcutDates(shortcut);
    onSelect(
      format(start, 'yyyy-MM-dd'),
      format(end, 'yyyy-MM-dd')
    );
  };

  return (
    <div className="flex flex-wrap gap-2">
      {shortcuts.map((shortcut) => (
        <Button
          key={shortcut}
          type="button"
          variant="outline"
          size="sm"
          onClick={() => handleClick(shortcut)}
        >
          {shortcutLabels[shortcut]}
        </Button>
      ))}
    </div>
  );
};
