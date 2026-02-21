
import { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { toast } from '@/lib/toast';
import SupabaseConnectionForm from './supabase/SupabaseConnectionForm';
import SupabaseTableCreation from './supabase/SupabaseTableCreation';
import { generateSQLScript, testSupabaseConnection, createSupabaseTables } from '@/services/supabaseConfigService';
import { supabaseConfig } from '@/config/supabase';

interface SupabaseConfigProps {
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

const SupabaseConfig = ({ loading, setLoading }: SupabaseConfigProps) => {
  
  // Usar configurações reais do Supabase
  const [supabaseUrl, setSupabaseUrl] = useState(supabaseConfig.url);
  const [supabaseKey, setSupabaseKey] = useState(supabaseConfig.anonKey);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [connectionMessage, setConnectionMessage] = useState('');
  const [sqlScript, setSqlScript] = useState('');
  const [creationStatus, setCreationStatus] = useState<'idle' | 'creating' | 'success' | 'error'>('idle');
  const [creationMessage, setCreationMessage] = useState('');

  const handleTestConnection = async () => {
    setLoading(true);
    setConnectionStatus('testing');
    setConnectionMessage('Testando conexão...');
    
    try {
      const result = await testSupabaseConnection(supabaseUrl, supabaseKey);
      
      if (result.success) {
        setConnectionStatus('success');
        setConnectionMessage(result.message);
        toast.success(result.message);
      } else {
        setConnectionStatus('error');
        setConnectionMessage(result.message);
        toast.error(result.message);
      }
    } catch (error) {
      setConnectionStatus('error');
      setConnectionMessage('Erro inesperado ao testar conexão');
      toast.error('Erro inesperado ao testar conexão');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSQL = () => {
    const script = generateSQLScript();
    setSqlScript(script);
    toast.success('Script SQL gerado com sucesso!');
  };

  const handleCreateTables = async () => {
    setLoading(true);
    setCreationStatus('creating');
    setCreationMessage('Criando tabelas...');
    
    try {
      const result = await createSupabaseTables(supabaseUrl, supabaseKey, sqlScript);
      
      if (result.success) {
        setCreationStatus('success');
        setCreationMessage(result.message);
        toast.success(result.message);
      } else {
        setCreationStatus('error');
        setCreationMessage(result.message);
        toast.error(result.message);
      }
    } catch (error) {
      setCreationStatus('error');
      setCreationMessage('Erro inesperado ao criar tabelas');
      toast.error('Erro inesperado ao criar tabelas');
    } finally {
      setLoading(false);
    }
  };

  const canCreateTables = connectionStatus === 'success';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-green-800">Configuração Real do Supabase</h4>
            <p className="text-sm text-green-700 mt-1">
              Sistema configurado para usar seu projeto Supabase real em produção.
              Host: {supabaseConfig.url}
            </p>
          </div>
        </div>
      </div>

      <SupabaseConnectionForm
        supabaseUrl={supabaseUrl}
        setSupabaseUrl={setSupabaseUrl}
        supabaseKey={supabaseKey}
        setSupabaseKey={setSupabaseKey}
        connectionStatus={connectionStatus}
        connectionMessage={connectionMessage}
        onTestConnection={handleTestConnection}
        loading={loading}
      />

      <SupabaseTableCreation
        sqlScript={sqlScript}
        creationStatus={creationStatus}
        creationMessage={creationMessage}
        onCreateTables={handleCreateTables}
        onGenerateSQL={handleGenerateSQL}
        loading={loading}
        canCreateTables={canCreateTables}
      />
    </motion.div>
  );
};

export default SupabaseConfig;
