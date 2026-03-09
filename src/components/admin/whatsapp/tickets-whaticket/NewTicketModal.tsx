import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Queue } from '@/services/ticketService';
import { useToast } from '@/hooks/use-toast';
import { requireAuthenticatedClient } from '@/config/supabaseAuth';
import { User, UserPlus, Search } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { whatsappConfigService } from '@/services/supabase/whatsappConfigService';
import { sendAutoMessage, createMessageContext } from '@/utils/whatsappAutoMessages';
import { usePhoneVisibility } from '@/hooks/usePhoneVisibility';

interface ContatoWhatsApp {
  id: string;
  nome: string;
  telefone: string;
}

interface NewTicketModalProps {
  open: boolean;
  onClose: () => void;
  queues: Queue[];
  userId: string;
  onTicketCreated?: (contatoId: string) => void;
}

export const NewTicketModal: React.FC<NewTicketModalProps> = ({
  open,
  onClose,
  queues,
  userId,
  onTicketCreated
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [contatos, setContatos] = useState<ContatoWhatsApp[]>([]);
  const [filteredContatos, setFilteredContatos] = useState<ContatoWhatsApp[]>([]);
  const [selectedContato, setSelectedContato] = useState<ContatoWhatsApp | null>(null);
  const [showCreateNew, setShowCreateNew] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [queueId, setQueueId] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { displayPhone } = usePhoneVisibility();

  // Carregar contatos ao abrir
  useEffect(() => {
    if (open) {
      loadContatos();
      setSearchTerm('');
      setSelectedContato(null);
      setShowCreateNew(false);
      setQueueId('');
    }
  }, [open]);

  const loadContatos = async () => {
    try {
      const supabase = requireAuthenticatedClient();
      const { data, error } = await supabase
        .from('contatos_whatsapp')
        .select('id, nome, telefone')
        .order('nome', { ascending: true });

      if (error) throw error;
      setContatos(data || []);
    } catch (error) {
      console.error('Erro ao carregar contatos:', error);
    }
  };

  // Filtrar contatos
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
    const isPhone = /^\d+$/.test(searchTerm.replace(/\D/g, ''));
    
    try {
      const supabase = requireAuthenticatedClient();
      const { data, error } = await supabase
        .from('contatos_whatsapp')
        .insert([{
          nome: searchTerm,
          telefone: isPhone ? searchTerm.replace(/\D/g, '') : '',
          criadoem: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      toast({ title: "Contato criado com sucesso!" });
      setSelectedContato(data);
      setFilteredContatos([]);
      setShowCreateNew(false);
      loadContatos();
    } catch (error) {
      console.error('Erro ao criar contato:', error);
      toast({ title: "Erro ao criar contato", variant: "destructive" });
    }
  };

  const handleSubmit = async () => {
    if (!selectedContato) {
      toast({
        title: "Selecione um contato",
        description: "Busque e selecione um contato ou cadastre um novo",
        variant: "destructive"
      });
      return;
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!userId || !uuidRegex.test(userId)) {
      toast({
        title: "Erro de autenticação",
        description: "Usuário não identificado. Faça login novamente.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const supabase = requireAuthenticatedClient();
      // Verificar chat ativo existente para este contato
      const { data: existingChat } = await supabase
        .from('chats_whatsapp')
        .select('id')
        .eq('usuarioid', selectedContato.id) // ID do contatos_whatsapp
        .eq('resolvido', false)
        .maybeSingle();

      if (existingChat) {
        toast({
          title: "Atenção",
          description: "Já existe um atendimento ativo para este contato",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      // Criar ticket - usuarioid = contatos_whatsapp.id, adminid = usuarios.id
      const { error } = await supabase
        .from('chats_whatsapp')
        .insert({
          usuarioid: selectedContato.id, // ID do contato (contatos_whatsapp)
          filas: queueId ? [queueId] : [],
          mododeatendimento: 'Atendimento Humano',
          aceitoporadmin: true,
          adminid: userId, // ID do atendente logado (usuarios)
          ativo: true,
          resolvido: false,
          criadoem: new Date().toISOString(),
          atualizadoem: new Date().toISOString()
        });

      if (error) throw error;

      // Buscar chatId recém-criado
      const { data: newChat } = await supabase
        .from('chats_whatsapp')
        .select('id')
        .eq('usuarioid', selectedContato.id)
        .eq('resolvido', false)
        .maybeSingle();

      if (!newChat?.id) {
        throw new Error('Não foi possível obter o ID do chat criado');
      }

      // Buscar nome do atendente para enviar no template
      const { data: atendente } = await supabase
        .from('usuarios')
        .select('nome')
        .eq('id', userId)
        .single();

      const nomeAtendente = atendente?.nome || 'Atendente';
      const dataHora = new Date().toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      // Mensagem de sistema é apenas visual - NÃO salvar no banco
      console.log(`✅ [NewTicketModal] Ticket criado por ${nomeAtendente} em ${dataHora}`);

      // Buscar configuração de mensagem automática
      const config = await whatsappConfigService.getConfig();
      
      // Enviar mensagem de novo ticket ao cliente se habilitado
      let autoMessageFailed = false;
      if (config?.send_msg_new_ticket && selectedContato.telefone) {
        try {
          const context = createMessageContext({
            ticket: {
              nome: selectedContato.nome,
              telefone: selectedContato.telefone,
              chatId: newChat.id
            },
            userData: {
              nome: atendente?.nome,
              email: undefined
            }
          });

          await sendAutoMessage({
            chatId: newChat.id.toString(),
            contatoId: selectedContato.id,
            telefone: selectedContato.telefone,
            messageText: config.new_ticket_message || '',
            useTemplate: config.new_ticket_use_template || false,
            templateName: config.new_ticket_template_name,
            templateLanguage: config.new_ticket_template_language,
            templateVariables: config.new_ticket_template_variables || [],
            context
          });
          
          console.log('✅ [NewTicketModal] Mensagem de novo ticket enviada ao cliente');
        } catch (msgError) {
          console.error('❌ [NewTicketModal] Erro ao enviar mensagem de novo ticket:', msgError);
          autoMessageFailed = true;
          toast({
            title: "Ticket criado",
            description: "Mas a mensagem automática não pôde ser enviada.",
          });
        }
      }

      if (!autoMessageFailed) {
        toast({ title: "Ticket criado com sucesso!" });
      }
      
      // Notificar criação e passar ID do contato para seleção imediata
      if (onTicketCreated) {
        onTicketCreated(selectedContato.id);
      }
      
      onClose();
    } catch (error: any) {
      console.error('Erro ao criar ticket:', error);
      toast({
        title: "Erro ao criar ticket",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Novo Ticket</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Busca de Contato */}
          <div className="space-y-2">
            <Label>Buscar Contato *</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Digite nome ou telefone..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setSelectedContato(null);
                  setIsDropdownOpen(true);
                }}
                onFocus={() => setIsDropdownOpen(true)}
                onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
                className="pl-10"
              />
            </div>

            {/* Lista Filtrada */}
            {isDropdownOpen && (filteredContatos.length > 0 || showCreateNew) && (
              <div className="border rounded-md bg-background shadow-lg">
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
                        <p className="text-sm text-muted-foreground">{displayPhone(contato.telefone)}</p>
                      </div>
                    </button>
                  ))}
                  
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
                  <p className="text-sm text-muted-foreground">{displayPhone(selectedContato.telefone)}</p>
                </div>
              </div>
            )}
          </div>

          {/* Fila */}
          <div>
            <Label>Fila</Label>
            <Select value={queueId} onValueChange={setQueueId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma fila (opcional)" />
              </SelectTrigger>
              <SelectContent className="bg-background z-[11000]">
                {queues.map((queue) => (
                  <SelectItem key={queue.id} value={queue.id}>
                    {queue.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !selectedContato}>
            {loading ? "Criando..." : "Criar Ticket"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NewTicketModal;
