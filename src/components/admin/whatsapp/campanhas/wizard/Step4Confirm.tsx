import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Users, FileText, Workflow, MessageSquare } from 'lucide-react';
import { CampanhaFormData, Conexao, TemplateData, Flow } from './types';

interface Step4ConfirmProps {
  formData: CampanhaFormData;
  onUpdateField: <K extends keyof CampanhaFormData>(field: K, value: CampanhaFormData[K]) => void;
  conexoes: Conexao[];
  templates: TemplateData[];
  flows: Flow[];
  loadingFlows: boolean;
  totalContatos: number;
}

export const Step4Confirm: React.FC<Step4ConfirmProps> = ({
  formData,
  onUpdateField,
  conexoes,
  templates,
  flows,
  loadingFlows,
  totalContatos
}) => {
  const conexao = conexoes.find(c => c.id === formData.conexaoId);
  const template = templates.find(t => t.name === formData.templateName);
  const flow = flows.find(f => f.id === formData.flowId);
  const contatosCount = formData.enviarParaTodos ? totalContatos : formData.selectedContatos.size;
  
  const hoje = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-4">
      {/* Resumo */}
      <div className="border rounded-lg p-4 bg-muted/30 space-y-3">
        <h3 className="font-medium text-sm flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary" />
          Resumo da Campanha
        </h3>
        
        <div className="grid gap-3 text-sm">
          <div className="flex items-start gap-3">
            <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
              <span className="text-muted-foreground">Nome:</span>
              <span className="ml-2 font-medium">{formData.nome}</span>
              {formData.descricao && (
                <p className="text-xs text-muted-foreground mt-0.5">{formData.descricao}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            <div>
              <span className="text-muted-foreground">Conexão:</span>
              <span className="ml-2 font-medium">{conexao?.nome || '-'}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <div>
              <span className="text-muted-foreground">Template:</span>
              <span className="ml-2 font-medium">{template?.name || '-'}</span>
              {template && (
                <Badge variant="outline" className="ml-2 text-xs">{template.language}</Badge>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Users className="h-4 w-4 text-muted-foreground" />
            <div>
              <span className="text-muted-foreground">Contatos:</span>
              <Badge variant="secondary" className="ml-2">
                {contatosCount} {formData.enviarParaTodos ? '(todos)' : 'selecionados'}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Fluxo de Resposta */}
      <div className="space-y-3 border rounded-lg p-3 bg-muted/30">
        <div className="flex items-center gap-2">
          <Workflow className="h-4 w-4 text-primary" />
          <Label className="font-medium">Fluxo de Resposta (opcional)</Label>
        </div>
        <p className="text-xs text-muted-foreground">
          Quando um contato responder à campanha pela primeira vez, o fluxo selecionado será iniciado automaticamente.
        </p>
        <Select 
          value={formData.flowId} 
          onValueChange={(value) => onUpdateField('flowId', value)} 
          disabled={loadingFlows}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={
              loadingFlows 
                ? "Carregando fluxos..." 
                : "Selecione um fluxo (opcional)"
            } />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Nenhum fluxo</SelectItem>
            {flows.map((f) => (
              <SelectItem key={f.id} value={f.id}>
                <div className="flex flex-col">
                  <span>{f.name}</span>
                  {f.description && (
                    <span className="text-xs text-muted-foreground">{f.description}</span>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Agendamento */}
      <div className="space-y-3 border rounded-lg p-3 bg-muted/30">
        <div className="flex items-center gap-2">
          <Checkbox
            id="agendar"
            checked={formData.agendarEnvio}
            onCheckedChange={(checked) => onUpdateField('agendarEnvio', !!checked)}
          />
          <Label htmlFor="agendar" className="cursor-pointer flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Agendar envio para data específica
          </Label>
        </div>
        
        {formData.agendarEnvio && (
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div className="space-y-1">
              <Label className="text-xs flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Data
              </Label>
              <Input
                type="date"
                value={formData.dataAgendamento}
                onChange={e => onUpdateField('dataAgendamento', e.target.value)}
                min={hoje}
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Hora
              </Label>
              <Input
                type="time"
                value={formData.horaAgendamento}
                onChange={e => onUpdateField('horaAgendamento', e.target.value)}
                className="h-9"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
