import React, { useState, useEffect } from 'react';
import { Mail, User, Check, X, Save, Loader2, Settings2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { useEmailContas } from '@/hooks/useEmailContas';
import { useEmailPreferencias } from '@/hooks/useEmailPreferencias';
import { PASTAS_LABELS, type EmailPreferenciasForm } from '@/types/emailPreferencias';

const EmailUserSettingsTab: React.FC = () => {
  const { contas, loading: loadingContas } = useEmailContas();
  const [selectedContaId, setSelectedContaId] = useState<string | undefined>();
  const { preferencias, loading, saving, savePreferencias, getFormValues } = useEmailPreferencias(selectedContaId);
  
  const [formData, setFormData] = useState<EmailPreferenciasForm>(getFormValues());

  // Atualizar form quando preferências carregarem
  useEffect(() => {
    setFormData(getFormValues());
  }, [getFormValues, preferencias]);

  // Selecionar primeira conta disponível
  useEffect(() => {
    if (contas.length > 0 && !selectedContaId) {
      setSelectedContaId(contas[0].id);
    }
  }, [contas, selectedContaId]);

  const selectedConta = contas.find(c => c.id === selectedContaId);

  const handleSave = async () => {
    await savePreferencias(formData);
  };

  const updateForm = (updates: Partial<EmailPreferenciasForm>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  if (loadingContas) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (contas.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Nenhuma conta de email vinculada</h3>
          <p className="text-muted-foreground">
            Entre em contato com o administrador para vincular uma conta de email.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Seletor de Conta */}
      {contas.length > 1 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Conta de Email
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedContaId} onValueChange={setSelectedContaId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma conta" />
              </SelectTrigger>
              <SelectContent>
                {contas.map(conta => (
                  <SelectItem key={conta.id} value={conta.id}>
                    {conta.nome} ({conta.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      {/* Informações da Conta */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4" />
            Informações da Conta
          </CardTitle>
          <CardDescription>
            Dados definidos pelo administrador (somente leitura)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-muted-foreground text-sm">Nome da Conta</Label>
              <Input value={selectedConta?.nome || ''} disabled className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground text-sm">Endereço de Email</Label>
              <Input value={selectedConta?.email || ''} disabled className="bg-muted" />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Status:</span>
              <Badge variant={selectedConta?.ativo ? 'default' : 'secondary'}>
                {selectedConta?.ativo ? (
                  <><Check className="h-3 w-3 mr-1" /> Ativa</>
                ) : (
                  <><X className="h-3 w-3 mr-1" /> Inativa</>
                )}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Verificação:</span>
              <Badge variant={selectedConta?.verificado ? 'default' : 'outline'}>
                {selectedConta?.verificado ? (
                  <><Check className="h-3 w-3 mr-1" /> Verificada</>
                ) : (
                  'Pendente'
                )}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assinatura de Email */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Assinatura de Email
              </CardTitle>
              <CardDescription>
                Será adicionada automaticamente aos emails enviados
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="assinatura-ativa" className="text-sm">Ativar</Label>
              <Switch
                id="assinatura-ativa"
                checked={formData.assinatura_ativa}
                onCheckedChange={(checked) => updateForm({ assinatura_ativa: checked })}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Textarea
              value={formData.assinatura_texto}
              onChange={(e) => updateForm({ assinatura_texto: e.target.value })}
              placeholder="Digite sua assinatura de email..."
              rows={4}
              disabled={!formData.assinatura_ativa}
              className={!formData.assinatura_ativa ? 'opacity-50' : ''}
            />
          </div>
        </CardContent>
      </Card>

      {/* Preferências de Uso */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Settings2 className="h-4 w-4" />
            Preferências de Uso
          </CardTitle>
          <CardDescription>
            Personalize sua experiência com o email
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Mensagens por página */}
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Mensagens por página</Label>
              <p className="text-xs text-muted-foreground">
                Quantidade de emails exibidos na lista
              </p>
            </div>
            <Select 
              value={String(formData.mensagens_por_pagina)} 
              onValueChange={(v) => updateForm({ mensagens_por_pagina: Number(v) as 20 | 50 | 100 })}
            >
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Marcar como lido */}
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Marcar como lido automaticamente</Label>
              <p className="text-xs text-muted-foreground">
                Marcar email como lido ao abrir
              </p>
            </div>
            <Switch
              checked={formData.marcar_lido_automatico}
              onCheckedChange={(checked) => updateForm({ marcar_lido_automatico: checked })}
            />
          </div>

          <Separator />

          {/* Pasta padrão */}
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Pasta padrão ao abrir</Label>
              <p className="text-xs text-muted-foreground">
                Pasta exibida ao acessar o módulo de email
              </p>
            </div>
            <Select 
              value={formData.pasta_padrao} 
              onValueChange={(v) => updateForm({ pasta_padrao: v as any })}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PASTAS_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Incluir citação */}
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Incluir citação ao responder</Label>
              <p className="text-xs text-muted-foreground">
                Adicionar texto original na resposta
              </p>
            </div>
            <Switch
              checked={formData.responder_com_citacao}
              onCheckedChange={(checked) => updateForm({ responder_com_citacao: checked })}
            />
          </div>

          <Separator />

          {/* Formato padrão */}
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Formato padrão de composição</Label>
              <p className="text-xs text-muted-foreground">
                Formato usado ao compor novos emails
              </p>
            </div>
            <Select 
              value={formData.formato_padrao} 
              onValueChange={(v) => updateForm({ formato_padrao: v as 'html' | 'texto' })}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="html">HTML</SelectItem>
                <SelectItem value="texto">Texto</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Botão Salvar */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving || loading}>
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Salvar Preferências
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default EmailUserSettingsTab;
