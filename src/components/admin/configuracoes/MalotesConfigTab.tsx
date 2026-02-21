import { useState } from 'react';
import { Truck, Plus, Edit, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useTiposCaminhao } from '@/hooks/useTiposCaminhao';
import type { TipoCaminhao } from '@/types/malote';

const MalotesConfigTab = () => {
  const { tiposCaminhao, loading, createTipoCaminhao, updateTipoCaminhao, toggleAtivo, deleteTipoCaminhao } = useTiposCaminhao();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingTipo, setEditingTipo] = useState<TipoCaminhao | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    percentual: 30,
  });

  const handleOpenCreate = () => {
    setEditingTipo(null);
    setFormData({ nome: '', descricao: '', percentual: 30 });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (tipo: TipoCaminhao) => {
    setEditingTipo(tipo);
    setFormData({
      nome: tipo.nome,
      descricao: tipo.descricao || '',
      percentual: tipo.percentual,
    });
    setIsDialogOpen(true);
  };

  const handleOpenDelete = (id: string) => {
    setDeletingId(id);
    setIsDeleteDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.nome.trim()) return;

    if (editingTipo) {
      await updateTipoCaminhao(editingTipo.id, formData);
    } else {
      await createTipoCaminhao(formData);
    }
    setIsDialogOpen(false);
  };

  const handleDelete = async () => {
    if (deletingId) {
      await deleteTipoCaminhao(deletingId);
      setIsDeleteDialogOpen(false);
      setDeletingId(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Truck className="h-4 w-4 sm:h-5 sm:w-5" />
              Tipos de Caminhão
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm mt-1">
              Configure os tipos de caminhão e suas porcentagens de comissão
            </CardDescription>
          </div>
          <Button onClick={handleOpenCreate} size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Tipo
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : tiposCaminhao.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Truck className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Nenhum tipo de caminhão cadastrado.</p>
            <p className="text-sm">Clique em "Novo Tipo" para adicionar.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-right">Percentual</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tiposCaminhao.map((tipo) => (
                  <TableRow key={tipo.id}>
                    <TableCell className="font-medium">{tipo.nome}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {tipo.descricao || '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary">{tipo.percentual}%</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={tipo.ativo ? 'default' : 'outline'}>
                        {tipo.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleAtivo(tipo.id, !tipo.ativo)}
                          title={tipo.ativo ? 'Desativar' : 'Ativar'}
                        >
                          {tipo.ativo ? (
                            <ToggleRight className="h-4 w-4 text-success" />
                          ) : (
                            <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(tipo)}
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDelete(tipo.id)}
                          title="Excluir"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Dialog para criar/editar */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingTipo ? 'Editar Tipo de Caminhão' : 'Novo Tipo de Caminhão'}
              </DialogTitle>
              <DialogDescription>
                {editingTipo
                  ? 'Atualize as informações do tipo de caminhão.'
                  : 'Preencha os dados para criar um novo tipo de caminhão.'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData((prev) => ({ ...prev, nome: e.target.value }))}
                  placeholder="Ex: Truck, Carreta, Bitrem..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData((prev) => ({ ...prev, descricao: e.target.value }))}
                  placeholder="Descrição opcional..."
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="percentual">Percentual de Comissão (%)</Label>
                <Input
                  id="percentual"
                  type="number"
                  min={0}
                  max={100}
                  step={0.01}
                  value={formData.percentual}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, percentual: Number(e.target.value) }))
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit} disabled={!formData.nome.trim()}>
                {editingTipo ? 'Salvar' : 'Criar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog de confirmação de exclusão */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir Tipo de Caminhão?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. O tipo de caminhão será permanentemente removido.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
};

export default MalotesConfigTab;
