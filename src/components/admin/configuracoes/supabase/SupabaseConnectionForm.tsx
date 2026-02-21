
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Database, TestTube, CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface SupabaseConnectionFormProps {
  supabaseUrl: string;
  setSupabaseUrl: (url: string) => void;
  supabaseKey: string;
  setSupabaseKey: (key: string) => void;
  connectionStatus: 'idle' | 'testing' | 'success' | 'error';
  connectionMessage: string;
  onTestConnection: () => Promise<void>;
  loading: boolean;
}

const SupabaseConnectionForm = ({
  supabaseUrl,
  setSupabaseUrl,
  supabaseKey,
  setSupabaseKey,
  connectionStatus,
  connectionMessage,
  onTestConnection,
  loading
}: SupabaseConnectionFormProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Configuração do Supabase
        </CardTitle>
        <CardDescription>
          Configure a conexão com seu projeto Supabase
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-2">
            <Label htmlFor="supabase-url">URL do Projeto</Label>
            <Input
              id="supabase-url"
              type="url"
              placeholder="https://seu-projeto.supabase.co"
              value={supabaseUrl}
              onChange={(e) => setSupabaseUrl(e.target.value)}
              disabled={loading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="supabase-key">Chave Anônima (anon key)</Label>
            <Input
              id="supabase-key"
              type="password"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              value={supabaseKey}
              onChange={(e) => setSupabaseKey(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>

        {/* Status da Conexão */}
        {connectionStatus !== 'idle' && (
          <div className={`p-3 rounded-lg border ${
            connectionStatus === 'success' ? 'bg-green-50 border-green-200' :
            connectionStatus === 'error' ? 'bg-red-50 border-red-200' :
            'bg-blue-50 border-blue-200'
          }`}>
            <div className="flex items-center gap-2">
              {connectionStatus === 'testing' && <Loader2 className="h-4 w-4 animate-spin text-blue-600" />}
              {connectionStatus === 'success' && <CheckCircle className="h-4 w-4 text-green-600" />}
              {connectionStatus === 'error' && <XCircle className="h-4 w-4 text-red-600" />}
              <span className={`text-sm font-medium ${
                connectionStatus === 'success' ? 'text-green-800' :
                connectionStatus === 'error' ? 'text-red-800' :
                'text-blue-800'
              }`}>
                {connectionMessage}
              </span>
            </div>
          </div>
        )}

        <Button 
          onClick={onTestConnection}
          disabled={!supabaseUrl || !supabaseKey || loading}
          className="w-full"
        >
          <TestTube className="h-4 w-4 mr-2" />
          {connectionStatus === 'testing' ? 'Testando...' : 'Testar Conexão'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default SupabaseConnectionForm;
