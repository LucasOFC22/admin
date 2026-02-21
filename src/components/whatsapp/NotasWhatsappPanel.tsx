import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MentionTextarea } from './MentionTextarea';
import { extractMentions } from '@/hooks/useMentionAutocomplete';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  StickyNote,
  Plus,
  Trash2,
  Edit3,
  Save,
  X,
  Star,
  Lock,
  Globe,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Filter,
  MoreHorizontal,
  Reply,
  Loader2,
  Send,
  Sparkles,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNotasWhatsapp } from '@/hooks/useNotasWhatsapp';
import { InternalNote } from '@/types/internalNotes';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';

interface NotasWhatsappPanelProps {
  chatId: number | null;
  currentUserId: string | null;
  currentUserName: string;
  isAdmin?: boolean;
  isChatActive?: boolean;
}

// Componente para Avatar com iniciais
const NoteAvatar: React.FC<{ name: string; isPrivate?: boolean }> = ({ name, isPrivate }) => {
  const initials = name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className={cn(
      "w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0",
      isPrivate 
        ? "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300" 
        : "bg-primary/10 text-primary"
    )}>
      {initials}
    </div>
  );
};

// Componente para exibir reações agrupadas
const ReactionsDisplay: React.FC<{
  reactions: InternalNote['reacoes'];
  currentUserId: string | null;
  onReact: (emoji: string) => void;
}> = ({ reactions, currentUserId, onReact }) => {
  if (!reactions || reactions.length === 0) return null;

  const grouped = reactions.reduce((acc, r) => {
    acc[r.emoji] = (acc[r.emoji] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="flex gap-1 flex-wrap mt-2">
      {Object.entries(grouped).map(([emoji, count]) => {
        const hasReacted = reactions.some(r => r.emoji === emoji && r.userId === currentUserId);
        return (
          <motion.button
            key={emoji}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onReact(emoji)}
            className={cn(
              "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-colors",
              hasReacted 
                ? "bg-primary/20 text-primary border border-primary/30" 
                : "bg-muted hover:bg-muted-foreground/10 border border-transparent"
            )}
          >
            <span>{emoji}</span>
            <span className="font-medium">{count}</span>
          </motion.button>
        );
      })}
    </div>
  );
};

// Componente para uma nota individual
const NoteCard: React.FC<{
  note: InternalNote;
  currentUserId: string | null;
  currentUserName: string;
  isReply?: boolean;
  isExpanded?: boolean;
  replies?: InternalNote[];
  isReplying?: boolean;
  replyContent?: string;
  isSubmitting?: boolean;
  onToggleExpand?: () => void;
  onStartReply?: () => void;
  onCancelReply?: () => void;
  onReplyContentChange?: (value: string) => void;
  onSubmitReply?: () => void;
  onToggleImportant: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onReact: (emoji: string) => void;
  canEdit: boolean;
  canDelete: boolean;
  editingNoteId: string | null;
  editContent: string;
  onEditContentChange: (value: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
}> = ({
  note,
  currentUserId,
  isReply = false,
  isExpanded,
  replies = [],
  isReplying,
  replyContent = '',
  isSubmitting,
  onToggleExpand,
  onStartReply,
  onCancelReply,
  onReplyContentChange,
  onSubmitReply,
  onToggleImportant,
  onEdit,
  onDelete,
  onReact,
  canEdit,
  canDelete,
  editingNoteId,
  editContent,
  onEditContentChange,
  onSaveEdit,
  onCancelEdit,
}) => {
  const isEditing = editingNoteId === note.id;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      layout
      className={cn(
        "group relative",
        isReply && "ml-10 mt-2"
      )}
    >
      <div className={cn(
        "rounded-2xl p-4 transition-all duration-200",
        note.isPrivada
          ? "bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/50"
          : "bg-card border border-border/50",
        note.isImportante && "ring-2 ring-yellow-400/50 ring-offset-2 ring-offset-background",
        !isReply && "shadow-sm hover:shadow-md"
      )}>
        {/* Header */}
        <div className="flex items-start gap-3">
          <NoteAvatar name={note.autorNome} isPrivate={note.isPrivada} />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm text-foreground">
                {note.autorNome}
              </span>
              <span className="text-xs text-muted-foreground">
                {format(note.createdAt, "dd/MM 'às' HH:mm", { locale: ptBR })}
              </span>
              {note.editado && (
                <span className="text-[10px] text-muted-foreground italic">(editado)</span>
              )}
            </div>
            
            <div className="flex items-center gap-1.5 mt-1">
              {note.isPrivada ? (
                <Badge variant="outline" className="h-5 text-[10px] gap-1 bg-amber-100/50 border-amber-300 text-amber-700 dark:bg-amber-900/30 dark:border-amber-700 dark:text-amber-300">
                  <Lock className="w-2.5 h-2.5" />
                  Privada
                </Badge>
              ) : (
                <Badge variant="outline" className="h-5 text-[10px] gap-1">
                  <Globe className="w-2.5 h-2.5" />
                  Pública
                </Badge>
              )}
              {note.isImportante && (
                <Badge className="h-5 text-[10px] gap-1 bg-yellow-500 hover:bg-yellow-600">
                  <Star className="w-2.5 h-2.5" />
                  Importante
                </Badge>
              )}
            </div>
          </div>

          {/* Menu de ações */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={onToggleImportant}>
                <Star className={cn("w-4 h-4 mr-2", note.isImportante && "fill-yellow-500 text-yellow-500")} />
                {note.isImportante ? 'Remover destaque' : 'Destacar'}
              </DropdownMenuItem>
              {!isReply && (
                <DropdownMenuItem onClick={onStartReply}>
                  <Reply className="w-4 h-4 mr-2" />
                  Responder
                </DropdownMenuItem>
              )}
              {canEdit && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onEdit}>
                    <Edit3 className="w-4 h-4 mr-2" />
                    Editar
                  </DropdownMenuItem>
                </>
              )}
              {canDelete && (
                <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Conteúdo */}
        {isEditing ? (
          <div className="mt-3 space-y-2">
            <Textarea
              value={editContent}
              onChange={(e) => onEditContentChange(e.target.value)}
              className="min-h-[80px] resize-none"
              disabled={isSubmitting}
            />
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" size="sm" onClick={onCancelEdit} disabled={isSubmitting}>
                <X className="w-3 h-3 mr-1" />
                Cancelar
              </Button>
              <Button size="sm" onClick={onSaveEdit} disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Save className="w-3 h-3 mr-1" />}
                Salvar
              </Button>
            </div>
          </div>
        ) : (
          <p className="mt-3 text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
            {note.conteudo}
          </p>
        )}

        {/* Reações */}
        {!isEditing && (
          <ReactionsDisplay
            reactions={note.reacoes}
            currentUserId={currentUserId}
            onReact={onReact}
          />
        )}

        {/* Ações rápidas */}
        {!isEditing && (
          <div className="mt-3 flex items-center gap-2">
            <div className="flex gap-0.5">
              {['👍', '❤️', '✅', '👀'].map((emoji) => (
                <motion.button
                  key={emoji}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => onReact(emoji)}
                  className="w-7 h-7 rounded-full hover:bg-muted flex items-center justify-center text-sm opacity-50 hover:opacity-100 transition-opacity"
                >
                  {emoji}
                </motion.button>
              ))}
            </div>

            {!isReply && note.respostasCount !== undefined && note.respostasCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1 ml-auto"
                onClick={onToggleExpand}
              >
                <MessageSquare className="w-3 h-3" />
                {note.respostasCount} {note.respostasCount === 1 ? 'resposta' : 'respostas'}
                {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </Button>
            )}
          </div>
        )}

        {/* Respostas */}
        <AnimatePresence>
          {isExpanded && replies.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 space-y-2"
            >
              {replies.map((reply) => (
                <NoteCard
                  key={reply.id}
                  note={reply}
                  currentUserId={currentUserId}
                  currentUserName=""
                  isReply
                  onToggleImportant={() => {}}
                  onEdit={() => {}}
                  onDelete={() => {}}
                  onReact={(emoji) => onReact(emoji)}
                  canEdit={false}
                  canDelete={false}
                  editingNoteId={null}
                  editContent=""
                  onEditContentChange={() => {}}
                  onSaveEdit={() => {}}
                  onCancelEdit={() => {}}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Campo de resposta */}
        <AnimatePresence>
          {isReplying && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 pt-3 border-t border-border/50"
            >
              <div className="flex gap-2">
                <Textarea
                  value={replyContent}
                  onChange={(e) => onReplyContentChange?.(e.target.value)}
                  placeholder="Escreva sua resposta..."
                  className="flex-1 min-h-[60px] resize-none text-sm"
                  disabled={isSubmitting}
                />
              </div>
              <div className="flex gap-2 justify-end mt-2">
                <Button variant="ghost" size="sm" onClick={onCancelReply} disabled={isSubmitting}>
                  Cancelar
                </Button>
                <Button size="sm" onClick={onSubmitReply} disabled={isSubmitting || !replyContent?.trim()}>
                  {isSubmitting ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Reply className="w-3 h-3 mr-1" />}
                  Responder
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

const NotasWhatsappPanel: React.FC<NotasWhatsappPanelProps> = ({
  chatId,
  currentUserId,
  currentUserName,
  isAdmin = false,
  isChatActive = true,
}) => {
  const {
    notes,
    isLoading,
    filter,
    setFilter,
    createNote,
    updateNote,
    deleteNote,
    toggleImportante,
    addReaction,
    loadReplies,
    canEdit,
    canDelete,
  } = useNotasWhatsapp(chatId, currentUserId, isAdmin);

  const [newNoteContent, setNewNoteContent] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());
  const [replies, setReplies] = useState<Record<string, InternalNote[]>>({});
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateNote = async () => {
    if (!newNoteContent.trim() || isSubmitting) return;
    setIsSubmitting(true);
    const mencoes = extractMentions(newNoteContent);
    const result = await createNote({ conteudo: newNoteContent, isPrivada: isPrivate, mencoes });
    if (result) {
      setNewNoteContent('');
      setIsAddingNote(false);
      setIsPrivate(false);
    }
    setIsSubmitting(false);
  };

  const handleEditNote = async (noteId: string) => {
    if (!editContent.trim() || isSubmitting) return;
    setIsSubmitting(true);
    const result = await updateNote(noteId, { conteudo: editContent });
    if (result) {
      setEditingNoteId(null);
      setEditContent('');
    }
    setIsSubmitting(false);
  };

  const handleDeleteNote = async (noteId: string) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    await deleteNote(noteId);
    setIsSubmitting(false);
  };

  const handleToggleImportante = async (note: InternalNote) => {
    await toggleImportante(note.id, !note.isImportante);
  };

  const toggleExpand = async (noteId: string) => {
    const newExpanded = new Set(expandedNotes);
    if (newExpanded.has(noteId)) {
      newExpanded.delete(noteId);
    } else {
      newExpanded.add(noteId);
      if (!replies[noteId]) {
        const noteReplies = await loadReplies(noteId);
        setReplies((prev) => ({ ...prev, [noteId]: noteReplies }));
      }
    }
    setExpandedNotes(newExpanded);
  };

  const handleReply = async (notaPaiId: string) => {
    if (!replyContent.trim() || isSubmitting) return;
    setIsSubmitting(true);
    const mencoes = extractMentions(replyContent);
    const result = await createNote({ conteudo: replyContent, isPrivada: false, notaPaiId, mencoes });
    if (result) {
      setReplyContent('');
      setReplyingTo(null);
      const noteReplies = await loadReplies(notaPaiId);
      setReplies((prev) => ({ ...prev, [notaPaiId]: noteReplies }));
    }
    setIsSubmitting(false);
  };

  const handleReaction = async (noteId: string, emoji: string) => {
    await addReaction(noteId, emoji, currentUserName);
  };

  if (!chatId) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8">
        <StickyNote className="w-16 h-16 mb-4 opacity-20" />
        <p className="text-lg font-medium">Selecione um chat</p>
        <p className="text-sm">para ver as notas da equipe</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b bg-card/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <StickyNote className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-base">Notas da Equipe</h2>
              <p className="text-xs text-muted-foreground">
                {notes.length} {notes.length === 1 ? 'nota' : 'notas'}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant={showFilters ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="h-8"
            >
              <Filter className="w-4 h-4" />
            </Button>
            {isChatActive && (
              <Button 
                size="sm" 
                onClick={() => setIsAddingNote(true)} 
                disabled={isAddingNote}
                className="h-8 gap-1"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Nova</span>
              </Button>
            )}
          </div>
        </div>

        {/* Filtros */}
        <Collapsible open={showFilters}>
          <CollapsibleContent>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-wrap gap-3 pt-4 mt-4 border-t"
            >
              <div className="flex items-center gap-2">
                <Switch id="showPublic" checked={filter.showPublic} onCheckedChange={(c) => setFilter({ ...filter, showPublic: c })} />
                <Label htmlFor="showPublic" className="text-xs">Públicas</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch id="showPrivate" checked={filter.showPrivate} onCheckedChange={(c) => setFilter({ ...filter, showPrivate: c })} />
                <Label htmlFor="showPrivate" className="text-xs">Privadas</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch id="onlyImportant" checked={filter.onlyImportant} onCheckedChange={(c) => setFilter({ ...filter, onlyImportant: c })} />
                <Label htmlFor="onlyImportant" className="text-xs">Importantes</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch id="onlyMyNotes" checked={filter.onlyMyNotes} onCheckedChange={(c) => setFilter({ ...filter, onlyMyNotes: c })} />
                <Label htmlFor="onlyMyNotes" className="text-xs">Minhas</Label>
              </div>
            </motion.div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {/* Formulário nova nota */}
          <AnimatePresence>
            {isAddingNote && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-card border border-border rounded-2xl p-4 shadow-sm"
              >
                <MentionTextarea
                  value={newNoteContent}
                  onChange={setNewNoteContent}
                  placeholder="Escreva sua nota... Use @ para mencionar"
                  disabled={isSubmitting}
                />
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-2">
                    <Switch id="isPrivate" checked={isPrivate} onCheckedChange={setIsPrivate} />
                    <Label htmlFor="isPrivate" className="text-sm flex items-center gap-1.5 cursor-pointer">
                      {isPrivate ? <Lock className="w-3.5 h-3.5 text-amber-600" /> : <Globe className="w-3.5 h-3.5" />}
                      {isPrivate ? 'Privada' : 'Pública'}
                    </Label>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { setIsAddingNote(false); setNewNoteContent(''); setIsPrivate(false); }}
                      disabled={isSubmitting}
                    >
                      Cancelar
                    </Button>
                    <Button size="sm" onClick={handleCreateNote} disabled={isSubmitting || !newNoteContent.trim()}>
                      {isSubmitting ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Send className="w-4 h-4 mr-1" />}
                      Salvar
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Loading */}
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-4 border rounded-2xl space-y-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-8 h-8 rounded-full" />
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                  <Skeleton className="h-16 w-full" />
                </div>
              ))}
            </div>
          ) : notes.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <div className="inline-flex p-4 rounded-full bg-muted/50 mb-4">
                <Sparkles className="w-8 h-8 text-muted-foreground/50" />
              </div>
              <p className="text-lg font-medium text-foreground/80">Nenhuma nota ainda</p>
              <p className="text-sm text-muted-foreground mt-1">
                Adicione notas para compartilhar com a equipe
              </p>
              {isChatActive && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setIsAddingNote(true)}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Criar primeira nota
                </Button>
              )}
            </motion.div>
          ) : (
            <div className="space-y-3">
              {notes.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  currentUserId={currentUserId}
                  currentUserName={currentUserName}
                  isExpanded={expandedNotes.has(note.id)}
                  replies={replies[note.id] || []}
                  isReplying={replyingTo === note.id}
                  replyContent={replyContent}
                  isSubmitting={isSubmitting}
                  onToggleExpand={() => toggleExpand(note.id)}
                  onStartReply={() => setReplyingTo(note.id)}
                  onCancelReply={() => { setReplyingTo(null); setReplyContent(''); }}
                  onReplyContentChange={setReplyContent}
                  onSubmitReply={() => handleReply(note.id)}
                  onToggleImportant={() => handleToggleImportante(note)}
                  onEdit={() => { setEditingNoteId(note.id); setEditContent(note.conteudo); }}
                  onDelete={() => handleDeleteNote(note.id)}
                  onReact={(emoji) => handleReaction(note.id, emoji)}
                  canEdit={canEdit(note)}
                  canDelete={canDelete(note)}
                  editingNoteId={editingNoteId}
                  editContent={editContent}
                  onEditContentChange={setEditContent}
                  onSaveEdit={() => handleEditNote(note.id)}
                  onCancelEdit={() => { setEditingNoteId(null); setEditContent(''); }}
                />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default NotasWhatsappPanel;