import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Key, Plus, Edit, Trash2, Eye, EyeOff, Save, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { secretService, Secret } from '@/services/supabase/secretService';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface SecretManagementProps {
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

const SecretManagement = ({ loading, setLoading }: SecretManagementProps) => {
  const { toast } = useToast();
  const [secrets, setSecrets] = useState<Secret[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSecret, setEditingSecret] = useState<Secret | null>(null);
  const [visibleSecrets, setVisibleSecrets] = useState<Set<number>>(new Set());
  
  const [formData, setFormData] = useState({
    name: '',
    value: ''
  });

  const loadSecrets = async () => {
    try {
      setLoading(true);
      const data = await secretService.getSecrets();
      setSecrets(data);
    } catch (error) {
      console.error('Erro ao carregar secrets:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os secrets",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSecrets();
  }, []);

  const handleSaveSecret = async () => {
    if (!formData.name || !formData.value) {
      toast({
        title: "Erro",
        description: "Nome e valor são obrigatórios",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      
      if (editingSecret) {
        await secretService.updateSecret(editingSecret.id!, formData);
        toast({
          title: "Sucesso",
          description: "Secret atualizado com sucesso!"
        });
      } else {
        await secretService.saveSecret(formData);
        toast({
          title: "Sucesso",
          description: "Secret salvo com sucesso!"
        });
      }
      
      setFormData({ name: '', value: '' });
      setEditingSecret(null);
      setIsDialogOpen(false);
      await loadSecrets();
    } catch (error) {
      console.error('Erro ao salvar secret:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o secret",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditSecret = (secret: Secret) => {
    setEditingSecret(secret);
    setFormData({
      name: secret.name,
      value: secret.value
    });
    setIsDialogOpen(true);
  };

  const handleDeleteSecret = async (id: number) => {
    try {
      setLoading(true);
      await secretService.deleteSecret(id);
      toast({
        title: "Sucesso",
        description: "Secret removido com sucesso!"
      });
      await loadSecrets();
    } catch (error) {
      console.error('Erro ao deletar secret:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover o secret",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleSecretVisibility = (id: number) => {
    const newVisible = new Set(visibleSecrets);
    if (newVisible.has(id)) {
      newVisible.delete(id);
    } else {
      newVisible.add(id);
    }
    setVisibleSecrets(newVisible);
  };

  const openNewSecretDialog = () => {
    setEditingSecret(null);
    setFormData({ name: '', value: '' });
    setIsDialogOpen(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Gerenciamento de Secrets
              </CardTitle>
              <CardDescription>
                Gerencie chaves secretas e configurações sensíveis do sistema
              </CardDescription>
            </div>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openNewSecretDialog}>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Secret
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingSecret ? 'Editar Secret' : 'Novo Secret'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingSecret 
                      ? 'Atualize as informações do secret' 
                      : 'Adicione um novo secret ao sistema'
                    }
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nome*</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Ex: API_KEY_OPENAI"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="value">Valor*</Label>
                    <Input
                      id="value"
                      type="password"
                      value={formData.value}
                      onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                      placeholder="Valor do secret"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end gap-2 mt-6">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                    disabled={loading}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancelar
                  </Button>
                  <Button onClick={handleSaveSecret} disabled={loading}>
                    <Save className="h-4 w-4 mr-2" />
                    {editingSecret ? 'Atualizar' : 'Salvar'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        
        <CardContent>
          {secrets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Key className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum secret configurado</p>
              <p className="text-sm">Clique em "Novo Secret" para adicionar</p>
            </div>
          ) : (
            <div className="space-y-4">
              {secrets.map((secret) => (
                <div key={secret.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium">{secret.name}</h4>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-sm text-muted-foreground">Valor:</span>
                        <code className="text-sm bg-muted px-2 py-1 rounded">
                          {visibleSecrets.has(secret.id!) 
                            ? secret.value 
                            : '••••••••••••••••'
                          }
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleSecretVisibility(secret.id!)}
                        >
                          {visibleSecrets.has(secret.id!) ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditSecret(secret)}
                        disabled={loading}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={loading}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirmar remoção</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja remover o secret "{secret.name}"? 
                              Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteSecret(secret.id!)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Remover
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default SecretManagement;