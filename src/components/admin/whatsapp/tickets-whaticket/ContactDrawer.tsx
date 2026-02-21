import React, { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Ticket } from '@/services/ticketService';
import { Edit, Ban, Mail, Info, StickyNote, History } from 'lucide-react';
import { EditContactModal } from '@/components/admin/whatsapp/contacts/EditContactModal';
import { requireAuthenticatedClient } from '@/config/supabaseAuth';
import NotasWhatsappPanel from '@/components/whatsapp/NotasWhatsappPanel';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import { notasWhatsappService } from '@/services/whatsapp/notasWhatsappService';
import { InternalNote } from '@/types/internalNotes';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ScrollArea } from '@/components/ui/scroll-area';

const statusLabels: Record<string, string> = {
  pending: 'Pendente',
  open: 'Aberto',
  closed: 'Fechado',
  waiting: 'Aguardando',
};

interface AdditionalInfo {
  key: string;
  value: string;
}

interface ContactDrawerProps {
  open: boolean;
  onClose: () => void;
  ticket: Ticket;
}

export const ContactDrawer: React.FC<ContactDrawerProps> = ({ open, onClose, ticket }) => {
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('info');
  const [contactDetails, setContactDetails] = useState<{
    email?: string;
    informacoes_adicionais?: AdditionalInfo[];
  }>({});
  
  // Estados para histórico de notas do contato
  const [showContactHistory, setShowContactHistory] = useState(false);
  const [contactNotes, setContactNotes] = useState<InternalNote[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  
  const { user, hasAdminAccess } = useAuth();
  const { hasPermission } = usePermissionGuard();
  
  // Verificar permissão específica para ver histórico de notas do contato
  const canViewContactHistory = hasPermission('admin.whatsapp.notas.ver_historico_contato');

  useEffect(() => {
    if (open && ticket.contactId) {
      loadContactDetails();
    }
  }, [open, ticket.contactId]);

  // Carregar histórico de notas do contato
  useEffect(() => {
    if (showContactHistory && ticket.contactId && canViewContactHistory) {
      loadContactNotesHistory();
    }
  }, [showContactHistory, ticket.contactId, canViewContactHistory]);

  const loadContactDetails = async () => {
    if (!ticket.contactId) return;
    
    const supabase = requireAuthenticatedClient();
    const { data } = await supabase
      .from('contatos_whatsapp')
      .select('email, informacoes_adicionais')
      .eq('id', ticket.contactId)
      .maybeSingle();

    if (data) {
      setContactDetails(data);
    }
  };

  const loadContactNotesHistory = async () => {
    if (!ticket.contactId) return;
    
    setIsLoadingHistory(true);
    try {
      const result = await notasWhatsappService.getNotesForContact(ticket.contactId);
      // Filtrar notas que não são do chat atual
      const currentChatId = ticket.chatId || Number(ticket.id);
      const otherChatNotes = result.notes.filter(note => note.chatId !== currentChatId);
      setContactNotes(otherChatNotes);
    } catch (error) {
      console.error('Erro ao carregar histórico de notas:', error);
      setContactNotes([]);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onClose}>
        <SheetContent className="w-full sm:w-[400px] md:w-[540px] max-w-full p-0 flex flex-col">
          <SheetHeader className="p-6 pb-0">
            <SheetTitle>Detalhes do Contato</SheetTitle>
          </SheetHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList className="mx-6 mt-4 grid w-auto grid-cols-2">
              <TabsTrigger value="info" className="gap-2">
                <Info className="h-4 w-4" />
                Informações
              </TabsTrigger>
              <TabsTrigger value="notes" className="gap-2">
                <StickyNote className="h-4 w-4" />
                Notas
              </TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="flex-1 overflow-y-auto p-6 pt-4 mt-0 data-[state=inactive]:hidden">
              <div className="space-y-6">
                {/* Avatar and Name */}
                <div className="flex flex-col items-center gap-4">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={ticket.contact?.profilePicUrl} />
                    <AvatarFallback className="text-2xl">
                      {ticket.contact?.name?.charAt(0).toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-center">
                    <h3 className="font-semibold text-lg">{ticket.contact?.name || 'Sem nome'}</h3>
                    <p className="text-sm text-muted-foreground">{ticket.contact?.number}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setEditModalOpen(true)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <Ban className="h-4 w-4 mr-2" />
                    Bloquear
                  </Button>
                </div>

                {/* Tags */}
                {ticket.tags && ticket.tags.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {ticket.tags.map((tag) => (
                        <Badge
                          key={tag.id}
                          variant="outline"
                          style={{ borderColor: tag.color }}
                        >
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Queue */}
                {ticket.queue && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Fila</h4>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: ticket.queue.color }}
                      />
                      <span className="text-sm">{ticket.queue.name}</span>
                    </div>
                  </div>
                )}

                {/* Email */}
                {contactDetails.email && (
                  <div>
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email
                    </h4>
                    <p className="text-sm text-muted-foreground">{contactDetails.email}</p>
                  </div>
                )}

                {/* Informações Adicionais */}
                {contactDetails.informacoes_adicionais && contactDetails.informacoes_adicionais.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <Info className="h-4 w-4" />
                      Informações Adicionais
                    </h4>
                    <div className="space-y-2 text-sm">
                      {contactDetails.informacoes_adicionais.map((info, index) => (
                        <div key={index} className="flex justify-between">
                          <span className="text-muted-foreground">{info.key}:</span>
                          <span>{info.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Ticket Info */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Informações do Ticket</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Contato ID:</span>
                      <span className="font-mono text-xs">#{ticket.id}</span>
                    </div>
                    {ticket.chatId && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Chat Atual:</span>
                        <span className="font-mono text-xs">#{ticket.chatId}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <span>{statusLabels[ticket.status] || ticket.status}</span>
                    </div>
                    {ticket.user && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Atendente:</span>
                        <span>{ticket.user.name}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="notes" className="flex-1 flex flex-col overflow-hidden p-6 pt-4 data-[state=inactive]:hidden">
              <div className="flex-1 flex flex-col min-h-0">
                {/* Toggle para histórico do contato */}
                {canViewContactHistory && (
                  <div className="flex items-center justify-between mb-4 p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-2">
                      <History className="h-4 w-4 text-muted-foreground" />
                      <Label htmlFor="contact-history" className="text-sm">
                        Ver notas de outros chats
                      </Label>
                    </div>
                    <Switch
                      id="contact-history"
                      checked={showContactHistory}
                      onCheckedChange={setShowContactHistory}
                    />
                  </div>
                )}

                {/* Histórico de notas do contato */}
                {showContactHistory && canViewContactHistory ? (
                  <div className="flex-1 overflow-y-auto">
                    <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                      <History className="h-4 w-4" />
                      Histórico de Notas do Contato
                      <Badge variant="secondary">{contactNotes.length}</Badge>
                    </h4>
                    
                    {isLoadingHistory ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                      </div>
                    ) : contactNotes.length === 0 ? (
                      <div className="text-center text-muted-foreground py-8">
                        <StickyNote className="w-12 h-12 mx-auto mb-2 opacity-30" />
                        <p>Nenhuma nota em outros chats</p>
                      </div>
                    ) : (
                      <ScrollArea className="h-[400px]">
                        <div className="space-y-3 pr-4">
                          {contactNotes.map((note) => (
                            <div
                              key={note.id}
                              className="p-3 rounded-lg border bg-muted/30"
                            >
                              <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
                                <span className="font-medium">{note.autorNome}</span>
                                <span>•</span>
                                <span>
                                  {format(note.createdAt, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  Chat #{note.chatId}
                                </Badge>
                              </div>
                              <p className="text-sm whitespace-pre-wrap">{note.conteudo}</p>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    )}
                  </div>
                ) : (
                  /* Notas do chat atual */
                  <div className="flex-1 min-h-0">
                    <NotasWhatsappPanel
                      chatId={ticket.chatId || Number(ticket.id)}
                      currentUserId={user?.id || null}
                      currentUserName={user?.nome || user?.email || 'Usuário'}
                      isAdmin={hasAdminAccess}
                      isChatActive={ticket.status !== 'closed'}
                    />
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>

      <EditContactModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        contactId={ticket.contactId}
        onSuccess={loadContactDetails}
      />
    </>
  );
};