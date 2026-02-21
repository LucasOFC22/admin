import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Conexao, CampanhaFormData } from './types';

interface Step1BasicInfoProps {
  formData: CampanhaFormData;
  onUpdateField: <K extends keyof CampanhaFormData>(field: K, value: CampanhaFormData[K]) => void;
  onSelectConexao: (conexaoId: string) => void;
  conexoes: Conexao[];
  loadingConexoes: boolean;
}

export const Step1BasicInfo: React.FC<Step1BasicInfoProps> = ({
  formData,
  onUpdateField,
  onSelectConexao,
  conexoes,
  loadingConexoes
}) => {
  const conexoesConfiguradas = conexoes.filter(c => c.whatsapp_business_account_id);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'conectado':
        return <Badge variant="outline" className="ml-2 text-green-600 border-green-600">Conectado</Badge>;
      case 'desconectado':
        return <Badge variant="outline" className="ml-2 text-red-600 border-red-600">Desconectado</Badge>;
      default:
        return <Badge variant="outline" className="ml-2">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="nome">Nome da Campanha *</Label>
        <Input
          id="nome"
          value={formData.nome}
          onChange={e => onUpdateField('nome', e.target.value)}
          placeholder="Ex: Promoção de Natal"
          autoFocus
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="descricao">Descrição (opcional)</Label>
        <Textarea
          id="descricao"
          value={formData.descricao}
          onChange={e => onUpdateField('descricao', e.target.value)}
          placeholder="Descrição opcional da campanha..."
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label>Conexão WhatsApp *</Label>
        <Select 
          value={formData.conexaoId} 
          onValueChange={onSelectConexao} 
          disabled={loadingConexoes}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={
              loadingConexoes 
                ? "Carregando conexões..." 
                : conexoesConfiguradas.length === 0 
                  ? "Nenhuma conexão configurada" 
                  : "Selecione uma conexão"
            } />
          </SelectTrigger>
          <SelectContent>
            {conexoesConfiguradas.map(c => (
              <SelectItem key={c.id} value={c.id}>
                <div className="flex items-center">
                  {c.nome}
                  {getStatusBadge(c.status)}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {conexoes.length > 0 && conexoesConfiguradas.length === 0 && (
          <p className="text-xs text-destructive">
            Nenhuma conexão tem WABA configurado
          </p>
        )}
      </div>
    </div>
  );
};
