import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Plus, Megaphone, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PermissionGuard from '@/components/admin/permissions/PermissionGuard';
import { useCampanhas, Campanha } from '@/hooks/useCampanhas';
import CampanhaCard from '@/components/admin/whatsapp/campanhas/CampanhaCard';
import NovaCampanhaModal from '@/components/admin/whatsapp/campanhas/NovaCampanhaModal';
import CampanhaDetalhesModal from '@/components/admin/whatsapp/campanhas/CampanhaDetalhesModal';
import EditarCampanhaModal from '@/components/admin/whatsapp/campanhas/EditarCampanhaModal';
import { Skeleton } from '@/components/ui/skeleton';

const WhatsAppCampanhas = () => {
  const [statusFiltro, setStatusFiltro] = useState('todos');
  const [novaCampanhaOpen, setNovaCampanhaOpen] = useState(false);
  const [detalhesOpen, setDetalhesOpen] = useState(false);
  const [editarOpen, setEditarOpen] = useState(false);
  const [campanhaSelecionada, setCampanhaSelecionada] = useState<Campanha | null>(null);
  
  const { 
    loading, 
    campanhas, 
    fetchCampanhas,
    iniciarCampanha,
    pausarCampanha,
    retomarCampanha,
    cancelarCampanha,
    duplicarCampanha,
    deleteCampanha
  } = useCampanhas();

  useEffect(() => {
    document.title = 'Campanhas WhatsApp - Admin';
    fetchCampanhas({ status: statusFiltro });
  }, [fetchCampanhas, statusFiltro]);

  // Track active campaigns status with ref to avoid infinite loop
  const hasActiveRef = useRef(false);
  
  useEffect(() => {
    hasActiveRef.current = campanhas.some(c => c.status === 'em_andamento');
  }, [campanhas]);

  // Atualização periódica para campanhas em andamento
  useEffect(() => {
    const interval = setInterval(() => {
      if (hasActiveRef.current) {
        fetchCampanhas({ status: statusFiltro });
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchCampanhas, statusFiltro]);

  const handleAbrirDetalhes = (campanha: Campanha) => {
    setCampanhaSelecionada(campanha);
    setDetalhesOpen(true);
  };

  const handleAbrirEditar = (campanha: Campanha) => {
    setCampanhaSelecionada(campanha);
    setEditarOpen(true);
  };

  const handleAcao = async (campanha: Campanha, acao: 'iniciar' | 'pausar' | 'retomar' | 'cancelar' | 'duplicar' | 'excluir') => {
    let success = false;
    switch (acao) {
      case 'iniciar':
        success = await iniciarCampanha(campanha.id);
        break;
      case 'pausar':
        success = await pausarCampanha(campanha.id);
        break;
      case 'retomar':
        success = await retomarCampanha(campanha.id);
        break;
      case 'cancelar':
        success = await cancelarCampanha(campanha.id);
        break;
      case 'duplicar':
        success = !!(await duplicarCampanha(campanha.id));
        break;
      case 'excluir':
        success = await deleteCampanha(campanha.id);
        break;
    }
    if (success) {
      fetchCampanhas({ status: statusFiltro });
    }
  };

  const stats = {
    total: campanhas.length,
    ativas: campanhas.filter(c => c.status === 'em_andamento').length,
    agendadas: campanhas.filter(c => c.status === 'agendada').length,
    concluidas: campanhas.filter(c => c.status === 'concluida').length,
  };

  return (
    <PermissionGuard permissions="admin.campanhas.visualizar" showMessage>
      <div className="flex flex-col h-full p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Megaphone className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">Campanhas WhatsApp</h1>
              <p className="text-muted-foreground text-xs sm:text-sm">
                Gerencie disparos em massa de mensagens
              </p>
            </div>
          </div>

          <PermissionGuard permissions="admin.campanhas.criar">
            <Button onClick={() => setNovaCampanhaOpen(true)} className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Nova Campanha
            </Button>
          </PermissionGuard>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-card border rounded-lg p-3 sm:p-4">
            <div className="text-xl sm:text-2xl font-bold">{stats.total}</div>
            <div className="text-xs sm:text-sm text-muted-foreground">Total</div>
          </div>
          <div className="bg-card border rounded-lg p-3 sm:p-4">
            <div className="text-xl sm:text-2xl font-bold text-green-600">{stats.ativas}</div>
            <div className="text-xs sm:text-sm text-muted-foreground">Em Andamento</div>
          </div>
          <div className="bg-card border rounded-lg p-3 sm:p-4">
            <div className="text-xl sm:text-2xl font-bold text-blue-600">{stats.agendadas}</div>
            <div className="text-xs sm:text-sm text-muted-foreground">Agendadas</div>
          </div>
          <div className="bg-card border rounded-lg p-3 sm:p-4">
            <div className="text-xl sm:text-2xl font-bold text-gray-600">{stats.concluidas}</div>
            <div className="text-xs sm:text-sm text-muted-foreground">Concluídas</div>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground sm:hidden">Filtrar:</span>
          </div>
          <Select value={statusFiltro} onValueChange={setStatusFiltro}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os status</SelectItem>
              <SelectItem value="rascunho">Rascunho</SelectItem>
              <SelectItem value="agendada">Agendada</SelectItem>
              <SelectItem value="em_andamento">Em Andamento</SelectItem>
              <SelectItem value="pausada">Pausada</SelectItem>
              <SelectItem value="concluida">Concluída</SelectItem>
              <SelectItem value="cancelada">Cancelada</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Lista de Campanhas */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-48 rounded-lg" />
              ))}
            </div>
          ) : campanhas.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Megaphone className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium">Nenhuma campanha encontrada</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Crie sua primeira campanha de disparo em massa
              </p>
              <PermissionGuard permissions="admin.campanhas.criar">
                <Button 
                  className="mt-4"
                  onClick={() => setNovaCampanhaOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Campanha
                </Button>
              </PermissionGuard>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {campanhas.map(campanha => (
                <CampanhaCard
                  key={campanha.id}
                  campanha={campanha}
                  onDetalhes={() => handleAbrirDetalhes(campanha)}
                  onEditar={() => handleAbrirEditar(campanha)}
                  onAcao={(acao) => handleAcao(campanha, acao)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modais */}
      <NovaCampanhaModal
        open={novaCampanhaOpen}
        onOpenChange={setNovaCampanhaOpen}
        onSuccess={() => {
          setNovaCampanhaOpen(false);
          fetchCampanhas({ status: statusFiltro });
        }}
      />

      {campanhaSelecionada && (
        <>
          <CampanhaDetalhesModal
            open={detalhesOpen}
            onOpenChange={setDetalhesOpen}
            campanha={campanhaSelecionada}
            onRefresh={() => fetchCampanhas({ status: statusFiltro })}
          />
          
          <EditarCampanhaModal
            open={editarOpen}
            onOpenChange={setEditarOpen}
            campanha={campanhaSelecionada}
            onSuccess={() => {
              setEditarOpen(false);
              fetchCampanhas({ status: statusFiltro });
            }}
          />
        </>
      )}
    </PermissionGuard>
  );
};

export default WhatsAppCampanhas;