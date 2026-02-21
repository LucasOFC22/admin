import { useState } from 'react';
import { motion } from 'framer-motion';

import PageHeader from '@/components/admin/PageHeader';
import ContactCard from '@/components/admin/contacts/ContactCard';
import ContactsFilters from '@/components/admin/contacts/ContactsFilters';
import ContactsStats from '@/components/admin/contacts/ContactsStats';
import { useAdminContacts } from '@/hooks/useAdminContacts';
import { MessageSquare } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import PermissionGuard from '@/components/admin/permissions/PermissionGuard';

const AdminContacts = () => {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('todos');
  const { contacts, isLoading, stats, updateContactStatus, deleteContact, refetch } = useAdminContacts({
    status,
    search
  });

  const breadcrumbs = [
    { label: 'Admin' },
    { label: 'Contatos' }
  ];

  return (
    <>
      <PermissionGuard 
        permissions="admin.contatos.visualizar"
        showMessage={true}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <PageHeader
          title="Gerenciar Contatos"
          subtitle="Visualize e gerencie as solicitações de contato recebidas"
          icon={MessageSquare}
          breadcrumbs={breadcrumbs}
        />

        <div className="p-6 space-y-6">
          {/* Estatísticas */}
          <ContactsStats stats={stats} />

          {/* Filtros */}
          <ContactsFilters
            search={search}
            status={status}
            onSearchChange={setSearch}
            onStatusChange={setStatus}
            onRefresh={refetch}
            isLoading={isLoading}
          />

          {/* Lista de Contatos */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="space-y-4">
                  <Skeleton className="h-[300px] w-full rounded-lg" />
                </div>
              ))}
            </div>
          ) : contacts.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Nenhum contato encontrado
              </h3>
              <p className="text-muted-foreground">
                {search || status !== 'todos' 
                  ? 'Tente ajustar os filtros de busca' 
                  : 'Novos contatos aparecerão aqui quando forem recebidos'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {contacts.map((contact) => (
                <ContactCard
                  key={contact.contact_id}
                  contact={contact}
                  onUpdateStatus={updateContactStatus}
                  onDelete={deleteContact}
                />
              ))}
              </div>
            )}
          </div>
        </motion.div>
      </PermissionGuard>
    </>
  );
};

export default AdminContacts;
