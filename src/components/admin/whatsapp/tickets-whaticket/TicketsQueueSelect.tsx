import React, { useContext } from 'react';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { QueuesSelectedContext } from '@/contexts/QueuesSelectedContext';
import { Queue } from '@/services/ticketService';

interface TicketsQueueSelectProps {
  queues: Queue[];
}

export const TicketsQueueSelect: React.FC<TicketsQueueSelectProps> = ({ queues }) => {
  const { selectedQueueIds, setSelectedQueueIds } = useContext(QueuesSelectedContext);

  const handleToggle = (queueId: string) => {
    if (selectedQueueIds.includes(queueId)) {
      setSelectedQueueIds(selectedQueueIds.filter(id => id !== queueId));
    } else {
      setSelectedQueueIds([...selectedQueueIds, queueId]);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          Filas {selectedQueueIds.length > 0 && `(${selectedQueueIds.length})`}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        {queues.map((queue) => (
          <DropdownMenuCheckboxItem
            key={queue.id}
            checked={selectedQueueIds.includes(queue.id)}
            onCheckedChange={() => handleToggle(queue.id)}
          >
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: queue.color }}
              />
              {queue.name}
            </div>
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
