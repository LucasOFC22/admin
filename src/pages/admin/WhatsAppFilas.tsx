import React, { useState, useEffect, useReducer } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, Edit, Trash2, ArrowLeft, Layers, User, Palette, ListOrdered, MessageSquare, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from '@/lib/toast';

import PageHeader from "@/components/admin/PageHeader";
import ConfirmationModal from "@/components/whaticket/ConfirmationModal";
import { requireAuthenticatedClient } from "@/config/supabaseAuth";
import { usePermissionGuard } from "@/hooks/usePermissionGuard";
import PermissionGuard from "@/components/admin/permissions/PermissionGuard";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { HexColorPicker } from "react-colorful";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface Fila {
  id: number;
  name: string;
  color: string;
  description: string | null;
  active: boolean;
  order_position: number | null;
  created_at: string;
  updated_at: string;
}

interface FilaFormData {
  name: string;
  color: string;
  description: string;
  active: boolean;
  order_position: number | null;
}

const reducer = (state: Fila[], action: any): Fila[] => {
  switch (action.type) {
    case "LOAD_FILAS":
      return action.payload;
    case "UPDATE_FILA": {
      const fila = action.payload;
      const filaIndex = state.findIndex((s) => s.id === fila.id);
      if (filaIndex !== -1) {
        const newState = [...state];
        newState[filaIndex] = fila;
        return newState;
      }
      return [fila, ...state];
    }
    case "DELETE_FILA": {
      const filaId = action.payload;
      return state.filter((s) => s.id !== filaId);
    }
    case "RESET":
      return [];
    default:
      return state;
  }
};

const COLORS = [
  "#f44336", "#e91e63", "#9c27b0", "#673ab7",
  "#3f51b5", "#2196f3", "#03a9f4", "#00bcd4",
  "#009688", "#4caf50", "#8bc34a", "#cddc39",
  "#ffeb3b", "#ffc107", "#ff9800", "#ff5722",
];

const WhatsAppFilas: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [deletingFila, setDeletingFila] = useState<Fila | null>(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [searchParam, setSearchParam] = useState("");
  const [filas, dispatch] = useReducer(reducer, []);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingFila, setEditingFila] = useState<Fila | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [formData, setFormData] = useState<FilaFormData>({
    name: "",
    color: "#3f51b5",
    description: "",
    active: true,
    order_position: null,
  });
  
  // Permissões
  const { hasPermission } = usePermissionGuard();
  const canCreate = hasPermission('admin.whatsapp.filas.criar');
  const canEdit = hasPermission('admin.whatsapp.filas.editar');
  const canDelete = hasPermission('admin.whatsapp.filas.excluir');

  useEffect(() => {
    setLoading(true);
    const delayDebounceFn = setTimeout(() => {
      fetchFilas();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchParam]);

  const fetchFilas = async () => {
    try {
      const supabase = requireAuthenticatedClient();
      let query = supabase
        .from("filas_whatsapp")
        .select("*")
        .order("order_position", { ascending: true });

      if (searchParam) {
        query = query.ilike("name", `%${searchParam}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      dispatch({ type: "LOAD_FILAS", payload: data || [] });
      setLoading(false);
    } catch (error) {
      console.error("Erro ao buscar filas:", error);
      toast.error("Erro ao carregar filas");
      setLoading(false);
    }
  };

  const handleOpenForm = (fila?: Fila) => {
    if (fila) {
      setEditingFila(fila);
      setFormData({
        name: fila.name,
        color: fila.color || "#3f51b5",
        description: fila.description || "",
        active: fila.active ?? true,
        order_position: fila.order_position,
      });
    } else {
      setEditingFila(null);
      setFormData({
        name: "",
        color: "#3f51b5",
        description: "",
        active: true,
        order_position: null,
      });
    }
    setFormModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }

    if (!formData.color.trim()) {
      toast.error("Cor é obrigatória");
      return;
    }

    try {
      const supabase = requireAuthenticatedClient();
      if (editingFila) {
        const { error } = await supabase
          .from("filas_whatsapp")
          .update({
            name: formData.name,
            color: formData.color,
            description: formData.description || null,
            active: formData.active,
            order_position: formData.order_position,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingFila.id);

        if (error) throw error;
        toast.success("Fila atualizada com sucesso!");
      } else {
        const { error } = await supabase.from("filas_whatsapp").insert({
          name: formData.name,
          color: formData.color,
          description: formData.description || null,
          active: formData.active,
          order_position: formData.order_position,
        });

        if (error) throw error;
        toast.success("Fila criada com sucesso!");
      }

      setFormModalOpen(false);
      fetchFilas();
    } catch (error) {
      console.error("Erro ao salvar fila:", error);
      toast.error("Erro ao salvar fila");
    }
  };

  const handleDeleteFila = async (filaId: number) => {
    try {
      const supabase = requireAuthenticatedClient();
      const { error } = await supabase
        .from("filas_whatsapp")
        .delete()
        .eq("id", filaId);

      if (error) throw error;

      toast.success("Fila deletada com sucesso!");
      dispatch({ type: "DELETE_FILA", payload: filaId });
    } catch (error) {
      console.error("Erro ao deletar fila:", error);
      toast.error("Erro ao deletar fila");
    }
    setDeletingFila(null);
  };

  return (
    <>
      <PermissionGuard 
        permissions="admin.whatsapp.filas.visualizar"
        showMessage={true}
      >
        <div className="flex flex-col h-full">
          <PageHeader
          title={`Filas WhatsApp (${filas.length})`}
          subtitle="Gerencie as filas de atendimento do WhatsApp"
          icon={Layers}
          breadcrumbs={[
            { label: "Dashboard", href: "/" },
            { label: "WhatsApp", href: "/whatsapp" },
            { label: "Filas" },
          ]}
          actions={
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar filas..."
                  value={searchParam}
                  onChange={(e) => setSearchParam(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              {canCreate && (
                <Button onClick={() => handleOpenForm()} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar
                </Button>
              )}
              <Button
                onClick={() => navigate("/whatsapp")}
                variant="outline"
                size="sm"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </div>
          }
        />

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {loading ? (
              <Card>
                <CardContent className="p-6">
                  <p className="text-muted-foreground">Carregando...</p>
                </CardContent>
              </Card>
            ) : filas.length === 0 ? (
              <Card>
                <CardContent className="p-6">
                  <p className="text-muted-foreground">Nenhuma fila encontrada</p>
                </CardContent>
              </Card>
            ) : (
              filas.map((fila) => (
                <Card
                  key={fila.id}
                  className="border-2 hover:shadow-lg transition-shadow"
                  style={{ borderColor: fila.color }}
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col gap-4">
                      <div
                        className="px-3 py-2 rounded text-white text-sm font-bold text-center"
                        style={{ backgroundColor: fila.color }}
                      >
                        {fila.name}
                      </div>
                      {fila.description && (
                        <p className="text-center text-muted-foreground text-sm line-clamp-2">
                          {fila.description}
                        </p>
                      )}
                      <div className="flex items-center justify-center gap-2 flex-wrap">
                        <span
                          className={`px-2 py-1 text-xs rounded font-medium ${
                            fila.active
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                          }`}
                        >
                          {fila.active ? "Ativa" : "Inativa"}
                        </span>
                        {fila.order_position !== null && (
                          <span className="px-2 py-1 text-xs rounded bg-muted text-muted-foreground">
                            Ordem: {fila.order_position}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2 justify-center">
                        {canEdit && (
                          <Button
                            size="sm"
                            onClick={() => handleOpenForm(fila)}
                            className="gap-2"
                          >
                            <Edit className="h-4 w-4" />
                            Editar
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              setConfirmModalOpen(true);
                              setDeletingFila(fila);
                            }}
                            className="gap-2"
                          >
                            <Trash2 className="h-4 w-4" />
                            Excluir
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal de Confirmação de Exclusão */}
      <ConfirmationModal
        title={deletingFila ? `Deletar fila "${deletingFila.name}"?` : ""}
        open={confirmModalOpen}
        onClose={setConfirmModalOpen}
        onConfirm={() => deletingFila && handleDeleteFila(deletingFila.id)}
      >
        Tem certeza que deseja deletar esta fila? Esta ação não pode ser
        desfeita.
      </ConfirmationModal>

      {/* Modal de Formulário */}
      <Dialog open={formModalOpen} onOpenChange={setFormModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">
              {editingFila ? "Editar fila" : "Adicionar fila"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-4">
            {/* Nome */}
            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-muted-foreground mt-2.5" />
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="name" className="text-sm font-medium">
                  Nome *
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Nome da fila"
                  className={!formData.name.trim() ? "border-destructive" : ""}
                />
                {!formData.name.trim() && (
                  <p className="text-xs text-destructive">Obrigatório</p>
                )}
              </div>
            </div>

            {/* Cor e Ordem */}
            <div className="flex gap-4">
              {/* Cor */}
              <div className="flex items-start gap-3 flex-1">
                <Palette className="h-5 w-5 text-muted-foreground mt-2.5" />
                <div className="flex-1 space-y-1.5">
                  <Label htmlFor="color" className="text-sm font-medium">
                    Cor *
                  </Label>
                  <div className="flex gap-2">
                    <Popover open={showColorPicker} onOpenChange={setShowColorPicker}>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className="w-10 h-10 rounded border-2 border-border flex-shrink-0"
                          style={{ backgroundColor: formData.color }}
                        />
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-3 color-picker-popover" align="start">
                        <HexColorPicker
                          color={formData.color}
                          onChange={(color) => setFormData({ ...formData, color })}
                        />
                        <div className="grid grid-cols-8 gap-1 mt-3">
                          {COLORS.map((color) => (
                            <button
                              key={color}
                              type="button"
                              className={`w-6 h-6 rounded border transition-transform ${
                                formData.color === color
                                  ? "border-foreground scale-110"
                                  : "border-transparent"
                              }`}
                              style={{ backgroundColor: color }}
                              onClick={() => setFormData({ ...formData, color })}
                            />
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                    <Input
                      id="color"
                      value={formData.color}
                      onChange={(e) =>
                        setFormData({ ...formData, color: e.target.value })
                      }
                      placeholder="#3f51b5"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              {/* Ordem */}
              <div className="flex items-start gap-3 flex-1">
                <ListOrdered className="h-5 w-5 text-muted-foreground mt-2.5" />
                <div className="flex-1 space-y-1.5">
                  <Label htmlFor="order" className="text-sm font-medium">
                    Ordem (Bot)
                  </Label>
                  <Input
                    id="order"
                    type="number"
                    value={formData.order_position ?? ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        order_position: e.target.value ? parseInt(e.target.value) : null,
                      })
                    }
                    placeholder="Ex: 1, 2, 3..."
                  />
                </div>
              </div>
            </div>

            {/* Ativo */}
            <div className="flex items-center gap-3">
              <Settings className="h-5 w-5 text-muted-foreground" />
              <div className="flex items-center justify-between flex-1">
                <Label htmlFor="active" className="text-sm font-medium">
                  Fila ativa
                </Label>
                <Switch
                  id="active"
                  checked={formData.active}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, active: checked })
                  }
                />
              </div>
            </div>

            {/* Descrição / Mensagem de Saudação */}
            <div className="flex items-start gap-3">
              <MessageSquare className="h-5 w-5 text-muted-foreground mt-2.5" />
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="description" className="text-sm font-medium">
                  Mensagem de saudação
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Mensagem exibida ao cliente quando entrar nesta fila"
                  rows={4}
                  className="resize-none"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setFormModalOpen(false)}
              className="gap-2"
              style={{ 
                backgroundColor: "hsl(var(--destructive) / 0.1)", 
                color: "hsl(var(--destructive))",
                borderColor: "hsl(var(--destructive) / 0.3)"
              }}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSave}
              className="gap-2"
            >
              {editingFila ? "Salvar" : "Adicionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </PermissionGuard>
    </>
  );
};

export default WhatsAppFilas;
