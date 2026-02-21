import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { UsuarioComCargo } from '@/hooks/useUnifiedUsers';
import { Cargo } from '@/types/database';
import { z } from 'zod';
import { User, Mail, Phone, CreditCard, Briefcase, Shield, UserCheck, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import FilasSelector from '@/components/admin/usuarios/components/FilasSelector';
import TagsSelector from '@/components/admin/usuarios/components/TagsSelector';
import UserEmailAccountsSection from './UserEmailAccountsSection';
import CnpjCpfChipsInput from './CnpjCpfChipsInput';
import { useEmailContaUsuarios } from '@/hooks/useEmailContaUsuarios';

const userSchema = z.object({
  nome: z.string().trim().min(3, 'Nome deve ter no mínimo 3 caracteres').max(100, 'Nome muito longo'),
  email: z.string().trim().email('Email inválido').max(255, 'Email muito longo'),
  telefone: z.string().optional(),
  cnpjcpf: z.array(z.string()).optional(),
  cnpjcpf_atual: z.string().optional(),
  cargo: z.number({
    required_error: 'Selecione um cargo'
  }),
  acesso_area_cliente: z.boolean(),
  acesso_area_admin: z.boolean(),
  ativo: z.boolean(),
  filas: z.array(z.number()).optional(),
  tags: z.array(z.number()).optional()
});
interface UnifiedUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: UsuarioComCargo;
  cargos: Cargo[];
  onSave: (userData: any) => Promise<void>;
  loading?: boolean;
}
const UnifiedUserModal = ({
  isOpen,
  onClose,
  user,
  cargos,
  onSave,
  loading = false
}: UnifiedUserModalProps) => {
  const {
    user: currentUser
  } = useUnifiedAuth();
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    cnpjcpf: [] as string[],
    cnpjcpf_atual: '' as string,
    autoSelectFirst: true,
    cargo: 0,
    acesso_area_cliente: false,
    acesso_area_admin: false,
    ativo: true,
    filas: [] as number[],
    tags: [] as number[]
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  
  // Estado para contas de email
  const [emailAccountIds, setEmailAccountIds] = useState<string[]>([]);
  const [defaultEmailAccountId, setDefaultEmailAccountId] = useState<string | undefined>();
  
  // Hook para gerenciar vínculos de email - usar id da tabela usuarios (não supabase_id)
  // Só habilitar se tiver id válido (edição de usuário existente)
  const usuarioIdStr = user?.id?.toString();
  const { vinculos, atualizarVinculos, tableExists: emailTableExists } = useEmailContaUsuarios(
    usuarioIdStr, 
    isOpen && !!usuarioIdStr
  );

  // Nível hierárquico do usuário logado (quanto maior o número, mais alto na hierarquia)
  const currentUserLevel = currentUser?.nivel_hierarquico || 1;
  const maxAllowedLevel = currentUserLevel;
  
  // Ref para controlar sincronização de vínculos
  const lastSyncedUserIdRef = useRef<number | undefined>();
  const lastVinculosRef = useRef<string>('');
  
  // Efeito para dados do formulário - só executa quando modal está aberto
  useEffect(() => {
    if (!isOpen) return;
    
    if (user) {
      // Converter para array de strings - suporta novo formato objeto ou array legado
      let cnpjcpfValue: string[] = [];
      let cnpjcpfAtual = '';
      if (user.cnpjcpf) {
        if (Array.isArray(user.cnpjcpf)) {
          cnpjcpfValue = user.cnpjcpf;
          cnpjcpfAtual = user.cnpjcpf[0] || '';
        } else if (typeof user.cnpjcpf === 'object' && 'cnpjcpf' in user.cnpjcpf) {
          const obj = user.cnpjcpf as { cnpjcpf: string[]; cnpjcpf_atual?: string };
          cnpjcpfValue = obj.cnpjcpf;
          cnpjcpfAtual = obj.cnpjcpf_atual || obj.cnpjcpf[0] || '';
        }
      }
      setFormData({
        nome: user.nome || '',
        email: user.email || '',
        telefone: user.telefone || '',
        cnpjcpf: cnpjcpfValue,
        cnpjcpf_atual: cnpjcpfAtual,
        autoSelectFirst: !cnpjcpfAtual || cnpjcpfAtual === cnpjcpfValue[0],
        cargo: user.cargo || 0,
        acesso_area_cliente: user.acesso_area_cliente || false,
        acesso_area_admin: user.acesso_area_admin || false,
        ativo: user.ativo !== false,
        filas: user.filas || [],
        tags: user.tags || []
      });
    } else {
      setFormData({
        nome: '',
        email: '',
        telefone: '',
        cnpjcpf: [],
        cnpjcpf_atual: '',
        autoSelectFirst: true,
        cargo: 0,
        acesso_area_cliente: false,
        acesso_area_admin: false,
        ativo: true,
        filas: [],
        tags: []
      });
      setEmailAccountIds([]);
      setDefaultEmailAccountId(undefined);
      // Reset refs quando fechamos/abrimos para novo usuário
      lastSyncedUserIdRef.current = undefined;
      lastVinculosRef.current = '';
    }
    setErrors({});
  }, [user?.id, isOpen]);
  
  // Efeito separado para vínculos de email - compara conteúdo, não referência
  useEffect(() => {
    if (!isOpen || !user || !vinculos) return;
    
    // Cria uma chave única baseada no conteúdo dos vínculos
    const vinculosKey = vinculos.map(v => `${v.email_conta_id}:${v.padrao}`).sort().join(',');
    
    // Só sincronizar se o usuário ou os vínculos realmente mudaram
    if (lastSyncedUserIdRef.current === user.id && lastVinculosRef.current === vinculosKey) {
      return;
    }
    
    lastSyncedUserIdRef.current = user.id;
    lastVinculosRef.current = vinculosKey;
    
    const newIds = vinculos.map(v => v.email_conta_id);
    const padrao = vinculos.find(v => v.padrao);
    
    setEmailAccountIds(newIds);
    setDefaultEmailAccountId(padrao?.email_conta_id);
  }, [vinculos, user?.id, isOpen]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    try {
      // Determinar cnpjcpf_atual
      const cnpjcpfAtual = formData.autoSelectFirst 
        ? formData.cnpjcpf[0] || ''
        : formData.cnpjcpf_atual;
      
      // Validar dados
      const validatedData = userSchema.parse({
        ...formData,
        cnpjcpf_atual: cnpjcpfAtual
      });
      setSaving(true);
      
      // Salvar dados do usuário
      await onSave(validatedData);
      
      // Se é edição e tabela de email existe, atualizar vínculos de email
      if (user?.id && emailTableExists) {
        await atualizarVinculos(emailAccountIds, defaultEmailAccountId);
      }
      
      onClose();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach(err => {
          if (err.path[0]) {
            fieldErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(fieldErrors);
      } else {
        console.error('Erro ao salvar usuário:', error);
      }
    } finally {
      setSaving(false);
    }
  };
  return <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 space-y-2">
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            {user ? <>
                <User className="w-6 h-6 text-primary" />
                Editar Usuário
              </> : <>
                <User className="w-6 h-6 text-primary" />
                Novo Usuário
              </>}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {user ? 'Atualize as informações do usuário' : 'Preencha os dados para criar um novo usuário'}
          </p>
        </DialogHeader>

        <Separator />

        <ScrollArea className="max-h-[calc(90vh-180px)]">
          <form onSubmit={handleSubmit} className="px-6 py-4 space-y-6">
            {/* Seção: Informações Básicas */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                <User className="w-4 h-4" />
                Informações Básicas
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="nome" className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5" />
                    Nome Completo *
                  </Label>
                  <Input id="nome" value={formData.nome} onChange={e => setFormData({
                  ...formData,
                  nome: e.target.value
                })} placeholder="Digite o nome completo" disabled={saving} className="mt-1.5" />
                  <AnimatePresence>
                    {errors.nome && <motion.p initial={{
                    opacity: 0,
                    y: -5
                  }} animate={{
                    opacity: 1,
                    y: 0
                  }} exit={{
                    opacity: 0,
                    y: -5
                  }} className="text-sm text-destructive mt-1.5">
                        {errors.nome}
                      </motion.p>}
                  </AnimatePresence>
                </div>

                <div>
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5" />
                    Email *
                  </Label>
                  <Input id="email" type="email" value={formData.email} onChange={e => setFormData({
                  ...formData,
                  email: e.target.value
                })} placeholder="email@exemplo.com" disabled={saving} className="mt-1.5" />
                  <AnimatePresence>
                    {errors.email && <motion.p initial={{
                    opacity: 0,
                    y: -5
                  }} animate={{
                    opacity: 1,
                    y: 0
                  }} exit={{
                    opacity: 0,
                    y: -5
                  }} className="text-sm text-destructive mt-1.5">
                        {errors.email}
                      </motion.p>}
                  </AnimatePresence>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="telefone" className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5" />
                      Telefone
                    </Label>
                    <Input id="telefone" value={formData.telefone} onChange={e => setFormData({
                    ...formData,
                    telefone: e.target.value
                  })} placeholder="(00) 00000-0000" disabled={saving} className="mt-1.5" />
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="cnpjcpf" className="flex items-center gap-2">
                      <CreditCard className="w-3.5 h-3.5" />
                      CPF/CNPJ
                    </Label>
                    <div className="mt-1.5">
                      <CnpjCpfChipsInput
                        values={formData.cnpjcpf}
                        onChange={(values) => {
                          const newData = { ...formData, cnpjcpf: values };
                          // Se autoSelectFirst, atualiza cnpjcpf_atual automaticamente
                          if (formData.autoSelectFirst && values.length > 0) {
                            newData.cnpjcpf_atual = values[0];
                          }
                          // Se o cnpjcpf_atual foi removido, resetar
                          if (newData.cnpjcpf_atual && !values.includes(newData.cnpjcpf_atual)) {
                            newData.cnpjcpf_atual = values[0] || '';
                          }
                          setFormData(newData);
                        }}
                        disabled={saving}
                        placeholder="Digite CPF ou CNPJ e pressione Enter"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5">
                      Adicione múltiplos documentos pressionando Enter ou clicando no botão +
                    </p>
                    
                    {/* Seleção do documento atual/padrão */}
                    {formData.cnpjcpf.length > 1 && (
                      <div className="mt-4 p-3 rounded-lg border bg-muted/30 space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium">Documento Padrão</Label>
                          <div className="flex items-center gap-2">
                            <Label htmlFor="autoSelectFirst" className="text-xs text-muted-foreground">
                              Usar primeiro automaticamente
                            </Label>
                            <Switch 
                              id="autoSelectFirst"
                              checked={formData.autoSelectFirst}
                              onCheckedChange={(checked) => {
                                setFormData({
                                  ...formData,
                                  autoSelectFirst: checked,
                                  cnpjcpf_atual: checked ? formData.cnpjcpf[0] : formData.cnpjcpf_atual
                                });
                              }}
                              disabled={saving}
                            />
                          </div>
                        </div>
                        
                        {!formData.autoSelectFirst && (
                          <Select
                            value={formData.cnpjcpf_atual}
                            onValueChange={(value) => setFormData({ ...formData, cnpjcpf_atual: value })}
                            disabled={saving}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o documento padrão" />
                            </SelectTrigger>
                            <SelectContent>
                              {formData.cnpjcpf.map((doc) => (
                                <SelectItem key={doc} value={doc}>
                                  {doc}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                        
                        <p className="text-xs text-muted-foreground">
                          O documento padrão será usado automaticamente ao acessar a área do cliente
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Seção: Cargo */}
            <div className="space-y-4">
              

              <div>
                <Label htmlFor="cargo" className="flex items-center gap-2">
                  <Briefcase className="w-3.5 h-3.5" />
                  Cargo *
                </Label>
                <Select 
                  value={formData.cargo ? formData.cargo.toString() : undefined} 
                  onValueChange={value => setFormData({
                    ...formData,
                    cargo: parseInt(value)
                  })} 
                  disabled={saving}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Selecione um cargo" />
                  </SelectTrigger>
                  <SelectContent>
                    {cargos.filter(cargo => (cargo.level || 1) <= currentUserLevel).map(cargo => (
                      <SelectItem key={cargo.id} value={cargo.id.toString()}>
                        {cargo.nome} {cargo.level ? `(Nível ${cargo.level})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <AnimatePresence>
                  {errors.cargo && <motion.p initial={{
                  opacity: 0,
                  y: -5
                }} animate={{
                  opacity: 1,
                  y: 0
                }} exit={{
                  opacity: 0,
                  y: -5
                }} className="text-sm text-destructive mt-1.5">
                      {errors.cargo}
                    </motion.p>}
                </AnimatePresence>
                <p className="text-xs text-muted-foreground mt-1.5">
                  O nível hierárquico será definido automaticamente pelo cargo selecionado
                </p>
              </div>
            </div>

            <Separator />

            {/* Seção: WhatsApp */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                <MessageCircle className="w-4 h-4" />
                WhatsApp
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="flex items-center gap-2 mb-2">
                    Filas de Atendimento
                  </Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Selecione as filas de WhatsApp que este usuário poderá atender
                  </p>
                  <FilasSelector
                    selectedFilas={formData.filas}
                    onFilasChange={(filas) => setFormData({ ...formData, filas })}
                    disabled={saving}
                  />
                </div>

                <div>
                  <Label className="flex items-center gap-2 mb-2">
                    Tags
                  </Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Selecione as tags de WhatsApp vinculadas a este usuário
                  </p>
                  <TagsSelector
                    selectedTags={formData.tags}
                    onTagsChange={(tags) => setFormData({ ...formData, tags })}
                    disabled={saving}
                  />
                </div>
              </div>
            </div>

            {/* Seção: Contas de Email - só mostrar se tabela existe e é edição de usuário */}
            {emailTableExists && user?.id && (
              <>
                <UserEmailAccountsSection
                  selectedAccountIds={emailAccountIds}
                  defaultAccountId={defaultEmailAccountId}
                  onAccountsChange={setEmailAccountIds}
                  onDefaultChange={setDefaultEmailAccountId}
                  disabled={saving}
                />
                <Separator />
              </>
            )}

            {/* Seção: Permissões de Acesso */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                <Shield className="w-4 h-4" />
                Permissões de Acesso
              </div>

              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4 p-4 rounded-lg border bg-card">
                  <div className="flex items-start gap-3">
                    <UserCheck className="w-5 h-5 text-blue-500 mt-0.5" />
                    <div>
                      <Label htmlFor="acesso_cliente" className="text-base font-medium cursor-pointer">
                        Acesso Cliente
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Permite acesso à área do cliente para visualizar cotações e pedidos
                      </p>
                    </div>
                  </div>
                  <Switch id="acesso_cliente" checked={formData.acesso_area_cliente} onCheckedChange={checked => setFormData({
                  ...formData,
                  acesso_area_cliente: checked
                })} disabled={saving} />
                </div>

                <div className="flex items-start justify-between gap-4 p-4 rounded-lg border bg-card">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-purple-500 mt-0.5" />
                    <div>
                      <Label htmlFor="acesso_admin" className="text-base font-medium cursor-pointer">
                        Acesso Administrativo
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Concede acesso completo ao painel administrativo do sistema
                      </p>
                    </div>
                  </div>
                  <Switch id="acesso_admin" checked={formData.acesso_area_admin} onCheckedChange={checked => setFormData({
                  ...formData,
                  acesso_area_admin: checked
                })} disabled={saving} />
                </div>

                <div className="flex items-start justify-between gap-4 p-4 rounded-lg border bg-card">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                    </div>
                    <div>
                      <Label htmlFor="ativo" className="text-base font-medium cursor-pointer">
                        Usuário Ativo
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Usuários inativos não podem fazer login no sistema
                      </p>
                    </div>
                  </div>
                  <Switch id="ativo" checked={formData.ativo} onCheckedChange={checked => setFormData({
                  ...formData,
                  ativo: checked
                })} disabled={saving} />
                </div>
              </div>
            </div>
          </form>
        </ScrollArea>

        <Separator />

        <DialogFooter className="px-6 py-4">
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving} onClick={e => {
          e.preventDefault();
          handleSubmit(e as any);
        }}>
            {saving ? 'Salvando...' : user ? 'Atualizar Usuário' : 'Criar Usuário'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>;
};
export default UnifiedUserModal;