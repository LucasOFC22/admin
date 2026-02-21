import React, { memo } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DATE_SEPARATOR_STYLE } from './messageStyles';

interface DateSeparatorProps {
  date: string;
}

export const DateSeparator: React.FC<DateSeparatorProps> = memo(({ date }) => {
  return (
    <div className="flex justify-center my-2">
      <div style={DATE_SEPARATOR_STYLE}>
        {format(new Date(date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
      </div>
    </div>
  );
});

DateSeparator.displayName = 'DateSeparator';
