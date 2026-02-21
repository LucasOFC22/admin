import React, { useEffect, useRef } from 'react';
import { useMensagensRapidas } from '@/hooks/useMensagensRapidas';
import { MensagemRapida } from '@/services/mensagensRapidas/mensagensRapidasService';
import { MessageSquareText } from 'lucide-react';

interface QuickMessagesMenuProps {
  searchTerm: string;
  onSelect: (mensagem: MensagemRapida) => void;
  onClose: () => void;
  selectedIndex: number;
}

export const QuickMessagesMenu: React.FC<QuickMessagesMenuProps> = ({
  searchTerm,
  onSelect,
  onClose,
  selectedIndex,
}) => {
  const { mensagens, isLoading } = useMensagensRapidas();
  const menuRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Filtra mensagens pelo comando (sem o /)
  const filteredMensagens = mensagens
    .filter((m) =>
      m.comando.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .slice(0, 10); // Máximo 10 resultados

  // Scroll para o item selecionado
  useEffect(() => {
    if (selectedIndex >= 0 && itemRefs.current[selectedIndex]) {
      itemRefs.current[selectedIndex]?.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth',
      });
    }
  }, [selectedIndex]);

  if (isLoading) {
    return (
      <div className="absolute bottom-full left-0 right-0 mb-2 mx-2 bg-popover border border-border rounded-lg shadow-lg p-3 z-50">
        <div className="text-sm text-muted-foreground text-center">
          Carregando mensagens rápidas...
        </div>
      </div>
    );
  }

  if (filteredMensagens.length === 0) {
    return (
      <div className="absolute bottom-full left-0 right-0 mb-2 mx-2 bg-popover border border-border rounded-lg shadow-lg p-3 z-50">
        <div className="text-sm text-muted-foreground text-center">
          Nenhuma mensagem encontrada para "/{searchTerm}"
        </div>
      </div>
    );
  }

  return (
    <div
      ref={menuRef}
      className="absolute bottom-full left-0 right-0 mb-2 mx-2 bg-popover border border-border rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto"
    >
      <div className="p-2">
        <div className="text-xs text-muted-foreground px-2 py-1 mb-1 flex items-center gap-1">
          <MessageSquareText className="h-3 w-3" />
          Mensagens Rápidas
        </div>
        {filteredMensagens.map((mensagem, index) => (
          <div
            key={mensagem.id}
            ref={(el) => (itemRefs.current[index] = el)}
            className={`flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-colors ${
              index === selectedIndex
                ? 'bg-accent text-accent-foreground'
                : 'hover:bg-muted'
            }`}
            onClick={() => onSelect(mensagem)}
          >
            <span className="font-mono text-sm text-primary font-medium">
              /{mensagem.comando}
            </span>
            <span className="text-muted-foreground">-</span>
            <span className="text-sm text-foreground truncate flex-1">
              {mensagem.titulo}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
