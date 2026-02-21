import React, { useState, useEffect, useReducer } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, Edit, Trash2, ArrowLeft, Package, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from '@/lib/toast';
import PageHeader from "@/components/admin/PageHeader";
import ConfirmationModal from "@/components/whaticket/ConfirmationModal";
import TagModal from "@/components/tags/TagModal";
import { tagService, Tag } from "@/services/supabase/tagService";
import { usePermissionGuard } from "@/hooks/usePermissionGuard";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import PermissionGuard from "@/components/admin/permissions/PermissionGuard";

interface TagWithCount extends Tag {
  ticketCount?: number;
}

const reducer = (state: TagWithCount[], action: any): TagWithCount[] => {
  switch (action.type) {
    case "LOAD_TAGS":
      return action.payload;
    case "UPDATE_TAGS": {
      const tag = action.payload;
      const tagIndex = state.findIndex((s) => s.id === tag.id);
      if (tagIndex !== -1) {
        const newState = [...state];
        newState[tagIndex] = tag;
        return newState;
      }
      return [tag, ...state];
    }
    case "DELETE_TAGS": {
      const tagId = action.payload;
      return state.filter((s) => s.id !== tagId);
    }
    case "RESET":
      return [];
    default:
      return state;
  }
};

const TagsKanban: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [deletingTag, setDeletingTag] = useState<TagWithCount | null>(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [tagModalOpen, setTagModalOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<TagWithCount | null>(null);
  const [searchParam, setSearchParam] = useState("");
  const [tags, dispatch] = useReducer(reducer, []);
  const { hasPermission } = usePermissionGuard();

  const canCreate = hasPermission('admin.tags-kanban.criar');
  const canEdit = hasPermission('admin.tags-kanban.editar');
  const canDelete = hasPermission('admin.tags-kanban.excluir');

  useEffect(() => {
    setLoading(true);
    const delayDebounceFn = setTimeout(() => {
      fetchTags();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchParam]);

  const fetchTags = async () => {
    try {
      const data = await tagService.getTags(1);
      const filteredData = searchParam
        ? data.filter((tag) =>
            tag.name.toLowerCase().includes(searchParam.toLowerCase())
          )
        : data;
      dispatch({ type: "LOAD_TAGS", payload: filteredData });
      setLoading(false);
    } catch (error) {
      console.error('Erro ao buscar tags:', error);
      toast.error('Erro ao carregar tags');
      setLoading(false);
    }
  };

  const handleEditTag = (tag: TagWithCount) => {
    if (!canEdit) {
      toast.error('Você não tem permissão para editar tags');
      return;
    }
    setEditingTag(tag);
    setTagModalOpen(true);
  };

  const handleCreateTag = () => {
    if (!canCreate) {
      toast.error('Você não tem permissão para criar tags');
      return;
    }
    setEditingTag(null);
    setTagModalOpen(true);
  };

  const handleSaveTag = async (tagData: { name: string; color: string }) => {
    try {
      if (editingTag) {
        if (!canEdit) {
          toast.error('Você não tem permissão para editar tags');
          return;
        }
        const updated = await tagService.updateTag(editingTag.id, tagData);
        dispatch({ type: "UPDATE_TAGS", payload: updated });
        toast.success('Tag atualizada com sucesso!');
      } else {
        if (!canCreate) {
          toast.error('Você não tem permissão para criar tags');
          return;
        }
        const created = await tagService.createTag({ ...tagData, kanban: 1 });
        dispatch({ type: "UPDATE_TAGS", payload: created });
        toast.success('Tag criada com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao salvar tag:', error);
      toast.error('Erro ao salvar tag');
    }
  };

  const handleDeleteTag = async (tagId: number) => {
    if (!canDelete) {
      toast.error('Você não tem permissão para excluir tags');
      return;
    }
    try {
      await tagService.deleteTag(tagId);
      toast.success('Tag deletada com sucesso!');
      dispatch({ type: "DELETE_TAGS", payload: tagId });
      setSearchParam("");
    } catch (error) {
      console.error('Erro ao deletar tag:', error);
      toast.error('Erro ao deletar tag');
    }
    setDeletingTag(null);
  };

  const openDeleteConfirm = (tag: TagWithCount) => {
    if (!canDelete) {
      toast.error('Você não tem permissão para excluir tags');
      return;
    }
    setConfirmModalOpen(true);
    setDeletingTag(tag);
  };

  return (
    <PermissionGuard 
      permissions="admin.tags-kanban.visualizar"
      showMessage={true}
    >
      <div className="flex flex-col h-full">
          <PageHeader
          title={`Tags Kanban (${tags.length})`}
          subtitle="Gerencie as tags do sistema Kanban"
          icon={Package}
          breadcrumbs={[
            { label: "Dashboard", href: "/" },
            { label: "WhatsApp", href: "/whatsapp" },
            { label: "Tags Kanban" }
          ]}
          actions={
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar tags..."
                  value={searchParam}
                  onChange={(e) => setSearchParam(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Button
                        onClick={handleCreateTag}
                        size="sm"
                        disabled={!canCreate}
                      >
                        {canCreate ? <Plus className="h-4 w-4 mr-2" /> : <Lock className="h-4 w-4 mr-2" />}
                        Adicionar
                      </Button>
                    </span>
                  </TooltipTrigger>
                  {!canCreate && (
                    <TooltipContent>
                      <p>Você não tem permissão para criar tags</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
              <Button
                onClick={() => navigate('/whatsapp-kanban')}
                variant="outline"
                size="sm"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar para o Kanban
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
            ) : (
              tags.map((tag) => (
                <Card key={tag.id} className="border-2" style={{ borderColor: tag.color }}>
                  <CardContent className="p-6">
                    <div className="flex flex-col gap-4">
                      <div
                        className="px-3 py-1 rounded text-white text-sm font-bold text-center"
                        style={{ backgroundColor: tag.color }}
                      >
                        {tag.name}
                      </div>
                      <p className="text-center text-muted-foreground">
                        Tickets: {tag.ticketCount || 0}
                      </p>
                      <div className="flex gap-2 justify-center">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span>
                                <Button
                                  size="sm"
                                  onClick={() => handleEditTag(tag)}
                                  className="gap-2"
                                  disabled={!canEdit}
                                >
                                  {canEdit ? <Edit className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                                  Editar
                                </Button>
                              </span>
                            </TooltipTrigger>
                            {!canEdit && (
                              <TooltipContent>
                                <p>Você não tem permissão para editar tags</p>
                              </TooltipContent>
                            )}
                          </Tooltip>
                        </TooltipProvider>
                        
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => openDeleteConfirm(tag)}
                                  className="gap-2"
                                  disabled={!canDelete}
                                >
                                  {canDelete ? <Trash2 className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                                  Excluir
                                </Button>
                              </span>
                            </TooltipTrigger>
                            {!canDelete && (
                              <TooltipContent>
                                <p>Você não tem permissão para excluir tags</p>
                              </TooltipContent>
                            )}
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>

      <ConfirmationModal
        title={deletingTag ? `Deletar tag "${deletingTag.name}"?` : ""}
        open={confirmModalOpen}
        onClose={setConfirmModalOpen}
        onConfirm={() => deletingTag && handleDeleteTag(deletingTag.id)}
      >
        Tem certeza que deseja deletar esta tag? Esta ação não pode ser desfeita.
      </ConfirmationModal>

      {(canCreate || canEdit) && (
          <TagModal
            open={tagModalOpen}
            onClose={() => setTagModalOpen(false)}
            onSave={handleSaveTag}
            initialData={editingTag ? { name: editingTag.name, color: editingTag.color } : undefined}
            isEditing={!!editingTag}
        />
      )}
    </PermissionGuard>
  );
};

export default TagsKanban;
