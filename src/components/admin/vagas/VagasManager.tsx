import React, { useState } from 'react';
import { Plus, Loader2, Briefcase, Search, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import VagaForm from './VagaForm';
import VagasTable from './VagasTable';
import CandidaturasViewer from './CandidaturasViewer';
import { useAllVagas, useCreateVaga, useUpdateVaga, useDeleteVaga } from '@/hooks/useVagas';
import { VagaEmprego, CreateVagaData } from '@/types/vagas';

const ITEMS_PER_PAGE = 10;

const VagasManager: React.FC = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingVaga, setEditingVaga] = useState<VagaEmprego | undefined>();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [candidaturasVaga, setCandidaturasVaga] = useState<VagaEmprego | null>(null);

  const { data: vagas, isLoading } = useAllVagas();
  const createVaga = useCreateVaga();
  const updateVaga = useUpdateVaga();
  const deleteVaga = useDeleteVaga();

  // Filtrar vagas pelo termo de busca
  const filteredVagas = vagas?.filter(vaga => 
    vaga.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vaga.cidade.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Paginação
  const totalPages = Math.ceil(filteredVagas.length / ITEMS_PER_PAGE);
  const paginatedVagas = filteredVagas.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Reset page when search changes
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  // Estatísticas
  const totalVagas = vagas?.length || 0;
  const vagasAtivas = vagas?.filter(v => v.ativo).length || 0;
  const vagasInativas = totalVagas - vagasAtivas;

  const handleCreate = () => {
    setEditingVaga(undefined);
    setIsFormOpen(true);
  };

  const handleEdit = (vaga: VagaEmprego) => {
    setEditingVaga(vaga);
    setIsFormOpen(true);
  };

  const handleSubmit = async (data: CreateVagaData) => {
    if (editingVaga) {
      await updateVaga.mutateAsync({ id: editingVaga.id, data, dadosAnteriores: editingVaga });
    } else {
      await createVaga.mutateAsync(data);
    }
    setIsFormOpen(false);
    setEditingVaga(undefined);
  };

  const handleDelete = async (vaga: VagaEmprego) => {
    await deleteVaga.mutateAsync({ id: vaga.id, dadosAnteriores: vaga });
  };

  const handleToggleAtivo = async (vaga: VagaEmprego) => {
    await updateVaga.mutateAsync({
      id: vaga.id,
      data: { ativo: !vaga.ativo },
      dadosAnteriores: vaga
    });
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingVaga(undefined);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
            <Briefcase className="w-7 h-7 text-primary" />
            Vagas de Emprego
          </h2>
          <p className="text-muted-foreground mt-1">
            Gerencie as vagas exibidas na página Trabalhe Conosco
          </p>
        </div>
        <Button onClick={handleCreate} size="lg" className="w-full sm:w-auto">
          <Plus className="w-5 h-5 mr-2" />
          Nova Vaga
        </Button>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              Total de Vagas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">{totalVagas}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="w-4 h-4 text-green-600" />
              Vagas Ativas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{vagasAtivas}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-orange-600" />
              Vagas Inativas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-orange-600">{vagasInativas}</p>
          </CardContent>
        </Card>
      </div>

      {/* Barra de Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por título ou cidade..."
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-10 max-w-md"
        />
      </div>

      {/* Tabela */}
      <Card>
        <CardContent className="p-0">
          <VagasTable
            vagas={paginatedVagas}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onToggleAtivo={handleToggleAtivo}
            onViewCandidaturas={(vaga) => setCandidaturasVaga(vaga)}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </CardContent>
      </Card>

      {/* Candidaturas Viewer */}
      {candidaturasVaga && (
        <CandidaturasViewer
          vagaId={candidaturasVaga.id}
          vagaTitulo={candidaturasVaga.titulo}
          open={!!candidaturasVaga}
          onClose={() => setCandidaturasVaga(null)}
        />
      )}

      {/* Modal de Formulário com Scroll */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4 border-b flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-primary" />
              {editingVaga ? 'Editar Vaga' : 'Nova Vaga'}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <VagaForm
              vaga={editingVaga}
              onSubmit={handleSubmit}
              onCancel={handleCloseForm}
              isLoading={createVaga.isPending || updateVaga.isPending}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VagasManager;
