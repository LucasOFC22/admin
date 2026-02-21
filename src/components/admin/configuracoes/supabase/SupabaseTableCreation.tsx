
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Code, CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface SupabaseTableCreationProps {
  sqlScript: string;
  creationStatus: 'idle' | 'creating' | 'success' | 'error';
  creationMessage: string;
  onCreateTables: () => Promise<void>;
  onGenerateSQL: () => void;
  loading: boolean;
  canCreateTables: boolean;
}

const requiredTables = [
  { name: 'cotacoes', description: 'Tabela para armazenar cotações' },
  { name: 'contatos', description: 'Tabela para mensagens de contato' },
  { name: 'usuarios', description: 'Tabela para usuários do sistema' },
  { name: 'logs_atividade', description: 'Tabela para logs de atividade' },
  { name: 'configuracoes', description: 'Tabela para configurações do sistema' }
];

const SupabaseTableCreation = ({
  sqlScript,
  creationStatus,
  creationMessage,
  onCreateTables,
  onGenerateSQL,
  loading,
  canCreateTables
}: SupabaseTableCreationProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Criação de Tabelas
        </CardTitle>
        <CardDescription>
          Crie as tabelas necessárias para o funcionamento do sistema
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="text-sm font-medium mb-3">Tabelas Necessárias:</h4>
          <div className="grid grid-cols-1 gap-2">
            {requiredTables.map((table) => (
              <div key={table.name} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div>
                  <Badge variant="outline" className="font-mono text-xs">
                    {table.name}
                  </Badge>
                  <p className="text-xs text-gray-600 mt-1">{table.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Script SQL Gerado:</h4>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onGenerateSQL}
              disabled={loading}
            >
              <Code className="h-4 w-4 mr-2" />
              Gerar SQL
            </Button>
          </div>
          
          <Textarea
            value={sqlScript}
            readOnly
            className="font-mono text-xs bg-gray-50"
            rows={10}
            placeholder="Clique em 'Gerar SQL' para ver o script..."
          />
        </div>

        {/* Status da Criação */}
        {creationStatus !== 'idle' && (
          <div className={`p-3 rounded-lg border ${
            creationStatus === 'success' ? 'bg-green-50 border-green-200' :
            creationStatus === 'error' ? 'bg-red-50 border-red-200' :
            'bg-blue-50 border-blue-200'
          }`}>
            <div className="flex items-center gap-2">
              {creationStatus === 'creating' && <Loader2 className="h-4 w-4 animate-spin text-blue-600" />}
              {creationStatus === 'success' && <CheckCircle className="h-4 w-4 text-green-600" />}
              {creationStatus === 'error' && <XCircle className="h-4 w-4 text-red-600" />}
              <span className={`text-sm font-medium ${
                creationStatus === 'success' ? 'text-green-800' :
                creationStatus === 'error' ? 'text-red-800' :
                'text-blue-800'
              }`}>
                {creationMessage}
              </span>
            </div>
          </div>
        )}

        <Button 
          onClick={onCreateTables}
          disabled={!canCreateTables || loading || !sqlScript}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          {creationStatus === 'creating' ? 'Criando Tabelas...' : 'Criar Tabelas'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default SupabaseTableCreation;
