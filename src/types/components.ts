import { ReactNode } from "react";
import { 
  QuoteId, 
  ContactId, 
  UserId, 
  SessionId, 
  QuoteStatus, 
  ContactStatus, 
  ChatSessionStatus, 
  Priority,
  Timestamp 
} from "./base";
import { QuoteFormData, ContactFormData, ProposalFormData } from "./forms";

// Component prop interfaces - organized by feature

// Admin Layout Props
export interface AdminLayoutProps {
  children: ReactNode;
  currentTab?: string;
  onTabChange?: (tab: string) => void;
}

export interface AdminHeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  onNavigate: (type: 'quotes' | 'contacts' | 'chat', id?: string) => void;
}

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ComponentType<{ className?: string }>;
  breadcrumbs?: BreadcrumbItem[];
  actions?: ReactNode;
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

// Quote Component Props
export interface QuoteDetailsModalProps {
  cotacao: CotacaoDetails;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSendProposal?: (proposal: ProposalFormData) => Promise<void>;
}

export interface QuotesTableProps {
  quotes: QuoteDetails[];
  onEditQuote: (quote: QuoteDetails) => void;
  onViewQuote: (quote: QuoteDetails) => void;
  isLoading?: boolean;
}

export interface QuotesFiltersProps {
  filters: QuoteFiltersState;
  onFilterChange: (filters: Partial<QuoteFiltersState>) => void;
}

export interface CotacaoDetails {
  id: QuoteId;
  status: QuoteStatus;
  contato?: ContactInfo;
  remetente?: PartyInfo;
  destinatario?: PartyInfo;
  carga?: CargoInfo;
  criadoEm: Timestamp;
  atualizadoEm?: Timestamp;
  propostas?: ProposalData[];
  notas?: QuoteNote[];
  origem?: string;
  destino?: string;
  valorDeclarado?: number;
  peso?: number;
  dimensoes?: {
    comprimento: number;
    altura: number;
    profundidade: number;
  };
  tipoFrete?: string;
  necesssitaColeta?: boolean;
  adminQuoteLink?: string;
}

export interface QuoteDetails extends CotacaoDetails {
  // Additional computed properties
  formattedId: string;
  timeAgo: string;
  statusBadge: {
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
    label: string;
  };
}

export interface ProposalData {
  id?: string;
  quoteId: QuoteId;
  valor: number;
  prazoEntrega: string;
  validade: string;
  detalhes?: string;
  responsavel?: string;
  status: QuoteStatus;
  criadoEm: Timestamp;
  enviadoEm?: Timestamp;
}

export interface QuoteNote {
  id: string;
  quoteId: QuoteId;
  content: string;
  author: string;
  isInternal: boolean;
  createdAt: Timestamp;
}

// Contact Component Props
export interface ContactsTableProps {
  contacts: ContactDetails[];
  onViewContact: (contact: ContactDetails) => void;
  onEditContact: (contact: ContactDetails) => void;
  onDeleteContact: (contact: ContactDetails) => void;
  isLoading?: boolean;
}

export interface ContactModalProps {
  contact?: ContactDetails;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: ContactFormData) => Promise<void>;
}

export interface ContactDetails {
  id: ContactId;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  subject: string;
  message: string;
  status: ContactStatus;
  createdAt: Timestamp;
  respondedAt?: Timestamp;
  respondedBy?: string;
  response?: string;
  department?: string;
  source: 'n8n' | 'supabase' | 'website';
  referenceId?: string;
  ip?: string;
  userAgent?: string;
}

// Chat Component Props
export interface ChatSessionProps {
  session: ChatSessionDetails;
  onClose: () => void;
  onStatusUpdate: (status: ChatSessionStatus) => void;
}

export interface ChatSessionDetails {
  id: SessionId;
  name?: string;
  email?: string;
  phone?: string;
  status: ChatSessionStatus;
  priority?: Priority;
  lastMessage?: string;
  lastActivity: Timestamp;
  assignedAgent?: string;
  assignedAgentName?: string;
  createdAt: Timestamp;
  resolvedAt?: Timestamp;
  tags?: string[];
  messages: ChatMessageDetails[];
  transferHistory?: TransferHistoryItem[];
  satisfaction?: SatisfactionRating;
  clientInfo?: ClientInfo;
}

export interface ChatMessageDetails {
  id: string;
  content: string;
  sender: 'user' | 'agent' | 'admin' | 'bot';
  senderName?: string;
  senderEmail?: string;
  timestamp: Timestamp;
  sessionId: SessionId;
}

export interface TransferHistoryItem {
  fromAgent: string;
  toAgent: string;
  reason: string;
  timestamp: Timestamp;
}

export interface SatisfactionRating {
  rating: number;
  feedback?: string;
  timestamp: Timestamp;
}

export interface ClientInfo {
  ip?: string;
  location?: string;
  deviceInfo?: string;
  browserInfo?: string;
}

// User Component Props
export interface UsersTableProps {
  users: UserDetails[];
  onEditUser: (user: UserDetails) => void;
  onDeleteUser: (user: UserDetails) => void;
  isLoading?: boolean;
}

export interface UserDetails {
  id: UserId;
  name: string;
  email: string;
  phone?: string;
  role: string;
  department?: string;
  active: boolean;
  lastLogin?: Timestamp;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  permissions?: string[];
}

// Filter State Types
export interface QuoteFiltersState {
  searchTerm: string;
  statusFilter: string;
  dateRange?: {
    from: Date;
    to: Date;
  };
  originFilter: string;
  destinationFilter: string;
  freightTypeFilter: string;
  minValue?: number;
  maxValue?: number;
}

export interface ContactFiltersState {
  searchTerm: string;
  statusFilter: string;
  dateRange?: {
    from: Date;
    to: Date;
  };
  departmentFilter: string;
}

// Stats Types
export interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  trend?: {
    value: number;
    label: string;
    isPositive: boolean;
  };
}

export interface QuoteStats {
  total: number;
  pending: number;
  inAnalysis: number;
  proposalSent: number;
  approved: number;
  rejected: number;
  cancelled: number;
}

export interface ContactStats {
  total: number;
  new: number;
  processing: number;
  responded: number;
  archived: number;
}

// Form Component Props
export interface FormFieldProps {
  label: string;
  name: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'textarea' | 'select';
  placeholder?: string;
  required?: boolean;
  options?: Array<{ value: string; label: string }>;
  disabled?: boolean;
  error?: string;
}

// Generic Component Props
export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Type helpers for components
export type ComponentVariant = 'default' | 'primary' | 'secondary' | 'destructive' | 'outline' | 'ghost';
export type ComponentSize = 'sm' | 'md' | 'lg' | 'xl';

// Event handler types
export type ClickHandler = () => void;
export type ChangeHandler<T = string> = (value: T) => void;
export type SubmitHandler<T> = (data: T) => Promise<void>;

// Import types from base for re-export
import type { ContactInfo, PartyInfo, CargoInfo } from "./base";
export type { ContactInfo, PartyInfo, CargoInfo };