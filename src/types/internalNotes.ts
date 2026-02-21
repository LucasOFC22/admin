// Tipos para o sistema de Notas Internas da Equipe (notas_whatsapp)

export type NoteType = 'mensagem' | 'tarefa' | 'lembrete' | 'sistema';
export type TaskStatus = 'pendente' | 'em_andamento' | 'concluida' | null;

export interface InternalNote {
  id: string;
  chatId: number;
  autorId: string;
  autorNome: string;
  conteudo: string;
  isPrivada: boolean;
  isImportante: boolean;
  notaPaiId: string | null;
  mencoes: string[];
  reacoes: NoteReaction[];
  anexos: NoteAttachment[];
  tipo: NoteType;
  statusTarefa: TaskStatus;
  editado: boolean;
  createdAt: Date;
  updatedAt: Date;
  // Respostas aninhadas (carregadas separadamente)
  respostas?: InternalNote[];
  respostasCount?: number;
}

export interface NoteReaction {
  emoji: string;
  userId: string;
  userName: string;
}

export interface NoteAttachment {
  url: string;
  name: string;
  type: string;
  size?: number;
}

// Tipo para criação de nota
export interface CreateNoteData {
  chatId: number;
  autorId: string;
  conteudo: string;
  isPrivada?: boolean;
  isImportante?: boolean;
  notaPaiId?: string | null;
  mencoes?: string[];
  anexos?: NoteAttachment[];
  tipo?: NoteType;
  statusTarefa?: TaskStatus;
}

// Tipo para atualização de nota
export interface UpdateNoteData {
  conteudo?: string;
  isPrivada?: boolean;
  isImportante?: boolean;
  mencoes?: string[];
  reacoes?: NoteReaction[];
  anexos?: NoteAttachment[];
  statusTarefa?: TaskStatus;
}

// Filtros para listagem
export interface NotesFilter {
  showPrivate?: boolean;
  showPublic?: boolean;
  onlyImportant?: boolean;
  onlyMyNotes?: boolean;
  tipo?: NoteType | 'all';
}

// Dados brutos do banco
export interface RawNoteData {
  id: string;
  chat_id: number;
  autor_id: string;
  autor_nome: string;
  conteudo: string;
  is_privada: boolean;
  is_importante: boolean;
  nota_pai_id: string | null;
  mencoes: string[] | null;
  reacoes: NoteReaction[] | null;
  anexos: NoteAttachment[] | null;
  tipo: string | null;
  status_tarefa: string | null;
  editado: boolean | null;
  created_at: string;
  updated_at: string;
}

// Função para converter dados brutos em InternalNote
export function mapRawToNote(raw: RawNoteData): InternalNote {
  return {
    id: raw.id,
    chatId: raw.chat_id,
    autorId: raw.autor_id,
    autorNome: raw.autor_nome || 'Usuário',
    conteudo: raw.conteudo,
    isPrivada: raw.is_privada ?? false,
    isImportante: raw.is_importante ?? false,
    notaPaiId: raw.nota_pai_id,
    mencoes: raw.mencoes ?? [],
    reacoes: raw.reacoes ?? [],
    anexos: raw.anexos ?? [],
    tipo: (raw.tipo as NoteType) ?? 'mensagem',
    statusTarefa: raw.status_tarefa as TaskStatus,
    editado: raw.editado ?? false,
    createdAt: new Date(raw.created_at),
    updatedAt: new Date(raw.updated_at),
    respostas: [],
    respostasCount: 0,
  };
}
