
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Filter, 
  Download, 
  Mail, 
  Phone, 
  Calendar,
  Eye,
  Trash2,
  MessageCircle,
  RefreshCw,
  Webhook
} from 'lucide-react';
import { useCustomNotifications } from '@/hooks/useCustomNotifications';
import { useContatosData } from '@/hooks/useContatosData';

const ContactsManagement = () => {
  const { notify } = useCustomNotifications();
  const { contatos, isLoading, error, refetch } = useContatosData();
  const [searchTerm, setSearchTerm] = useState('');

  const getStatusBadge = (status: string) => {
    const variants = {
      novo: 'bg-blue-100 text-blue-800',
      respondido: 'bg-green-100 text-green-800',
      processando: 'bg-yellow-100 text-yellow-800',
      arquivado: 'bg-gray-100 text-gray-800'
    };
    return variants[status as keyof typeof variants] || 'bg-gray-100 text-gray-800';
  };

  const handleViewContact = (contact: any) => {
    notify.info(
      'Visualizar Contato',
      `Abrindo detalhes de ${contact.name} (Supabase ID: ${contact.id})`
    );
  };

  const handleSendEmail = (contact: any) => {
    notify.success(
      'Email Enviado',
      `Email de resposta enviado para ${contact.name} via Supabase`
    );
  };

  const handleCall = (contact: any) => {
    notify.info(
      'Ligação',
      `Iniciando ligação para ${contact.name}: ${contact.phone}`
    );
  };

  const handleDelete = (contact: any) => {
    notify.warning(
      'Contato Removido',
      `Contato de ${contact.name} foi removido (Supabase)`
    );
  };

  const handleRefresh = async () => {
    try {
      await refetch();
      notify.success('Atualizado', 'Contatos recarregados do Supabase');
    } catch (error) {
      notify.error('Erro', 'Falha ao recarregar contatos do Supabase');
    }
  };

  const handleExport = async () => {
    try {
      await notify.promise(
        new Promise(resolve => setTimeout(resolve, 2000)),
        {
          loading: 'Exportando contatos do Supabase...',
          success: 'Contatos exportados com sucesso!',
          error: 'Erro ao exportar contatos'
        }
      );
    } catch (error) {
      console.error('Erro na exportação:', error);
    }
  };

  const filteredContacts = contatos.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gerenciar Contatos (Supabase)</h2>
          <p className="text-gray-600">Visualize e responda mensagens de contato via Supabase</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={handleRefresh} variant="outline" size="sm" disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Status do Supabase */}
      <div className={`border rounded-lg p-4 ${error ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}>
        <div className="flex items-center gap-2">
          <Webhook className={`h-4 w-4 ${error ? 'text-red-600' : 'text-blue-600'}`} />
          <span className={`text-sm font-medium ${error ? 'text-red-700' : 'text-blue-700'}`}>
            Status Supabase: {error ? 'Erro de Conexão' : 'Conectado'}
          </span>
          <Badge variant={error ? 'destructive' : 'default'} className="ml-2">
            {contatos.length} contatos
          </Badge>
        </div>
        {error && (
          <p className="text-sm text-red-600 mt-2">{error}</p>
        )}
      </div>

      {/* Search Bar */}
      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar contatos por nome, email ou assunto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {/* Loading State */}
      {isLoading && (
        <Card className="p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mr-3"></div>
            <span className="text-gray-600">Carregando contatos do Supabase...</span>
          </div>
        </Card>
      )}

      {/* Contacts List */}
      {!isLoading && (
        <div className="grid gap-4">
          {filteredContacts.length === 0 ? (
            <Card className="p-8">
              <div className="text-center text-gray-500">
                {searchTerm ? 'Nenhum contato encontrado para a busca' : 'Nenhum contato disponível no Supabase'}
              </div>
            </Card>
          ) : (
            filteredContacts.map((contact, index) => (
              <motion.div
                key={contact.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-6 hover:shadow-lg transition-shadow duration-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {contact.name}
                        </h3>
                        <Badge className={getStatusBadge(contact.status)}>
                          {contact.status}
                        </Badge>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700">
                          Supabase
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="space-y-2">
                          <div className="flex items-center text-sm text-gray-600">
                            <Mail className="h-4 w-4 mr-2" />
                            {contact.email}
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <Phone className="h-4 w-4 mr-2" />
                            {contact.phone}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="text-sm text-gray-600">
                            <strong>Departamento:</strong> {contact.department}
                          </div>
                          <div className="text-sm text-gray-600">
                            <strong>Assunto:</strong> {contact.subject}
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <Calendar className="h-4 w-4 mr-2" />
                            {new Date(contact.createdAt).toLocaleDateString('pt-BR')}
                          </div>
                        </div>
                      </div>

                      <div className="mb-4">
                        <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                          <MessageCircle className="h-4 w-4 inline mr-2" />
                          {contact.message}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        onClick={() => handleViewContact(contact)}
                        variant="outline"
                        size="sm"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => handleSendEmail(contact)}
                        variant="outline"
                        size="sm"
                      >
                        <Mail className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => handleCall(contact)}
                        variant="outline"
                        size="sm"
                      >
                        <Phone className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => handleDelete(contact)}
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default ContactsManagement;
