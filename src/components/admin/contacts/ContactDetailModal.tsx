import React from 'react';
import { formatTimestamp } from '@/utils/dateFormatters';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Mail, Phone, Calendar, User, FileText, MessageSquare } from 'lucide-react';
import { AdminContact } from '@/hooks/useAdminContacts';

interface ContactDetailModalProps {
  contact: AdminContact | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusConfig = {
  novo: { label: 'Novo', textColor: 'text-blue-700', bgColor: 'bg-blue-50' },
  em_andamento: { label: 'Em Andamento', textColor: 'text-yellow-700', bgColor: 'bg-yellow-50' },
  respondido: { label: 'Respondido', textColor: 'text-green-700', bgColor: 'bg-green-50' },
  fechado: { label: 'Fechado', textColor: 'text-gray-700', bgColor: 'bg-gray-50' }
};

const ContactDetailModal: React.FC<ContactDetailModalProps> = ({ contact, open, onOpenChange }) => {
  if (!contact) return null;

  const formatDate = (dateString: string) => formatTimestamp(dateString);

  const status = statusConfig[contact.status] || statusConfig.novo;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between gap-3">
            <DialogTitle className="text-xl">{contact.name}</DialogTitle>
            <Badge className={`${status.bgColor} ${status.textColor} border-0`}>
              {status.label}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Informações de contato */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <User className="h-4 w-4" />
              Informações de Contato
            </h4>
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a href={`mailto:${contact.email}`} className="text-primary hover:underline">
                  {contact.email}
                </a>
              </div>
              {contact.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a href={`tel:${contact.phone}`} className="text-primary hover:underline">
                    {contact.phone}
                  </a>
                </div>
              )}
              <div className="flex items-center gap-3 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span className="text-sm">{formatDate(contact.created_at)}</span>
              </div>
            </div>
          </div>

          {/* Assunto */}
          {contact.subject && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Assunto
              </h4>
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm">{contact.subject}</p>
              </div>
            </div>
          )}

          {/* Mensagem */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Mensagem
            </h4>
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{contact.message}</p>
            </div>
          </div>

          {/* Ações */}
          <div className="flex gap-3 pt-2">
            <Button 
              variant="default" 
              className="flex-1"
              onClick={() => window.location.href = `mailto:${contact.email}`}
            >
              <Mail className="h-4 w-4 mr-2" />
              Responder por E-mail
            </Button>
            {contact.phone && (
              <Button 
                variant="outline"
                onClick={() => window.open(`https://wa.me/${contact.phone.replace(/\D/g, '')}`, '_blank')}
              >
                <Phone className="h-4 w-4 mr-2" />
                WhatsApp
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ContactDetailModal;
