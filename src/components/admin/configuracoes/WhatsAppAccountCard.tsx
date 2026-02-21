import { useState, useEffect } from 'react';
import { RefreshCw, Copy } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { requireAuthenticatedClient } from '@/config/supabaseAuth';
import { cn } from '@/lib/utils';

interface WhatsAppInfoData {
  phone?: {
    id?: string;
    display_phone_number?: string;
    verified_name?: string;
    quality_rating?: string;
    messaging_limit_tier?: string;
    messaging_limit_display?: string;
  };
  profile_picture_url?: string | null;
  account?: {
    id?: string;
    name?: string;
    account_review_status?: string;
    business_verification_status?: string;
    credit_line_status?: string;
  };
  connection?: {
    id?: string;
    nome?: string;
    status?: string;
    telefone?: string;
  };
}

const WhatsAppAccountCard = () => {
  const [data, setData] = useState<WhatsAppInfoData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    try {
      const supabase = requireAuthenticatedClient();
      // Primeiro buscar conexaoId
      const { data: conexao, error: conexaoError } = await supabase
        .from('conexoes')
        .select('id')
        .limit(1)
        .maybeSingle();

      if (conexaoError || !conexao) {
        console.error('Erro ao buscar conexão:', conexaoError);
        setLoading(false);
        return;
      }

      // Chamar edge function com conexaoId
      const { data: response, error } = await supabase.functions.invoke('whatsapp-business-info', {
        body: { conexaoId: conexao.id }
      });

      if (error) {
        console.error('Erro ao buscar info WhatsApp:', error);
      } else if (response) {
        setData(response);
      }
    } catch (error) {
      console.error('Erro ao buscar info WhatsApp:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: `${label} copiado para a área de transferência.`,
    });
  };

  const getMessagingLimitDisplay = (tier?: string, display?: string) => {
    if (display) return display;
    const limits: Record<string, string> = {
      'TIER_1K': '1.000 Conversas / 24 horas',
      'TIER_10K': '10.000 Conversas / 24 horas',
      'TIER_100K': '100.000 Conversas / 24 horas',
      'TIER_UNLIMITED': 'Ilimitado',
    };
    return limits[tier || ''] || '1.000 Conversas / 24 horas';
  };

  const getStatusLabel = (status?: string) => {
    const labels: Record<string, string> = {
      'CONNECTED': 'Conectado',
      'DISCONNECTED': 'Desconectado',
      'connected': 'Conectado',
      'disconnected': 'Desconectado',
    };
    return labels[status || ''] || status || 'Conectado';
  };

  const getVerificationLabel = (status?: string) => {
    const labels: Record<string, string> = {
      'verified': 'Verificado',
      'VERIFIED': 'Verificado',
      'pending': 'Pendente',
      'PENDING': 'Pendente',
      'not_verified': 'Não verificado',
    };
    return labels[status || ''] || 'Verificado';
  };

  const getAccountStatusLabel = (status?: string) => {
    const labels: Record<string, string> = {
      'APPROVED': 'Aprovado',
      'approved': 'Aprovado',
      'PENDING': 'Pendente',
      'pending': 'Pendente',
      'REJECTED': 'Rejeitado',
    };
    return labels[status || ''] || 'Aprovado';
  };

  const getCreditLineLabel = (status?: string) => {
    const labels: Record<string, string> = {
      'SHARED': 'Compartilhado',
      'shared': 'Compartilhado',
      'NONE': 'Nenhum',
    };
    return labels[status || ''] || 'Compartilhado';
  };

  const getStatusColor = (status?: string) => {
    const green = ['CONNECTED', 'connected', 'APPROVED', 'approved', 'verified', 'VERIFIED'];
    const yellow = ['PENDING', 'pending', 'in_review'];
    const normalized = status?.toLowerCase() || '';
    
    if (green.some(s => s.toLowerCase() === normalized)) return 'text-green-600';
    if (yellow.some(s => s.toLowerCase() === normalized)) return 'text-yellow-600';
    return 'text-red-600';
  };

  const displayName = data?.phone?.verified_name || data?.account?.name || 'WhatsApp Business';
  const phoneNumber = data?.phone?.display_phone_number || data?.connection?.telefone || '';
  const accountId = data?.account?.id || '';
  const connectionStatus = data?.connection?.status || 'connected';
  const verificationStatus = data?.account?.business_verification_status || 'verified';
  const accountStatus = data?.account?.account_review_status || 'APPROVED';
  const creditLine = data?.account?.credit_line_status || 'SHARED';
  const messagingLimit = getMessagingLimitDisplay(data?.phone?.messaging_limit_tier, data?.phone?.messaging_limit_display);
  const profilePictureUrl = data?.profile_picture_url;
  return (
    <div className="border rounded-xl bg-card overflow-hidden shadow-sm">
      {/* Linha superior */}
      <div className="px-6 py-5 flex items-center gap-5 border-b border-border/50">
        {/* Avatar */}
        <Avatar className="h-14 w-14 border-2 border-green-500 ring-2 ring-green-500/20">
          {loading ? (
            <Skeleton className="h-full w-full rounded-full" />
          ) : profilePictureUrl ? (
            <AvatarImage src={profilePictureUrl} alt={displayName} />
          ) : null}
          <AvatarFallback className="bg-green-500/10 text-green-600 text-lg font-semibold">
            {displayName.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        {/* Grid de informações - primeira linha */}
        <div className="flex-1 grid grid-cols-4 gap-8">
          {/* Exibir nome */}
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground font-medium">Exibir nome</span>
            {loading ? (
              <Skeleton className="h-5 w-36" />
            ) : (
              <span className="font-medium text-primary text-sm truncate max-w-[180px] block" title={displayName}>
                {displayName}
              </span>
            )}
          </div>

          {/* Número conectado */}
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground font-medium">Número conectado</span>
            {loading ? (
              <Skeleton className="h-5 w-32" />
            ) : (
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-foreground text-sm">
                  {phoneNumber || 'N/A'}
                </span>
                {phoneNumber && (
                  <button 
                    onClick={() => copyToClipboard(phoneNumber, 'Número')}
                    className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Limites de mensagens */}
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground font-medium">Limites de mensagens</span>
            {loading ? (
              <Skeleton className="h-5 w-40" />
            ) : (
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-foreground text-sm">
                  {messagingLimit}
                </span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-muted-foreground cursor-help">ⓘ</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Limite de conversas iniciadas pela empresa em 24 horas</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            )}
          </div>

          {/* Status do número */}
          <div className="space-y-1 flex flex-col items-end">
            <div className="flex items-center gap-2">
              <button 
                onClick={fetchData}
                disabled={loading}
                className="text-muted-foreground hover:text-foreground transition-colors text-xs flex items-center gap-1"
              >
                <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
                Atualizar dados
              </button>
            </div>
            <div className="space-y-1 text-right">
              <span className="text-xs text-muted-foreground font-medium">Status do número</span>
              {loading ? (
                <Skeleton className="h-5 w-20 ml-auto" />
              ) : (
                <span className={cn("font-medium text-sm block", getStatusColor(connectionStatus))}>
                  {getStatusLabel(connectionStatus)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Linha inferior */}
      <div className="px-6 py-5">
        <div className="grid grid-cols-4 gap-8 ml-[76px]">
          {/* ID da conta do WhatsApp Business */}
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground font-medium">ID da conta do WhatsApp Business</span>
            {loading ? (
              <Skeleton className="h-5 w-36" />
            ) : (
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-primary text-sm">
                  {accountId || 'N/A'}
                </span>
                {accountId && (
                  <button 
                    onClick={() => copyToClipboard(accountId, 'ID da conta')}
                    className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Verificação Empresarial */}
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground font-medium">Verificação Empresarial</span>
            {loading ? (
              <Skeleton className="h-5 w-24" />
            ) : (
              <div className="flex items-center gap-1.5">
                <span className={cn("font-medium text-sm", getStatusColor(verificationStatus))}>
                  {getVerificationLabel(verificationStatus)}
                </span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-muted-foreground cursor-help">ⓘ</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Status de verificação empresarial junto à Meta</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            )}
          </div>

          {/* Status da conta */}
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground font-medium">Status da conta</span>
            {loading ? (
              <Skeleton className="h-5 w-20" />
            ) : (
              <span className={cn("font-medium text-sm", getStatusColor(accountStatus))}>
                {getAccountStatusLabel(accountStatus)}
              </span>
            )}
          </div>

          {/* Linha de crédito */}
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground font-medium">Linha de crédito</span>
            {loading ? (
              <Skeleton className="h-5 w-28" />
            ) : (
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-foreground text-sm">
                  {getCreditLineLabel(creditLine)}
                </span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-muted-foreground cursor-help">ⓘ</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Tipo de linha de crédito para mensagens pagas</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppAccountCard;
