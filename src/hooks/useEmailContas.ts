import { useState, useEffect, useCallback } from 'react';
import { requireAuthenticatedClient } from '@/config/supabaseAuth';
import { EmailConta, CreateEmailContaData, UpdateEmailContaData } from '@/types/email';
import { useToast } from '@/hooks/use-toast';

export function useEmailContas() {
  const [contas, setContas] = useState<EmailConta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchContas = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const supabase = requireAuthenticatedClient();
      const { data, error: fetchError } = await supabase
        .from('email_contas')
        .select('*')
        .order('nome');

      if (fetchError) throw fetchError;
      
      setContas(data || []);
    } catch (err: any) {
      console.error('Erro ao buscar contas de email:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContas();
  }, [fetchContas]);

  const createConta = async (data: CreateEmailContaData): Promise<EmailConta | null> => {
    try {
      const supabase = requireAuthenticatedClient();
      // Criptografar senha via edge function
      const { data: encryptResult, error: encryptError } = await supabase.functions.invoke('email-encrypt', {
        body: { 
          senha: data.senha,
          carddav_senha: data.carddav_senha,
          caldav_senha: data.caldav_senha
        }
      });

      if (encryptError) throw encryptError;

      const insertData = {
        nome: data.nome,
        email: data.email,
        imap_host: data.imap_host,
        imap_port: data.imap_port || 993,
        imap_ssl: data.imap_ssl ?? true,
        smtp_host: data.smtp_host,
        smtp_port: data.smtp_port || 587,
        smtp_ssl: data.smtp_ssl ?? true,
        senha_criptografada: encryptResult.senha_criptografada,
        ativo: data.ativo ?? true,
        carddav_url: data.carddav_url,
        carddav_usuario: data.carddav_usuario,
        carddav_senha_criptografada: encryptResult.carddav_senha_criptografada,
        caldav_url: data.caldav_url,
        caldav_usuario: data.caldav_usuario,
        caldav_senha_criptografada: encryptResult.caldav_senha_criptografada,
        suporta_carddav: data.suporta_carddav ?? false,
        suporta_caldav: data.suporta_caldav ?? false
      };

      const { data: newConta, error: insertError } = await supabase
        .from('email_contas')
        .insert(insertData)
        .select()
        .single();

      if (insertError) throw insertError;

      setContas(prev => [...prev, newConta]);
      
      toast({
        title: 'Sucesso',
        description: 'Conta de email criada com sucesso!'
      });

      return newConta;
    } catch (err: any) {
      console.error('Erro ao criar conta de email:', err);
      toast({
        title: 'Erro',
        description: err.message || 'Erro ao criar conta de email',
        variant: 'destructive'
      });
      return null;
    }
  };

  const updateConta = async (data: UpdateEmailContaData): Promise<EmailConta | null> => {
    try {
      const supabase = requireAuthenticatedClient();
      const updateData: any = {
        nome: data.nome,
        email: data.email,
        imap_host: data.imap_host,
        imap_port: data.imap_port,
        imap_ssl: data.imap_ssl,
        smtp_host: data.smtp_host,
        smtp_port: data.smtp_port,
        smtp_ssl: data.smtp_ssl,
        ativo: data.ativo,
        carddav_url: data.carddav_url,
        carddav_usuario: data.carddav_usuario,
        caldav_url: data.caldav_url,
        caldav_usuario: data.caldav_usuario,
        suporta_carddav: data.suporta_carddav,
        suporta_caldav: data.suporta_caldav
      };

      // Se senha foi alterada, criptografar
      if (data.senha || data.carddav_senha || data.caldav_senha) {
        const { data: encryptResult, error: encryptError } = await supabase.functions.invoke('email-encrypt', {
          body: { 
            senha: data.senha,
            carddav_senha: data.carddav_senha,
            caldav_senha: data.caldav_senha
          }
        });

        if (encryptError) throw encryptError;

        if (data.senha) {
          updateData.senha_criptografada = encryptResult.senha_criptografada;
        }
        if (data.carddav_senha) {
          updateData.carddav_senha_criptografada = encryptResult.carddav_senha_criptografada;
        }
        if (data.caldav_senha) {
          updateData.caldav_senha_criptografada = encryptResult.caldav_senha_criptografada;
        }
      }

      // Remover campos undefined
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });

      const { data: updatedConta, error: updateError } = await supabase
        .from('email_contas')
        .update(updateData)
        .eq('id', data.id)
        .select()
        .single();

      if (updateError) throw updateError;

      setContas(prev => prev.map(c => c.id === data.id ? updatedConta : c));
      
      toast({
        title: 'Sucesso',
        description: 'Conta de email atualizada com sucesso!'
      });

      return updatedConta;
    } catch (err: any) {
      console.error('Erro ao atualizar conta de email:', err);
      toast({
        title: 'Erro',
        description: err.message || 'Erro ao atualizar conta de email',
        variant: 'destructive'
      });
      return null;
    }
  };

  const deleteConta = async (id: string): Promise<boolean> => {
    try {
      const supabase = requireAuthenticatedClient();
      const { error: deleteError } = await supabase
        .from('email_contas')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setContas(prev => prev.filter(c => c.id !== id));
      
      toast({
        title: 'Sucesso',
        description: 'Conta de email removida com sucesso!'
      });

      return true;
    } catch (err: any) {
      console.error('Erro ao remover conta de email:', err);
      toast({
        title: 'Erro',
        description: err.message || 'Erro ao remover conta de email',
        variant: 'destructive'
      });
      return false;
    }
  };

  const testConnection = async (data: CreateEmailContaData): Promise<{ success: boolean; message: string }> => {
    try {
      const supabase = requireAuthenticatedClient();
      const { data: result, error } = await supabase.functions.invoke('email-test-connection', {
        body: {
          imap_host: data.imap_host,
          imap_port: data.imap_port || 993,
          imap_ssl: data.imap_ssl ?? true,
          smtp_host: data.smtp_host,
          smtp_port: data.smtp_port || 587,
          smtp_ssl: data.smtp_ssl ?? true,
          email: data.email,
          senha: data.senha
        }
      });

      if (error) throw error;

      if (result.imap_ok && result.smtp_ok) {
        return { success: true, message: 'Conexão IMAP e SMTP estabelecida com sucesso!' };
      } else {
        const errors = [];
        if (!result.imap_ok) errors.push(`IMAP: ${result.imap_error}`);
        if (!result.smtp_ok) errors.push(`SMTP: ${result.smtp_error}`);
        return { success: false, message: errors.join('\n') };
      }
    } catch (err: any) {
      console.error('Erro ao testar conexão:', err);
      return { success: false, message: err.message || 'Erro ao testar conexão' };
    }
  };

  return {
    contas,
    loading,
    error,
    refetch: fetchContas,
    createConta,
    updateConta,
    deleteConta,
    testConnection
  };
}
