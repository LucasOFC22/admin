import { useState, useEffect, useCallback } from 'react';
import { requireAuthenticatedClient } from '@/config/supabaseAuth';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { toast } from '@/lib/toast';
import { z } from 'zod';
import type { EmailPreferenciasUsuario, EmailPreferenciasForm, EmailAssinatura } from '@/types/emailPreferencias';

// Schema de validação com Zod
const emailPreferenciasSchema = z.object({
  assinatura_ativa: z.boolean(),
  assinatura_texto: z.string().max(5000, 'Assinatura em texto muito longa (máx 5000 caracteres)').optional().or(z.literal('')),
  assinatura_html: z.string().max(50000, 'Assinatura HTML muito longa (máx 50000 caracteres)').optional().or(z.literal('')),
  mensagens_por_pagina: z.union([z.literal(20), z.literal(50), z.literal(100)]),
  marcar_lido_automatico: z.boolean(),
  pasta_padrao: z.string().min(1, 'Pasta padrão é obrigatória'),
  view: z.enum(['list', 'split']),
  responder_com_citacao: z.boolean(),
  formato_padrao: z.enum(['html', 'texto'])
});

const DEFAULT_PREFERENCIAS: EmailPreferenciasForm = {
  assinatura_ativa: false,
  assinatura_texto: '',
  assinatura_html: '',
  mensagens_por_pagina: 20,
  marcar_lido_automatico: true,
  pasta_padrao: 'inbox',
  view: 'list',
  responder_com_citacao: true,
  formato_padrao: 'html'
};

export function useEmailPreferencias(emailContaId?: string) {
  const { user } = useUnifiedAuth();
  const [preferencias, setPreferencias] = useState<EmailPreferenciasUsuario | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Usar supabase_id para queries (corresponde ao auth.uid() usado nas RLS)
  const userId = user?.supabase_id || user?.uid;

  // Carregar preferências do usuário
  const loadPreferencias = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      const supabase = requireAuthenticatedClient();
      let query = supabase
        .from('email_preferencias_usuario')
        .select('*')
        .eq('usuario_id', userId);
      
      if (emailContaId) {
        query = query.eq('email_conta_id', emailContaId);
      } else {
        query = query.is('email_conta_id', null);
      }

      const { data, error } = await query.maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao carregar preferências:', error);
        throw error;
      }

      setPreferencias(data as EmailPreferenciasUsuario | null);
    } catch (error) {
      console.error('Erro ao carregar preferências:', error);
    } finally {
      setLoading(false);
    }
  }, [userId, emailContaId]);

  useEffect(() => {
    loadPreferencias();
  }, [loadPreferencias]);

  // Salvar preferências
  const savePreferencias = useCallback(async (formData: EmailPreferenciasForm): Promise<boolean> => {
    if (!userId) {
      toast.error('Você precisa estar logado para salvar preferências');
      return false;
    }

    try {
      setSaving(true);

      // Validar dados com Zod
      const validationResult = emailPreferenciasSchema.safeParse(formData);
      if (!validationResult.success) {
        const firstError = validationResult.error.errors[0];
        toast.error(firstError.message || 'Dados inválidos');
        return false;
      }

      const dadosParaSalvar = {
        usuario_id: userId,
        email_conta_id: emailContaId || null,
        assinatura_ativa: Boolean(formData.assinatura_ativa),
        assinatura_texto: formData.assinatura_texto || null,
        assinatura_html: formData.assinatura_html || null,
        mensagens_por_pagina: Number(formData.mensagens_por_pagina) || 20,
        marcar_lido_automatico: Boolean(formData.marcar_lido_automatico),
        pasta_padrao: formData.pasta_padrao || 'inbox',
        view: formData.view || 'list',
        responder_com_citacao: Boolean(formData.responder_com_citacao),
        formato_padrao: formData.formato_padrao || 'html'
      };

      // Usar upsert para evitar erro de chave duplicada
      const supabase = requireAuthenticatedClient();
      const { error } = await supabase
        .from('email_preferencias_usuario')
        .upsert(dadosParaSalvar, {
          onConflict: 'usuario_id,email_conta_id'
        });

      if (error) throw error;

      // Atualizar estado local - criar objeto novo quando prev é null
      setPreferencias(prev => {
        const novaPreferencia: EmailPreferenciasUsuario = {
          id: prev?.id || crypto.randomUUID(),
          usuario_id: userId,
          email_conta_id: emailContaId || null,
          assinatura_ativa: dadosParaSalvar.assinatura_ativa,
          assinatura_texto: dadosParaSalvar.assinatura_texto,
          assinatura_html: dadosParaSalvar.assinatura_html,
          mensagens_por_pagina: dadosParaSalvar.mensagens_por_pagina as 20 | 50 | 100,
          marcar_lido_automatico: dadosParaSalvar.marcar_lido_automatico,
          pasta_padrao: dadosParaSalvar.pasta_padrao,
          view: dadosParaSalvar.view as 'list' | 'split',
          responder_com_citacao: dadosParaSalvar.responder_com_citacao,
          formato_padrao: dadosParaSalvar.formato_padrao as 'html' | 'texto',
          created_at: prev?.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        return novaPreferencia;
      });
      toast.success('Preferências salvas com sucesso');
      return true;
    } catch (error) {
      console.error('Erro ao salvar preferências:', error);
      toast.error('Erro ao salvar preferências');
      return false;
    } finally {
      setSaving(false);
    }
  }, [userId, emailContaId]);

  // Obter assinatura formatada para envio
  const getAssinatura = useCallback((): EmailAssinatura | null => {
    if (!preferencias?.assinatura_ativa) return null;
    
    const isHtml = preferencias.formato_padrao === 'html';
    const conteudo = isHtml 
      ? preferencias.assinatura_html || preferencias.assinatura_texto || ''
      : preferencias.assinatura_texto || '';
    
    if (!conteudo.trim()) return null;

    return {
      ativa: true,
      conteudo,
      is_html: isHtml
    };
  }, [preferencias]);

  // Gerar HTML da assinatura para inserção no editor (com separador e linhas em branco)
  const getAssinaturaHtml = useCallback((): string => {
    if (!preferencias?.assinatura_ativa) return '';
    
    const conteudo = preferencias.assinatura_html || preferencias.assinatura_texto || '';
    
    if (!conteudo.trim()) return '';

    // Formato: duas linhas em branco + assinatura (SEM separador --)
    return `<br><br>${conteudo}`;
  }, [preferencias]);

  // Obter valores do formulário - com conversão de tipos correta
  const getFormValues = useCallback((): EmailPreferenciasForm => {
    if (!preferencias) return DEFAULT_PREFERENCIAS;
    
    // Converter campos que podem vir como string do banco para boolean
    const responderComCitacao = preferencias.responder_com_citacao === true || 
                                 (preferencias.responder_com_citacao as unknown) === 'true';
    
    const marcarLidoAuto = preferencias.marcar_lido_automatico === true || 
                           (preferencias.marcar_lido_automatico as unknown) === 'true';
    
    const assinaturaAtiva = preferencias.assinatura_ativa === true || 
                            (preferencias.assinatura_ativa as unknown) === 'true';
    
    // Normalizar mensagens_por_pagina para valores válidos
    const msgPorPagina = preferencias.mensagens_por_pagina;
    const mensagensPorPagina: 20 | 50 | 100 = 
      msgPorPagina === 50 ? 50 : 
      msgPorPagina === 100 ? 100 : 20;
    
    return {
      assinatura_ativa: assinaturaAtiva,
      assinatura_texto: preferencias.assinatura_texto || '',
      assinatura_html: preferencias.assinatura_html || '',
      mensagens_por_pagina: mensagensPorPagina,
      marcar_lido_automatico: marcarLidoAuto,
      pasta_padrao: preferencias.pasta_padrao || 'inbox',
      view: (preferencias.view as 'list' | 'split') || 'list',
      responder_com_citacao: responderComCitacao,
      formato_padrao: preferencias.formato_padrao || 'html'
    };
  }, [preferencias]);

  // Obter modo de visualização
  const getViewMode = useCallback((): 'list' | 'split' => {
    return (preferencias?.view as 'list' | 'split') || 'list';
  }, [preferencias]);

  // Obter quantidade de emails por página
  const getEmailsPerPage = useCallback((): 20 | 50 | 100 => {
    // Se ainda está carregando, retornar null para indicar que não está pronto
    if (loading) return 20; // valor temporário durante loading
    const value = preferencias?.mensagens_por_pagina;
    if (value === 50) return 50;
    if (value === 100) return 100;
    return 20;
  }, [preferencias, loading]);

  // Verificar se as preferências estão prontas para uso
  const isReady = !loading;

  return {
    preferencias,
    loading,
    saving,
    isReady,
    savePreferencias,
    getAssinatura,
    getAssinaturaHtml,
    getFormValues,
    getViewMode,
    getEmailsPerPage,
    refresh: loadPreferencias
  };
}
