import { useState, useEffect, useCallback, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { requireAuthenticatedClient } from '@/config/supabaseAuth';
import { toast } from '@/lib/toast';
import { useWhatsAppTickets } from '@/hooks/useWhatsAppTickets';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { User, UserPlus, Search } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { whatsappConfigService } from '@/services/supabase/whatsappConfigService';
import { sendAutoMessage, createMessageContext } from '@/utils/whatsappAutoMessages';

interface ContatoWhatsApp {
  id: string;
  nome: string;
  telefone: string;
}

interface NewTicketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const NewTicketDialog = ({ open, onOpenChange }: NewTicketDialogProps) => {
  const { filas, refetch, filasPermitidas, hasFilasRestriction } = useWhatsAppTickets();
  const { user } = useUnifiedAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [contatos, setContatos] = useState<ContatoWhatsApp[]>([]);
  const [filteredContatos, setFilteredContatos] = useState<ContatoWhatsApp[]>([]);
  const [selectedContato, setSelectedContato] = useState<ContatoWhatsApp | null>(null);
  const [showCreateNew, setShowCreateNew] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [filaId, setFilaId] = useState('');

  // Filtrar filas baseado nas permissões (já vem filtrada do hook, mas garantir)
  const filasDisponiveis = useMemo(() => {
    if (!hasFilasRestriction || filasPermitidas.length === 0) {
      return filas;
    }
    return filas.filter(fila => filasPermitidas.includes(fila.id));
  }, [filas, filasPermitidas, hasFilasRestriction]);

  // Carregar contatos ao abrir o dialog
  useEffect(() => {
    if (open) {
      loadContatos();
      // Reset states
      setSearchTerm('');
      setSelectedContato(null);
      setShowCreateNew(false);
      setFilaId('');
    }
  }, [open]);

  const loadContatos = async () => {
    try {
      const supabaseAuth = requireAuthenticatedClient();
      const { data, error } = await supabaseAuth
        .from('contatos_whatsapp')
        .select('id, nome, telefone')
        .order('nome', { ascending: true });

      if (error) throw error;
      setContatos(data || []);
    } catch (error) {
      console.error('Erro ao carregar contatos:', error);
    }
  };

  // Filtrar contatos baseado na busca
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredContatos([]);
      setShowCreateNew(false);
      return;
    }

    const term = searchTerm.toLowerCase().trim();
    const filtered = contatos.filter(
      c => c.nome?.toLowerCase().includes(term) || c.telefone?.includes(term)
    );
    setFilteredContatos(filtered);
    
    // Mostrar opção de criar novo se não encontrou correspondência exata
    const hasExactMatch = filtered.some(
      c => c.nome?.toLowerCase() === term || c.telefone === term
    );
    setShowCreateNew(!hasExactMatch && searchTerm.trim().length > 0);
  }, [searchTerm, contatos]);

  const handleSelectContato = (contato: ContatoWhatsApp) => {
    setSelectedContato(contato);
    setSearchTerm('');
    setFilteredContatos([]);
    setShowCreateNew(false);
    setIsDropdownOpen(false);
  };

  const handleCreateNewContato = async () => {
    // Verifica se é um telefone (só números) ou nome
    const isPhone = /^\d+$/.test(searchTerm.replace(/\D/g, ''));
    
    try {
      const newContato: Partial<ContatoWhatsApp> = {
        nome: isPhone ? searchTerm : searchTerm,
        telefone: isPhone ? searchTerm.replace(/\D/g, '') : '',
        criadoem: new Date().toISOString()
      } as any;

      const client = requireAuthenticatedClient();
      const { data, error } = await client
        .from('contatos_whatsapp')
        .insert([newContato])
        .select()
        .single();

      if (error) throw error;

      toast.success('Contato criado com sucesso!');
      setSelectedContato(data);
      setFilteredContatos([]);
      setShowCreateNew(false);
      
      // Atualizar lista de contatos
      loadContatos();
    } catch (error) {
      console.error('Erro ao criar contato:', error);
      toast.error('Erro ao criar contato');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedContato) {
      toast.error('Selecione ou cadastre um contato');
      return;
    }

    // Validar userId
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!user?.id || !uuidRegex.test(user.id)) {
      toast.error('Erro de autenticação. Faça logout e login novamente.');
      return;
    }

    setIsLoading(true);

    try {
      const supabaseAuth = requireAuthenticatedClient();
      // Verificar se já existe um chat ativo para este contato
      const { data: existingChat } = await supabaseAuth
        .from('chats_whatsapp')
        .select('id')
        .eq('usuarioid', selectedContato.id)
        .eq('resolvido', false)
        .maybeSingle();

      if (existingChat) {
        toast.warning('Já existe um atendimento ativo para este contato');
        setIsLoading(false);
        return;
      }

      const { error } = await supabaseAuth
        .from('chats_whatsapp')
        .insert([
          {
            usuarioid: selectedContato.id,
            filas: filaId ? [parseInt(filaId)] : [],
            mododeatendimento: 'Atendimento Humano',
            aceitoporadmin: true,
            adminid: user.id,
            resolvido: false,
            ativo: true,
            criadoem: new Date().toISOString(),
            atualizadoem: new Date().toISOString()
          }
        ]);

      if (error) throw error;

      // Buscar nome do atendente
      const { data: atendente } = await supabaseAuth
        .from('usuarios')
        .select('nome')
        .eq('id', user.id)
        .maybeSingle();

      // Buscar configuração de mensagem automática
      const config = await whatsappConfigService.getConfig();
      
      // Enviar mensagem de novo ticket se habilitado
      let autoMessageFailed = false;
      if (config?.send_msg_new_ticket && selectedContato.telefone) {
        try {
          // Buscar chatId recém-criado
          const { data: newChat } = await supabaseAuth
            .from('chats_whatsapp')
            .select('id')
            .eq('usuarioid', selectedContato.id)
            .eq('resolvido', false)
            .maybeSingle();

          const context = createMessageContext({
            ticket: {
              nome: selectedContato.nome,
              telefone: selectedContato.telefone,
              chatId: newChat?.id
            },
            userData: {
              nome: atendente?.nome,
              email: undefined
            }
          });

          await sendAutoMessage({
            chatId: newChat?.id?.toString() || '',
            contatoId: selectedContato.id,
            telefone: selectedContato.telefone,
            messageText: config.new_ticket_message || '',
            useTemplate: config.new_ticket_use_template || false,
            templateName: config.new_ticket_template_name,
            templateLanguage: config.new_ticket_template_language,
            templateVariables: config.new_ticket_template_variables || [],
            context
          });
        } catch (msgError) {
          console.error('[NewTicketDialog] Erro ao enviar mensagem de novo ticket:', msgError);
          autoMessageFailed = true;
          toast.warning('Ticket criado, mas a mensagem automática não pôde ser enviada.');
        }
      }

      if (!autoMessageFailed) {
        toast.success('Ticket criado com sucesso!');
      }
      onOpenChange(false);
      refetch();
    } catch (error) {
      console.error('Erro ao criar ticket:', error);
      toast.error('Erro ao criar ticket');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Novo Ticket</DialogTitle>
          <DialogDescription>
            Busque um contato existente ou cadastre um novo
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Busca de Contato */}
          <div className="space-y-2">
            <Label htmlFor="busca">Buscar Contato *</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="busca"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setSelectedContato(null);
                  setIsDropdownOpen(true);
                }}
                onFocus={() => setIsDropdownOpen(true)}
                onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
                placeholder="Digite nome ou telefone..."
                className="pl-10"
              />
            </div>

            {/* Lista de Contatos Filtrados */}
            {isDropdownOpen && (filteredContatos.length > 0 || showCreateNew) && (
              <div className="border rounded-md mt-1 bg-background shadow-lg">
                <ScrollArea className="max-h-48">
                  {filteredContatos.map((contato) => (
                    <button
                      key={contato.id}
                      type="button"
                      onClick={() => handleSelectContato(contato)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-muted transition-colors text-left border-b last:border-b-0"
                    >
                      <User className="h-5 w-5 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{contato.nome || 'Sem nome'}</p>
                        <p className="text-sm text-muted-foreground">{contato.telefone}</p>
                      </div>
                    </button>
                  ))}
                  
                  {/* Opção de Criar Novo */}
                  {showCreateNew && (
                    <button
                      type="button"
                      onClick={handleCreateNewContato}
                      className="w-full flex items-center gap-3 p-3 hover:bg-primary/10 transition-colors text-left text-primary"
                    >
                      <UserPlus className="h-5 w-5 shrink-0" />
                      <div className="flex-1">
                        <p className="font-medium">Cadastrar "{searchTerm}"</p>
                        <p className="text-sm opacity-70">Criar novo contato</p>
                      </div>
                    </button>
                  )}
                </ScrollArea>
              </div>
            )}

            {/* Contato Selecionado */}
            {selectedContato && (
              <div className="flex items-center gap-3 p-3 bg-primary/10 rounded-md border border-primary/20">
                <User className="h-5 w-5 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{selectedContato.nome || 'Sem nome'}</p>
                  <p className="text-sm text-muted-foreground">{selectedContato.telefone}</p>
                </div>
              </div>
            )}
          </div>

          {/* Seleção de Fila */}
          <div className="space-y-2">
            <Label htmlFor="fila">Fila (opcional)</Label>
            <Select value={filaId} onValueChange={setFilaId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma fila (opcional)" />
              </SelectTrigger>
              <SelectContent className="bg-background z-[11000]">
                {filasDisponiveis.map((fila) => (
                  <SelectItem key={fila.id} value={fila.id.toString()}>
                    <span className="flex items-center gap-2">
                      <span 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: fila.color }} 
                      />
                      {fila.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hasFilasRestriction && (
              <p className="text-xs text-muted-foreground">
                Apenas filas permitidas para seu cargo são exibidas.
              </p>
            )}
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || !selectedContato}>
              {isLoading ? 'Criando...' : 'Criar Ticket'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NewTicketDialog;
