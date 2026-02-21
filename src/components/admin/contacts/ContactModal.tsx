import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AdminDialog, AdminDialogContent, AdminDialogHeader, AdminDialogTitle } from '@/components/admin/ui/AdminDialog';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Mail, Phone, Calendar, MapPin, FileText, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ContactDetails } from '@/types/contact';
import { ContactStatus } from '@/types/common';


interface ContactModalProps {
  contact: ContactDetails | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ContactModal = ({ contact, open, onOpenChange }: ContactModalProps) => {

  const [loading, setLoading] = useState<boolean>(false);

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusBadge = (status: ContactStatus) => {
    switch (status) {
      case 'novo':
        return <Badge variant="secondary">Novo</Badge>;
      case 'processando':
        return <Badge className="bg-blue-50 text-blue-700 border-blue-200">Processando</Badge>;
      case 'respondido':
        return <Badge className="bg-green-50 text-green-700 border-green-200">Respondido</Badge>;
      case 'arquivado':
        return <Badge className="bg-red-50 text-red-700 border-red-200">Arquivado</Badge>;
      default:
        return <Badge>Desconhecido</Badge>;
    }
  };

  const getStatusIcon = (status: ContactStatus) => {
    switch (status) {
      case 'novo':
        return <AlertCircle className="w-4 h-4 mr-1" />;
      case 'processando':
        return <Clock className="w-4 h-4 mr-1" />;
      case 'respondido':
        return <CheckCircle className="w-4 h-4 mr-1" />;
      case 'arquivado':
        return <XCircle className="w-4 h-4 mr-1" />;
      default:
        return null;
    }
  };

  if (!contact) return null;

  return (
    <AdminDialog open={open} onOpenChange={onOpenChange}>
      <AdminDialogContent className="max-w-full sm:max-w-2xl">
        <AdminDialogHeader>
          <AdminDialogTitle className="text-base sm:text-lg">Detalhes do Contato</AdminDialogTitle>
        </AdminDialogHeader>
        
        <div className="space-y-6">
          {/* User Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Informações do Contato
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16">
                  <AvatarFallback className="bg-blue-100 text-blue-600 text-lg font-medium">
                    {getInitials(contact.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{contact.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    {getStatusBadge(contact.status)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:gap-4">
                <div className="flex items-start sm:items-center gap-2 flex-col sm:flex-row">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-500 flex-shrink-0" />
                    <span className="text-xs sm:text-sm text-gray-600">Email:</span>
                  </div>
                  <span className="text-xs sm:text-sm font-medium break-all">{contact.email}</span>
                </div>
                
                {contact.phone && (
                  <div className="flex items-start sm:items-center gap-2 flex-col sm:flex-row">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-500 flex-shrink-0" />
                      <span className="text-xs sm:text-sm text-gray-600">Telefone:</span>
                    </div>
                    <span className="text-xs sm:text-sm font-medium">{contact.phone}</span>
                  </div>
                )}

                {contact.department && (
                  <div className="flex items-start sm:items-center gap-2 flex-col sm:flex-row">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-500 flex-shrink-0" />
                      <span className="text-xs sm:text-sm text-gray-600">Departamento:</span>
                    </div>
                    <span className="text-xs sm:text-sm font-medium">{contact.department}</span>
                  </div>
                )}

                <div className="flex items-start sm:items-center gap-2 flex-col sm:flex-row">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500 flex-shrink-0" />
                    <span className="text-xs sm:text-sm text-gray-600">Recebido em:</span>
                  </div>
                  <span className="text-xs sm:text-sm font-medium">
                    {formatDistanceToNow(new Date((contact.createdAt as any).seconds * 1000), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Message Content */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Assunto: {contact.subject}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-800">{contact.message}</p>
            </CardContent>
          </Card>
        </div>
      </AdminDialogContent>
    </AdminDialog>
  );
};
