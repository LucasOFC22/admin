import React, { useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, User, Loader2 } from 'lucide-react';
import { ContatoWhatsApp, CampanhaFormData } from './types';

interface Step3ContactsProps {
  formData: CampanhaFormData;
  onUpdateField: <K extends keyof CampanhaFormData>(field: K, value: CampanhaFormData[K]) => void;
  onToggleContato: (contatoId: string) => void;
  onSelectAllContatos: (contatoIds: string[]) => void;
  contatos: ContatoWhatsApp[];
  totalContatos: number;
  loadingContatos: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  onFetchNextPage: () => void;
  onScroll: (e: React.UIEvent<HTMLDivElement>) => void;
}

const ContatoRow = React.memo(({ 
  contato, 
  isSelected, 
  onToggle 
}: { 
  contato: ContatoWhatsApp; 
  isSelected: boolean; 
  onToggle: (id: string) => void;
}) => {
  const handleToggle = useCallback(() => {
    onToggle(contato.id);
  }, [contato.id, onToggle]);

  const handleCheckboxClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  return (
    <div
      className="p-2 flex items-center gap-2 sm:gap-3 hover:bg-muted/50 cursor-pointer border-b border-border/30"
      onClick={handleToggle}
    >
      <Checkbox
        checked={isSelected}
        onCheckedChange={handleToggle}
        onClick={handleCheckboxClick}
      />
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarImage src={contato.perfil} alt={contato.nome} />
        <AvatarFallback>
          {contato.nome ? contato.nome.charAt(0).toUpperCase() : <User className="h-4 w-4" />}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{contato.nome || 'Sem nome'}</p>
        <p className="text-xs text-muted-foreground">{contato.telefone}</p>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  return prevProps.contato.id === nextProps.contato.id &&
         prevProps.isSelected === nextProps.isSelected;
});

ContatoRow.displayName = 'ContatoRow';

export const Step3Contacts: React.FC<Step3ContactsProps> = ({
  formData,
  onUpdateField,
  onToggleContato,
  onSelectAllContatos,
  contatos,
  totalContatos,
  loadingContatos,
  isFetchingNextPage,
  hasNextPage,
  onFetchNextPage,
  onScroll
}) => {
  const handleSelectAll = () => {
    onSelectAllContatos(contatos.map(c => c.id));
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border rounded-t-lg bg-muted/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="font-medium text-sm">Selecionar Contatos</span>
            <Badge variant="secondary" className="text-xs">{totalContatos} total</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="enviar-todos"
              checked={formData.enviarParaTodos}
              onCheckedChange={(checked) => onUpdateField('enviarParaTodos', !!checked)}
            />
            <Label htmlFor="enviar-todos" className="text-xs cursor-pointer">
              Enviar para todos ({totalContatos})
            </Label>
          </div>
        </div>
        
        <Input
          placeholder="Buscar nome ou telefone..."
          value={formData.searchContato}
          onChange={e => onUpdateField('searchContato', e.target.value)}
          className="h-8 text-sm"
          disabled={formData.enviarParaTodos}
        />
      </div>

      {/* Lista de Contatos */}
      {!formData.enviarParaTodos ? (
        <div className="flex-1 border-x border-b rounded-b-lg overflow-hidden flex flex-col min-h-0">
          <div className="p-2 border-b flex items-center justify-between text-xs flex-shrink-0">
            <Button variant="ghost" size="sm" type="button" onClick={handleSelectAll} className="h-6 text-xs px-2">
              {formData.selectedContatos.size === contatos.length && contatos.length > 0 ? 'Desmarcar' : 'Selecionar'} todos carregados
            </Button>
            <span className="text-muted-foreground">
              {formData.selectedContatos.size} selecionados • {contatos.length} de {totalContatos} carregados
            </span>
          </div>

          <div 
            className="flex-1 min-h-0 overflow-y-auto max-h-[300px]" 
            onScroll={onScroll}
          >
            {loadingContatos && contatos.length === 0 ? (
              <div className="p-8 flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : contatos.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                Nenhum contato encontrado
              </div>
            ) : (
              <div>
                {contatos.map(contato => (
                  <ContatoRow
                    key={contato.id}
                    contato={contato}
                    isSelected={formData.selectedContatos.has(contato.id)}
                    onToggle={onToggleContato}
                  />
                ))}
                {(isFetchingNextPage || hasNextPage) && (
                  <div className="p-4 flex items-center justify-center">
                    {isFetchingNextPage ? (
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    ) : hasNextPage ? (
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        onClick={onFetchNextPage}
                        className="text-xs"
                      >
                        Carregar mais...
                      </Button>
                    ) : null}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 border-x border-b rounded-b-lg flex items-center justify-center text-muted-foreground min-h-[200px]">
          <div className="text-center">
            <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Todos os {totalContatos} contatos serão incluídos</p>
          </div>
        </div>
      )}
    </div>
  );
};
