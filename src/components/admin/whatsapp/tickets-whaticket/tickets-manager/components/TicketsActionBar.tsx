import React, { useState } from 'react';
import { Eye, EyeOff, Plus, CheckSquare, Inbox } from 'lucide-react';
import { TicketsQueueSelect } from '../../../tickets-whaticket/TicketsQueueSelect';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface TicketsActionBarProps {
  showAll: boolean;
  showResolved: boolean;
  sortOrder: 'asc' | 'desc';
  openCount: number;
  filas: Array<{ id: number; name: string; color: string }>;
  onShowAllToggle: () => void;
  onNewTicket: () => void;
  onCloseAll: () => void;
  onShowResolvedToggle: (value: boolean) => void;
  onSortToggle: () => void;
  canViewAllTickets?: boolean;
}

export const TicketsActionBar: React.FC<TicketsActionBarProps> = ({
  showAll,
  showResolved,
  sortOrder,
  openCount,
  filas,
  onShowAllToggle,
  onNewTicket,
  onCloseAll,
  onShowResolvedToggle,
  onSortToggle,
  canViewAllTickets = false
}) => {
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);
  const [showCloseAllDialog, setShowCloseAllDialog] = useState(false);

  const ActionButton: React.FC<{
    id: string;
    icon: React.ReactNode;
    tooltip: string;
    onClick: () => void;
    active?: boolean;
    badge?: number;
  }> = ({ id, icon, tooltip, onClick, active, badge }) => (
    <div 
      className="relative"
      onMouseEnter={() => setHoveredButton(id)}
      onMouseLeave={() => setHoveredButton(null)}
    >
      <button
        onClick={onClick}
        className="h-8 w-8 sm:h-10 sm:w-10 border border-blue-900 rounded flex items-center justify-center transition-all duration-200 cursor-pointer"
        style={{ backgroundColor: active ? 'rgb(30, 58, 138)' : 'white' }}
      >
        {icon}
      </button>
      {badge !== undefined && (
        <span
          style={{
            position: 'absolute',
            top: '-8px',
            right: '-8px',
            backgroundColor: '#3f51b5',
            color: 'white',
            padding: '2px 6px',
            borderRadius: '10px',
            fontSize: '10px',
            minWidth: '20px',
            textAlign: 'center'
          }}
        >
          {badge}
        </span>
      )}
      <span
        style={{
          position: 'absolute',
          top: '-20px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#3f51b5',
          color: 'white',
          padding: '2px 6px',
          borderRadius: '10px',
          fontSize: '10px',
          whiteSpace: 'nowrap',
          visibility: hoveredButton === id ? 'visible' : 'hidden'
        }}
      >
        {tooltip}
      </span>
    </div>
  );

  return (
    <>
      <AlertDialog open={showCloseAllDialog} onOpenChange={setShowCloseAllDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Fechar todos os tickets?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação irá fechar todos os tickets abertos. Tem certeza que deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              onCloseAll();
              setShowCloseAllDialog(false);
            }}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="p-1.5 sm:p-2 bg-background">
      <div className="flex items-center justify-between flex-wrap gap-1">
        <div className="flex gap-1 sm:gap-2 items-center flex-wrap">
          {canViewAllTickets && (
            <ActionButton
              id="all"
              icon={showAll ? <Eye size={20} style={{ color: 'white' }} /> : <EyeOff size={20} style={{ color: 'rgb(30, 58, 138)' }} />}
              tooltip="Todos"
              onClick={onShowAllToggle}
              active={showAll}
            />
          )}
          
          <ActionButton
            id="new"
            icon={<Plus size={20} style={{ color: 'rgb(30, 58, 138)' }} />}
            tooltip="Novo Ticket"
            onClick={onNewTicket}
          />
          
          <ActionButton
            id="closeAll"
            icon={<CheckSquare size={20} style={{ color: 'rgb(30, 58, 138)' }} />}
            tooltip="Fechar Todos"
            onClick={() => setShowCloseAllDialog(true)}
          />

          <div className="relative mr-1 sm:mr-2">
            <button
              onClick={() => onShowResolvedToggle(false)}
              className="h-8 w-8 sm:h-10 sm:w-10 bg-white flex items-center justify-center transition-all duration-200 cursor-pointer"
              style={{ border: !showResolved ? '3px solid rgb(30, 58, 138)' : '2px solid rgb(30, 58, 138)' }}
            >
              <Inbox size={20} style={{ color: 'rgb(30, 58, 138)' }} />
            </button>
            <span
              style={{
                position: 'absolute',
                top: '-8px',
                right: '-8px',
                backgroundColor: '#3f51b5',
                color: 'white',
                padding: '2px 6px',
                borderRadius: '10px',
                fontSize: '10px',
                minWidth: '20px',
                textAlign: 'center'
              }}
            >
              {openCount}
            </span>
          </div>

          <div 
            className="relative mr-1 sm:mr-2"
            onMouseEnter={() => setHoveredButton('resolved')}
            onMouseLeave={() => setHoveredButton(null)}
          >
            <button
              onClick={() => onShowResolvedToggle(true)}
              className="h-8 w-8 sm:h-10 sm:w-10 bg-white flex items-center justify-center transition-all duration-200 cursor-pointer"
              style={{ border: showResolved ? '3px solid rgb(30, 58, 138)' : '2px solid rgb(30, 58, 138)' }}
            >
              <CheckSquare size={20} style={{ color: 'rgb(30, 58, 138)' }} />
            </button>
            <span
              style={{
                position: 'absolute',
                top: '-20px',
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: '#3f51b5',
                color: 'white',
                padding: '2px 6px',
                borderRadius: '10px',
                fontSize: '10px',
                whiteSpace: 'nowrap',
                visibility: hoveredButton === 'resolved' ? 'visible' : 'hidden'
              }}
            >
              Resolvidos
            </span>
          </div>

          <div 
            className="relative"
            onMouseEnter={() => setHoveredButton('sort')}
            onMouseLeave={() => setHoveredButton(null)}
          >
            <button
              onClick={onSortToggle}
              className="h-8 w-8 sm:h-10 sm:w-10 border border-blue-900 rounded bg-white flex items-center justify-center transition-all duration-200 cursor-pointer"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgb(30, 58, 138)" strokeWidth="2">
                <path d={sortOrder === 'asc' 
                  ? "M3 12v1.5l11 4.75v-2.1l-2.2-.9v-5l2.2-.9v-2.1L3 12zm7 2.62l-5.02-1.87L10 10.88v3.74zm8-10.37l-3 3h2v12.5h2V7.25h2l-3-3z"
                  : "M3 12v1.5l11 4.75v-2.1l-2.2-.9v-5l2.2-.9v-2.1L3 12zm7 2.62l-5.02-1.87L10 10.88v3.74zm8 7.13l3-3h-2V4.25h-2v12.5h-2l3 3z"
                } />
              </svg>
            </button>
            <span
              style={{
                position: 'absolute',
                top: '-20px',
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: '#3f51b5',
                color: 'white',
                padding: '2px 6px',
                borderRadius: '10px',
                fontSize: '10px',
                whiteSpace: 'nowrap',
                visibility: hoveredButton === 'sort' ? 'visible' : 'hidden'
              }}
            >
              {sortOrder === 'asc' ? 'Crescente' : 'Decrescente'}
            </span>
          </div>
        </div>

        <div className="mt-0 sm:-mt-1 min-w-0 flex-shrink">
          <TicketsQueueSelect queues={filas.map(f => ({ id: f.id.toString(), name: f.name, color: f.color || '#6b7280' }))} />
        </div>
      </div>
      </div>
    </>
  );
};
