import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Trash2, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { requireAuthenticatedClient } from '@/config/supabaseAuth';
import { cn } from '@/lib/utils';

interface FlowVariable {
  id?: string;
  variable_key: string;
  variable_name: string;
}

interface FlowVariablesSidebarProps {
  open: boolean;
  onClose: () => void;
  flowId: string;
}

export const FlowVariablesSidebar: React.FC<FlowVariablesSidebarProps> = ({
  open,
  onClose,
  flowId
}) => {
  const { toast } = useToast();
  const [variables, setVariables] = useState<FlowVariable[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (open && flowId) {
      loadVariables();
    }
  }, [open, flowId]);

  const loadVariables = async () => {
    setLoading(true);
    try {
      const supabase = requireAuthenticatedClient();
      const { data, error } = await supabase
        .from('flow_variables')
        .select('*')
        .eq('flow_id', flowId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setVariables(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar variáveis:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as variáveis",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVariable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const newVariable: FlowVariable = {
      variable_key: searchQuery.toLowerCase().replace(/\s+/g, '_'),
      variable_name: searchQuery
    };

    try {
      const supabase = requireAuthenticatedClient();
      const { data, error } = await supabase
        .from('flow_variables')
        .insert({
          flow_id: flowId,
          variable_key: newVariable.variable_key,
          variable_name: newVariable.variable_name
        })
        .select()
        .single();

      if (error) throw error;

      setVariables(prev => [...prev, data]);
      setSearchQuery('');
      toast({
        title: "Sucesso",
        description: "Variável criada com sucesso"
      });
    } catch (error: any) {
      console.error('Erro ao criar variável:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar a variável",
        variant: "destructive"
      });
    }
  };

  const handleDeleteVariable = async (id: string) => {
    try {
      const supabase = requireAuthenticatedClient();
      const { error } = await supabase
        .from('flow_variables')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setVariables(prev => prev.filter(v => v.id !== id));
      toast({
        title: "Sucesso",
        description: "Variável removida com sucesso"
      });
    } catch (error: any) {
      console.error('Erro ao remover variável:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover a variável",
        variant: "destructive"
      });
    }
  };

  const filteredVariables = variables.filter(v =>
    v.variable_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.variable_key.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!open) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/20 z-[240]"
        onClick={onClose}
      />
      
      {/* Sidebar Panel */}
      <div 
        className={cn(
          "fixed right-0 top-0 h-full bg-background border-l shadow-lg z-[250] rounded-l-lg",
          "w-[500px] animate-in slide-in-from-right duration-300"
        )}
      >
        <div className="flex flex-col w-full h-full p-6 gap-4">
          {/* Close Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute right-2 top-2 h-9 w-9"
          >
            <X className="h-4 w-4" />
          </Button>

          {/* Title */}
          <h2 className="text-md font-medium">Variáveis</h2>

          {/* Search/Create Input */}
          <form onSubmit={handleCreateVariable} className="flex items-center gap-2">
            <Input
              placeholder="Buscar ou criar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10"
            />
            {searchQuery && !filteredVariables.some(v => v.variable_name.toLowerCase() === searchQuery.toLowerCase()) && (
              <Button type="submit" size="icon" variant="ghost" className="shrink-0">
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </form>

          {/* Variables List */}
          <div className="flex flex-col gap-2 overflow-y-auto py-1 flex-1">
            {loading ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Carregando variáveis...
              </p>
            ) : filteredVariables.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                {searchQuery ? 'Nenhuma variável encontrada. Pressione Enter para criar.' : 'Nenhuma variável configurada'}
              </p>
            ) : (
              filteredVariables.map((variable) => (
                <div 
                  key={variable.id} 
                  className="flex items-center gap-2 justify-between pl-1 group"
                >
                  <span className="flex-1 text-sm truncate">
                    {variable.variable_name}
                  </span>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                    onClick={() => variable.id && handleDeleteVariable(variable.id)}
                    aria-label="Deletar"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
};
