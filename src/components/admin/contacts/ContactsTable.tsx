
import { useState } from 'react';
import { Eye, Mail, Phone, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useContatos } from '@/hooks/useContatos';
import { Contato } from '@/components/admin/contacts/types';
import { STATUS_OPTIONS } from './constants';
import { ensureDate } from './utils';

interface ContactsTableProps {
  searchTerm: string;
  statusFilter: string;
  onViewContact: (contact: Contato) => void;
}

const ContactsTable = ({ searchTerm, statusFilter, onViewContact }: ContactsTableProps) => {
  const { contatos, isLoading } = useContatos();

  const filteredContatos = contatos.filter(contato => {
    const matchesSearch = contato.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contato.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contato.subject.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || contato.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = STATUS_OPTIONS.find(opt => opt.value === status);
    if (!statusConfig) return <Badge variant="secondary">Desconhecido</Badge>;

    const variants = {
      novo: 'destructive',
      respondido: 'default',
      processando: 'secondary',
      arquivado: 'outline'
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] as any}>
        <statusConfig.icon className="mr-1 h-3 w-3" />
        {statusConfig.label}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Carregando contatos...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lista de Contatos ({filteredContatos.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {filteredContatos.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Nenhum contato encontrado</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Assunto</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContatos.map((contato) => (
                <TableRow key={contato.id}>
                  <TableCell className="font-medium">{contato.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Mail size={14} className="mr-2 text-gray-400" />
                      {contato.email}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Phone size={14} className="mr-2 text-gray-400" />
                      {contato.phone}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{contato.subject}</TableCell>
                  <TableCell>{getStatusBadge(contato.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Clock size={14} className="mr-2 text-gray-400" />
                      {format(ensureDate(contato.createdAt) || new Date(), "dd/MM/yyyy", { locale: ptBR })}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => onViewContact(contato)}>
                      <Eye size={16} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default ContactsTable;
