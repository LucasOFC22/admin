import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Loader2, FileText } from 'lucide-react';
import { TemplateData, CampanhaFormData } from './types';

interface Step2TemplateProps {
  formData: CampanhaFormData;
  onSelectTemplate: (templateName: string, language: string) => void;
  templates: TemplateData[];
  loadingTemplates: boolean;
  onRefreshTemplates: () => void;
}

export const Step2Template: React.FC<Step2TemplateProps> = ({
  formData,
  onSelectTemplate,
  templates,
  loadingTemplates,
  onRefreshTemplates
}) => {
  const selectedTemplate = templates.find(t => t.name === formData.templateName);

  const handleTemplateChange = (templateName: string) => {
    const template = templates.find(t => t.name === templateName);
    if (template) {
      onSelectTemplate(templateName, template.language);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Template de Mensagem *</Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRefreshTemplates}
            disabled={loadingTemplates}
            className="h-7 px-2"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1 ${loadingTemplates ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
        
        <Select 
          value={formData.templateName} 
          onValueChange={handleTemplateChange}
          disabled={loadingTemplates}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={
              loadingTemplates 
                ? "Carregando templates..." 
                : templates.length === 0
                  ? "Nenhum template aprovado"
                  : "Selecione um template"
            } />
          </SelectTrigger>
          <SelectContent>
            {templates.map(t => (
              <SelectItem key={t.id} value={t.name}>
                <div className="flex items-center gap-2">
                  <span>{t.name}</span>
                  <Badge variant="secondary" className="text-xs">
                    {t.category}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {t.language}
                  </Badge>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <p className="text-xs text-muted-foreground">
          Apenas templates aprovados no Meta Business são exibidos
        </p>
      </div>

      {selectedTemplate && (
        <div className="border rounded-lg p-4 bg-muted/30 space-y-2">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            <span className="font-medium text-sm">Template Selecionado</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">Nome:</span>
              <span className="ml-2 font-medium">{selectedTemplate.name}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Categoria:</span>
              <span className="ml-2 font-medium">{selectedTemplate.category}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Idioma:</span>
              <span className="ml-2 font-medium">{selectedTemplate.language}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Status:</span>
              <Badge variant="outline" className="ml-2 text-green-600 border-green-600 text-xs">
                Aprovado
              </Badge>
            </div>
          </div>
        </div>
      )}

      {loadingTemplates && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
};
