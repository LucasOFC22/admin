import React, { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  FileText, Search, Download, RefreshCw, ChevronDown, ChevronUp, X, 
  Calendar, User, MessageSquare, Filter, ChevronLeft, ChevronRight,
  Activity, Clock, Hash
} from 'lucide-react';

import PageHeader from '@/components/admin/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import PermissionGuard from '@/components/admin/permissions/PermissionGuard';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SelectContatoWhatsAppModal } from '@/components/modals/SelectContatoWhatsAppModal';
import { SelectChatWhatsAppModal } from '@/components/modals/SelectChatWhatsAppModal';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { logsWhatsAppService, LogWhatsAppWithRelations } from '@/services/whatsapp/logsWhatsAppService';
import { toast } from '@/lib/toast';
import { cn } from '@/lib/utils';

const ACOES_DISPONIVEIS = [
  { value: 'mensagem_enviada', label: 'Mensagem Enviada', icon: MessageSquare, color: 'bg-blue-500/10 text-blue-600 border-blue-200' },
  { value: 'ticket_aceito', label: 'Ticket Aceito', icon: Activity, color: 'bg-green-500/10 text-green-600 border-green-200' },
  { value: 'ticket_ignorado', label: 'Ticket Ignorado', icon: X, color: 'bg-gray-500/10 text-gray-600 border-gray-200' },
  { value: 'ticket_transferido', label: 'Ticket Transferido', icon: ChevronRight, color: 'bg-yellow-500/10 text-yellow-600 border-yellow-200' },
  { value: 'ticket_reaberto', label: 'Ticket Reaberto', icon: RefreshCw, color: 'bg-purple-500/10 text-purple-600 border-purple-200' },
  { value: 'ticket_finalizado', label: 'Ticket Finalizado', icon: Activity, color: 'bg-emerald-500/10 text-emerald-600 border-emerald-200' },
  { value: 'transferencia_aceita', label: 'Transferência Aceita', icon: Activity, color: 'bg-green-600/10 text-green-700 border-green-300' },
  { value: 'transferencia_recusada', label: 'Transferência Recusada', icon: X, color: 'bg-red-500/10 text-red-600 border-red-200' },
  { value: 'tags_atualizadas', label: 'Tags Atualizadas', icon: Hash, color: 'bg-indigo-500/10 text-indigo-600 border-indigo-200' },
  { value: 'card_movido', label: 'Card Movido', icon: Activity, color: 'bg-orange-500/10 text-orange-600 border-orange-200' },
  { value: 'conversa_exportada', label: 'Conversa Exportada', icon: Download, color: 'bg-cyan-500/10 text-cyan-600 border-cyan-200' },
  { value: 'tickets_fechados_em_massa', label: 'Fechados em Massa', icon: Activity, color: 'bg-rose-500/10 text-rose-600 border-rose-200' },
];

const WhatsAppLogs: React.FC = () => {
  const [logs, setLogs] = useState<LogWhatsAppWithRelations[]>([]);
  const [totalLogs, setTotalLogs] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Filtros
  const [contatos, setContatos] = useState<{ id: string; nome: string; telefone: string }[]>([]);
  const [chats, setChats] = useState<{ id: number; criadoem: string }[]>([]);
  const [usuarios, setUsuarios] = useState<{ id: string; nome: string }[]>([]);

  const [selectedContato, setSelectedContato] = useState<string>('');
  const [selectedContatoNome, setSelectedContatoNome] = useState<string>('');
  const [selectedChat, setSelectedChat] = useState<string>('');
  const [selectedAcao, setSelectedAcao] = useState<string>('');
  const [selectedUsuario, setSelectedUsuario] = useState<string>('');
  const [startDate, setStartDate] = useState(format(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  // Modal states
  const [contatoModalOpen, setContatoModalOpen] = useState(false);
  const [chatModalOpen, setChatModalOpen] = useState(false);

  const LIMIT = 50;

  const loadFilterData = useCallback(async () => {
    const [contatosData, usuariosData] = await Promise.all([
      logsWhatsAppService.buscarContatos(),
      logsWhatsAppService.buscarUsuariosAdmin()
    ]);
    setContatos(contatosData);
    setUsuarios(usuariosData);
  }, []);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const { data, count } = await logsWhatsAppService.buscarLogs({
        contato_id: selectedContato || undefined,
        chat_id: selectedChat ? parseInt(selectedChat) : undefined,
        acao: selectedAcao || undefined,
        usuario_id: selectedUsuario || undefined,
        start_date: startDate,
        end_date: endDate,
        limit: LIMIT,
        offset: page * LIMIT
      });
      setLogs(data);
      setTotalLogs(count);
    } catch (error) {
      toast.error('Erro ao carregar logs');
    } finally {
      setLoading(false);
    }
  }, [selectedContato, selectedChat, selectedAcao, selectedUsuario, startDate, endDate, page]);

  useEffect(() => {
    loadFilterData();
  }, [loadFilterData]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  useEffect(() => {
    if (selectedContato) {
      logsWhatsAppService.buscarChatsPorContato(selectedContato).then(setChats);
    } else {
      setChats([]);
      setSelectedChat('');
    }
  }, [selectedContato]);

  const handleSearch = () => {
    setPage(0);
    loadLogs();
  };

  const handleClearFilters = () => {
    setSelectedContato('');
    setSelectedContatoNome('');
    setSelectedChat('');
    setSelectedAcao('');
    setSelectedUsuario('');
    setStartDate(format(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'));
    setEndDate(format(new Date(), 'yyyy-MM-dd'));
    setPage(0);
  };

  const handleSelectContato = (contato: { id: string; nome: string; telefone: string }) => {
    setSelectedContato(contato.id);
    setSelectedContatoNome(contato.nome || contato.telefone);
    setSelectedChat('');
  };

  const handleSelectChat = (chat: { id: number; criadoem: string }) => {
    setSelectedChat(chat.id.toString());
  };

  const handleClearContato = () => {
    setSelectedContato('');
    setSelectedContatoNome('');
    setSelectedChat('');
  };

  const handleClearChat = () => {
    setSelectedChat('');
  };

  const handleExport = () => {
    const csvContent = [
      ['Data/Hora', 'Usuário', 'Contato', 'Chat ID', 'Ação', 'Detalhes'].join(';'),
      ...logs.map(log => [
        format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss'),
        log.usuarios?.nome || '-',
        log.contatos_whatsapp?.nome || '-',
        log.chat_id || '-',
        log.acao,
        JSON.stringify(log.detalhes || {})
      ].join(';'))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `logs_whatsapp_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`;
    link.click();
    toast.success('Logs exportados com sucesso!');
  };

  const getAcaoInfo = (acao: string) => {
    return ACOES_DISPONIVEIS.find(a => a.value === acao) || { 
      label: acao, 
      icon: Activity, 
      color: 'bg-gray-500/10 text-gray-600 border-gray-200' 
    };
  };

  const totalPages = Math.ceil(totalLogs / LIMIT);
  const hasActiveFilters = selectedContato || selectedChat || selectedAcao || selectedUsuario;

  return (
    <>
      <PermissionGuard 
        permissions="admin.whatsapp-logs.visualizar"
        showMessage={true}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="px-6 py-4 border-b bg-card">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/10">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-foreground">Logs WhatsApp</h1>
                  <p className="text-sm text-muted-foreground">
                    {totalLogs.toLocaleString()} registros encontrados
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className={cn(hasActiveFilters && "border-primary text-primary")}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filtros
                  {hasActiveFilters && (
                    <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                      {[selectedContato, selectedChat, selectedAcao, selectedUsuario].filter(Boolean).length}
                    </Badge>
                  )}
                </Button>
                <Button onClick={loadLogs} variant="outline" size="sm" disabled={loading}>
                  <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                </Button>
                <PermissionGuard permissions="admin.whatsapp-logs.exportar">
                  <Button onClick={handleExport} variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Exportar
                  </Button>
                </PermissionGuard>
              </div>
            </div>

            {/* Filtros Colapsáveis */}
            <Collapsible open={showFilters} onOpenChange={setShowFilters}>
              <CollapsibleContent>
                <div className="mt-4 pt-4 border-t space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    {/* Contato */}
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Contato</Label>
                      <div className="flex gap-1">
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="flex-1 justify-start font-normal text-xs h-9"
                          onClick={() => setContatoModalOpen(true)}
                        >
                          <User className="h-3.5 w-3.5 mr-1.5 shrink-0 text-muted-foreground" />
                          <span className="truncate">
                            {selectedContatoNome || 'Selecionar...'}
                          </span>
                        </Button>
                        {selectedContato && (
                          <Button variant="ghost" size="sm" className="h-9 w-9 p-0" onClick={handleClearContato}>
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Chat */}
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Chat</Label>
                      <div className="flex gap-1">
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="flex-1 justify-start font-normal text-xs h-9"
                          onClick={() => setChatModalOpen(true)}
                          disabled={!selectedContato}
                        >
                          <MessageSquare className="h-3.5 w-3.5 mr-1.5 shrink-0 text-muted-foreground" />
                          <span className="truncate">
                            {selectedChat ? `#${selectedChat}` : 'Selecionar...'}
                          </span>
                        </Button>
                        {selectedChat && (
                          <Button variant="ghost" size="sm" className="h-9 w-9 p-0" onClick={handleClearChat}>
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Ação */}
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Ação</Label>
                      <Select value={selectedAcao || "all"} onValueChange={(v) => setSelectedAcao(v === "all" ? "" : v)}>
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue placeholder="Todas" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todas as ações</SelectItem>
                          {ACOES_DISPONIVEIS.map(a => (
                            <SelectItem key={a.value} value={a.value}>
                              {a.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Usuário */}
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Usuário</Label>
                      <Select value={selectedUsuario || "all"} onValueChange={(v) => setSelectedUsuario(v === "all" ? "" : v)}>
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue placeholder="Todos" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos os usuários</SelectItem>
                          {usuarios.map(u => (
                            <SelectItem key={u.id} value={u.id}>
                              {u.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Data Início */}
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">De</Label>
                      <div className="relative">
                        <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                        <Input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="h-9 text-xs pl-8"
                        />
                      </div>
                    </div>

                    {/* Data Fim */}
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Até</Label>
                      <div className="relative">
                        <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                        <Input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="h-9 text-xs pl-8"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSearch}>
                      <Search className="h-3.5 w-3.5 mr-1.5" />
                      Buscar
                    </Button>
                    {hasActiveFilters && (
                      <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                        Limpar filtros
                      </Button>
                    )}
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>

          {/* Lista de Logs */}
          <div className="flex-1 overflow-auto p-4">
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="bg-card border rounded-lg p-4">
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-10 w-10 rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-48" />
                      </div>
                      <Skeleton className="h-6 w-24 rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <div className="p-4 rounded-full bg-muted mb-4">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-medium text-foreground mb-1">Nenhum log encontrado</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Ajuste os filtros ou aguarde novas atividades no WhatsApp
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {logs.map(log => {
                  const acaoInfo = getAcaoInfo(log.acao);
                  const IconComponent = acaoInfo.icon;
                  const isExpanded = expandedRow === log.id;
                  const hasDetails = log.detalhes && Object.keys(log.detalhes).length > 0;

                  return (
                    <div 
                      key={log.id} 
                      className={cn(
                        "bg-card border rounded-lg transition-all",
                        hasDetails && "cursor-pointer hover:border-primary/30",
                        isExpanded && "ring-1 ring-primary/20"
                      )}
                      onClick={() => hasDetails && setExpandedRow(isExpanded ? null : log.id)}
                    >
                      <div className="p-4">
                        <div className="flex items-center gap-4">
                          {/* Ícone da Ação */}
                          <div className={cn(
                            "p-2.5 rounded-lg border shrink-0",
                            acaoInfo.color
                          )}>
                            <IconComponent className="h-4 w-4" />
                          </div>

                          {/* Conteúdo Principal */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm text-foreground">
                                {acaoInfo.label}
                              </span>
                              {log.chat_id && (
                                <Badge variant="outline" className="text-xs font-mono">
                                  Chat #{log.chat_id}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              {log.usuarios?.nome && (
                                <span className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  {log.usuarios.nome}
                                </span>
                              )}
                              {log.contatos_whatsapp?.nome && (
                                <span className="flex items-center gap-1">
                                  <MessageSquare className="h-3 w-3" />
                                  {log.contatos_whatsapp.nome}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {format(new Date(log.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                              </span>
                            </div>
                          </div>

                          {/* Expandir */}
                          {hasDetails && (
                            <Button variant="ghost" size="sm" className="shrink-0">
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Detalhes Expandidos */}
                      {isExpanded && hasDetails && (
                        <div className="px-4 pb-4 pt-0">
                          <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                            {log.usuario_id && (
                              <div className="flex items-center gap-2 text-xs">
                                <span className="text-muted-foreground">ID Usuário:</span>
                                <code className="font-mono bg-background px-1.5 py-0.5 rounded text-foreground">
                                  {log.usuario_id}
                                </code>
                              </div>
                            )}
                            {log.contato_id && (
                              <div className="flex items-center gap-2 text-xs">
                                <span className="text-muted-foreground">ID Contato:</span>
                                <code className="font-mono bg-background px-1.5 py-0.5 rounded text-foreground">
                                  {log.contato_id}
                                </code>
                              </div>
                            )}
                            <div className="pt-2 border-t border-border/50">
                              <span className="text-xs text-muted-foreground block mb-1.5">Detalhes:</span>
                              <pre className="text-xs font-mono bg-background p-2 rounded overflow-auto max-h-40">
                                {JSON.stringify(log.detalhes, null, 2)}
                              </pre>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="px-6 py-3 border-t bg-card flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Mostrando {page * LIMIT + 1} - {Math.min((page + 1) * LIMIT, totalLogs)} de {totalLogs.toLocaleString()}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="px-3 py-1.5 text-sm font-medium">
                  {page + 1} / {totalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Modais de seleção */}
        <SelectContatoWhatsAppModal
          open={contatoModalOpen}
          onOpenChange={setContatoModalOpen}
          onSelect={handleSelectContato}
          contatos={contatos}
          title="Selecionar Contato WhatsApp"
        />

        <SelectChatWhatsAppModal
          open={chatModalOpen}
          onOpenChange={setChatModalOpen}
          onSelect={handleSelectChat}
          chats={chats}
          title="Selecionar Chat"
        />
      </PermissionGuard>
    </>
  );
};

export default WhatsAppLogs;
