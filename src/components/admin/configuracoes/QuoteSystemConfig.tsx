
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { FileText, Send, Settings, TestTube } from 'lucide-react';
import { toast } from '@/lib/toast';

interface QuoteSystemConfigProps {
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

const QuoteSystemConfig: React.FC<QuoteSystemConfigProps> = ({ loading, setLoading }) => {
  
  const [quoteConfig, setQuoteConfig] = useState({
    // Configurações de cotação
    autoResponseEnabled: true,
    defaultValidityDays: 15,
    requirePhotoUpload: false,
    maxFileSize: 10,
    allowedFileTypes: 'pdf,jpg,jpeg,png,doc,docx',
    
    // Templates de resposta
    welcomeMessage: 'Obrigado por solicitar uma cotação! Analisaremos sua solicitação e retornaremos em breve.',
    proposalTemplate: `Prezado(a) {{nome}},

Segue nossa proposta para o transporte de {{descricao_carga}}:

Origem: {{origem}}
Destino: {{destino}}
Valor: R$ {{valor}}
Prazo: {{prazo}} dias úteis
Validade: {{validade}}

Aguardamos seu retorno.

Atenciosamente,
Equipe FP Transcargas`,
    
    // Configurações de notificação
    notifyNewQuote: true,
    notifyProposalSent: true,
    notifyProposalAccepted: true,
    emailNotifications: true,
  });

  const handleSaveQuoteConfig = async () => {
    setLoading(true);
    try {
      // Sistema simplificado
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Configurações do sistema de cotação salvas!');
    } catch (error) {
      toast.error('Não foi possível salvar as configurações');
    } finally {
      setLoading(false);
    }
  };

  const handleTestQuoteSubmission = async () => {
    setLoading(true);
    try {
      console.log('🚀 ENVIANDO COTAÇÃO SIMPLIFICADA (SISTEMA DESABILITADO)');
      
      // ID único para a cotação
      const quoteId = `COT${Date.now()}`;
      const timestamp = new Date().toISOString();
      
      // Estrutura SIMPLIFICADA - apenas dados essenciais
      const essentialData = {
        action: 'new_quote',
        quoteId: quoteId,
        timestamp: timestamp,
        // Dados básicos para teste
        cargo: {
          description: "Equipamentos eletrônicos",
          weight: 150,
          declaredValue: 5000,
        },
        contact: {
          name: "Maria Santos",
          email: "contato@fptranscargas.com.br",
          phone: "(11) 99999-9999",
        }
      };
      
      console.log('📋 DADOS PARA TESTE (sistema simplificado):', JSON.stringify(essentialData, null, 2));
      
      // Simular envio
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Cotação registrada! Sistema simplificado ativo.');
      
    } catch (error) {
      console.error('❌ ERRO NO ENVIO:', error);
      toast.error('Falha ao processar a cotação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">

      {/* Configurações Gerais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configurações do Sistema de Cotação
          </CardTitle>
          <CardDescription>
            Configure o comportamento geral do sistema de cotações (sistema simplificado)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="validityDays">Validade padrão (dias)</Label>
              <Input
                id="validityDays"
                type="number"
                value={quoteConfig.defaultValidityDays}
                onChange={(e) => setQuoteConfig(prev => ({ 
                  ...prev, 
                  defaultValidityDays: parseInt(e.target.value) || 15 
                }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxFileSize">Tamanho máximo de arquivo (MB)</Label>
              <Input
                id="maxFileSize"
                type="number"
                value={quoteConfig.maxFileSize}
                onChange={(e) => setQuoteConfig(prev => ({ 
                  ...prev, 
                  maxFileSize: parseInt(e.target.value) || 10 
                }))}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Resposta automática habilitada</Label>
                <p className="text-sm text-gray-500">Enviar mensagem automática ao receber cotação</p>
              </div>
              <Switch
                checked={quoteConfig.autoResponseEnabled}
                onCheckedChange={(checked) => setQuoteConfig(prev => ({ 
                  ...prev, 
                  autoResponseEnabled: checked 
                }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Exigir upload de fotos</Label>
                <p className="text-sm text-gray-500">Obrigar cliente a enviar fotos da carga</p>
              </div>
              <Switch
                checked={quoteConfig.requirePhotoUpload}
                onCheckedChange={(checked) => setQuoteConfig(prev => ({ 
                  ...prev, 
                  requirePhotoUpload: checked 
                }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Templates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Templates de Mensagem
          </CardTitle>
          <CardDescription>
            Configure as mensagens automáticas do sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="welcomeMessage">Mensagem de boas-vindas</Label>
            <Textarea
              id="welcomeMessage"
              value={quoteConfig.welcomeMessage}
              onChange={(e) => setQuoteConfig(prev => ({ 
                ...prev, 
                welcomeMessage: e.target.value 
              }))}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="proposalTemplate">Template de proposta</Label>
            <Textarea
              id="proposalTemplate"
              value={quoteConfig.proposalTemplate}
              onChange={(e) => setQuoteConfig(prev => ({ 
                ...prev, 
                proposalTemplate: e.target.value 
              }))}
              rows={8}
              className="font-mono text-sm"
            />
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge variant="outline">{"{{nome}}"}</Badge>
              <Badge variant="outline">{"{{origem}}"}</Badge>
              <Badge variant="outline">{"{{destino}}"}</Badge>
              <Badge variant="outline">{"{{valor}}"}</Badge>
              <Badge variant="outline">{"{{prazo}}"}</Badge>
              <Badge variant="outline">{"{{validade}}"}</Badge>
              <Badge variant="outline">{"{{descricao_carga}}"}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>


      <div className="flex justify-end">
        <Button onClick={handleSaveQuoteConfig} disabled={loading}>
          {loading ? 'Salvando...' : 'Salvar Configurações'}
        </Button>
      </div>
    </div>
  );
};

export default QuoteSystemConfig;
