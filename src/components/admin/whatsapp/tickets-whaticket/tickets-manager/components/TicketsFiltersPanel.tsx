import React from 'react';
import { ChevronDown, X } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Conexao, Usuario } from '../types';

interface TicketsFiltersPanelProps {
  filas: Array<{ id: number; name: string; color: string }>;
  conexoes: Conexao[];
  usuarios: Usuario[];
  selectedFilas: string[];
  selectedConnections: string[];
  selectedModoAtendimento: string[];
  selectedUsers: string[];
  onFilasChange: (filas: string[]) => void;
  onConnectionsChange: (connections: string[]) => void;
  onModoAtendimentoChange: (modos: string[]) => void;
  onUsersChange: (users: string[]) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
  canViewAllTickets?: boolean;
}

const modosAtendimento = ['Bot', 'Atendimento Humano'];

export const TicketsFiltersPanel: React.FC<TicketsFiltersPanelProps> = ({
  filas,
  conexoes,
  usuarios,
  selectedFilas,
  selectedConnections,
  selectedModoAtendimento,
  selectedUsers,
  onFilasChange,
  onConnectionsChange,
  onModoAtendimentoChange,
  onUsersChange,
  onClearFilters,
  hasActiveFilters,
  canViewAllTickets = false
}) => {
  const toggleArrayItem = (array: string[], item: string, setter: (arr: string[]) => void) => {
    if (array.includes(item)) {
      setter(array.filter(i => i !== item));
    } else {
      setter([...array, item]);
    }
  };

  return (
    <div className="px-2 py-2 sm:px-3 sm:py-2.5 border-b border-border">
      <div className="flex gap-1.5 sm:gap-2 items-center overflow-x-auto pb-1 scrollbar-hide">
        {/* Filtro por Filas */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex items-center gap-0.5 sm:gap-1 px-2 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm border rounded-md hover:bg-gray-50 whitespace-nowrap flex-shrink-0"
              style={{ borderColor: selectedFilas.length > 0 ? '#3f51b5' : 'rgba(0, 0, 0, 0.23)' }}
            >
              <span className="hidden sm:inline">Filas</span>
              <span className="sm:hidden">F</span>
              {selectedFilas.length > 0 && <span>({selectedFilas.length})</span>}
              <ChevronDown size={12} className="sm:w-3.5 sm:h-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            {filas.map(fila => (
              <DropdownMenuCheckboxItem
                key={fila.id}
                checked={selectedFilas.includes(fila.id.toString())}
                onCheckedChange={() => toggleArrayItem(selectedFilas, fila.id.toString(), onFilasChange)}
              >
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: fila.color }} />
                  {fila.name}
                </span>
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Filtro por Conexão */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex items-center gap-0.5 sm:gap-1 px-2 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm border rounded-md hover:bg-gray-50 whitespace-nowrap flex-shrink-0"
              style={{ borderColor: selectedConnections.length > 0 ? '#3f51b5' : 'rgba(0, 0, 0, 0.23)' }}
            >
              <span className="hidden sm:inline">Conexões</span>
              <span className="sm:hidden">C</span>
              {selectedConnections.length > 0 && <span>({selectedConnections.length})</span>}
              <ChevronDown size={12} className="sm:w-3.5 sm:h-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            {conexoes.map(conexao => (
              <DropdownMenuCheckboxItem
                key={conexao.id}
                checked={selectedConnections.includes(conexao.id)}
                onCheckedChange={() => toggleArrayItem(selectedConnections, conexao.id, onConnectionsChange)}
              >
                {conexao.nome}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Filtro por Modo de Atendimento */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex items-center gap-0.5 sm:gap-1 px-2 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm border rounded-md hover:bg-gray-50 whitespace-nowrap flex-shrink-0"
              style={{ borderColor: selectedModoAtendimento.length > 0 ? '#3f51b5' : 'rgba(0, 0, 0, 0.23)' }}
            >
              <span className="hidden sm:inline">Modo</span>
              <span className="sm:hidden">M</span>
              {selectedModoAtendimento.length > 0 && <span>({selectedModoAtendimento.length})</span>}
              <ChevronDown size={12} className="sm:w-3.5 sm:h-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            {modosAtendimento.map(modo => (
              <DropdownMenuCheckboxItem
                key={modo}
                checked={selectedModoAtendimento.includes(modo)}
                onCheckedChange={() => toggleArrayItem(selectedModoAtendimento, modo, onModoAtendimentoChange)}
              >
                {modo}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Filtro por Usuário - só visível com permissão */}
        {canViewAllTickets && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex items-center gap-0.5 sm:gap-1 px-2 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm border rounded-md hover:bg-gray-50 whitespace-nowrap flex-shrink-0"
                style={{ borderColor: selectedUsers.length > 0 ? '#3f51b5' : 'rgba(0, 0, 0, 0.23)' }}
              >
                <span className="hidden sm:inline">Atendentes</span>
                <span className="sm:hidden">A</span>
                {selectedUsers.length > 0 && <span>({selectedUsers.length})</span>}
                <ChevronDown size={12} className="sm:w-3.5 sm:h-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              {usuarios.map(usuario => (
                <DropdownMenuCheckboxItem
                  key={usuario.id}
                  checked={selectedUsers.includes(String(usuario.id))}
                  onCheckedChange={() => toggleArrayItem(selectedUsers, String(usuario.id), onUsersChange)}
                >
                  {usuario.nome}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Limpar filtros */}
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="flex items-center gap-0.5 sm:gap-1 px-1.5 py-1 sm:px-2 sm:py-1.5 text-xs sm:text-sm text-red-600 hover:bg-red-50 rounded-md flex-shrink-0"
          >
            <X size={12} className="sm:w-3.5 sm:h-3.5" />
            <span className="hidden sm:inline">Limpar</span>
          </button>
        )}
      </div>
    </div>
  );
};
