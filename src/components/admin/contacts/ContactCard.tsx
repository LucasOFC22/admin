import React, { forwardRef, useState } from 'react';
import { formatTimestamp } from '@/utils/dateFormatters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Mail, Phone, Calendar, MoreVertical, Trash2, CheckCircle, Clock, XCircle } from 'lucide-react';
import { AdminContact } from '@/hooks/useAdminContacts';
import { motion } from 'framer-motion';
import ContactDetailModal from './ContactDetailModal';

interface ContactCardProps {
  contact: AdminContact;
  onUpdateStatus: (contact_id: number, status: string) => void;
  onDelete: (contact_id: number) => void;
}

const statusConfig = {
  novo: { label: 'Novo', color: 'bg-blue-500', textColor: 'text-blue-700', bgColor: 'bg-blue-50' },
  em_andamento: { label: 'Em Andamento', color: 'bg-yellow-500', textColor: 'text-yellow-700', bgColor: 'bg-yellow-50' },
  respondido: { label: 'Respondido', color: 'bg-green-500', textColor: 'text-green-700', bgColor: 'bg-green-50' },
  fechado: { label: 'Fechado', color: 'bg-gray-500', textColor: 'text-gray-700', bgColor: 'bg-gray-50' }
};

const ContactCard = forwardRef<HTMLDivElement, ContactCardProps>(({ contact, onUpdateStatus, onDelete }, ref) => {
  const [showDetail, setShowDetail] = useState(false);

  const formatDate = (dateString: string) => formatTimestamp(dateString);

  const status = statusConfig[contact.status] || statusConfig.novo;

  return (
    <>
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card 
        className="hover:shadow-lg transition-shadow h-[300px] flex flex-col overflow-hidden cursor-pointer"
        onClick={() => setShowDetail(true)}
      >
        <CardHeader className="pb-3 flex-shrink-0">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-base font-semibold truncate flex-1" title={contact.name}>
              {contact.name}
            </CardTitle>
            <Badge className={`${status.bgColor} ${status.textColor} border-0 flex-shrink-0 text-xs`}>
              {status.label}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuItem onClick={() => onUpdateStatus(contact.contact_id, 'em_andamento')}>
                  <Clock className="h-4 w-4 mr-2 text-yellow-600" />
                  Em Andamento
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onUpdateStatus(contact.contact_id, 'respondido')}>
                  <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                  Marcar como Respondido
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onUpdateStatus(contact.contact_id, 'fechado')}>
                  <XCircle className="h-4 w-4 mr-2 text-gray-600" />
                  Fechar
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onDelete(contact.contact_id)}
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {contact.subject && (
            <p className="text-sm text-muted-foreground truncate mt-1" title={contact.subject}>
              {contact.subject}
            </p>
          )}
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col pt-0 overflow-hidden">
          {/* Info */}
          <div className="space-y-1.5 pb-3 border-b flex-shrink-0">
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
              <a href={`mailto:${contact.email}`} className="text-primary hover:underline truncate text-xs">
                {contact.email}
              </a>
            </div>
            {contact.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                <a href={`tel:${contact.phone}`} className="text-primary hover:underline text-xs">
                  {contact.phone}
                </a>
              </div>
            )}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
              <span>{formatDate(contact.created_at)}</span>
            </div>
          </div>

          {/* Message */}
          <div className="flex-1 py-3 overflow-hidden">
            <p className="text-sm text-foreground line-clamp-4 leading-relaxed">{contact.message}</p>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2 border-t flex-shrink-0">
            <Button 
              variant="default" 
              size="sm" 
              className="flex-1 h-9"
              onClick={(e) => {
                e.stopPropagation();
                window.location.href = `mailto:${contact.email}`;
              }}
            >
              <Mail className="h-4 w-4 mr-1.5" />
              Responder
            </Button>
            {contact.phone && (
              <Button 
                variant="outline" 
                size="sm"
                className="h-9"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(`https://wa.me/${contact.phone.replace(/\D/g, '')}`, '_blank');
                }}
              >
                <Phone className="h-4 w-4 mr-1.5" />
                WhatsApp
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>

    <ContactDetailModal 
      contact={contact} 
      open={showDetail} 
      onOpenChange={setShowDetail} 
    />
    </>
  );
});

ContactCard.displayName = 'ContactCard';

export default ContactCard;
