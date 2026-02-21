import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, HelpCircle, Workflow } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { conexoesService } from '@/services/conexoesService';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFlowSelect } from '@/hooks/useFlowSelect';

const createConnectionSchema = z.object({
  nome: z.string()
    .trim()
    .min(3, 'Nome deve ter no mínimo 3 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),
  whatsapp_token: z.string()
    .trim()
    .min(50, 'Token inválido - deve ser obtido no Meta for Developers'),
  whatsapp_phone_id: z.string()
    .trim()
    .min(10, 'Phone ID inválido - obtido no painel do WhatsApp Business'),
  whatsapp_verify_token: z.string()
    .trim()
    .min(8, 'Token de verificação deve ter no mínimo 8 caracteres'),
  whatsapp_webhook_url: z.string()
    .url('URL inválida')
    .optional()
    .or(z.literal('')),
  telefone: z.string()
    .trim()
    .regex(/^\+?[\d\s()-]+$/, 'Telefone inválido')
    .optional()
    .or(z.literal('')),
  is_default: z.boolean().default(false),
  greetingmessage: z.string()
    .max(500, 'Mensagem deve ter no máximo 500 caracteres')
    .optional()
    .or(z.literal('')),
  farewellmessage: z.string()
    .max(500, 'Mensagem deve ter no máximo 500 caracteres')
    .optional()
    .or(z.literal('')),
  fluxo_boas_vindas_id: z.string().optional().or(z.literal('')),
  fluxo_resposta_padrao_id: z.string().optional().or(z.literal('')),
});

type CreateConnectionFormData = z.infer<typeof createConnectionSchema>;

interface CreateConnectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const CreateConnectionDialog = ({ open, onOpenChange, onSuccess }: CreateConnectionDialogProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { flows, loading: flowsLoading } = useFlowSelect();

  const form = useForm<CreateConnectionFormData>({
    resolver: zodResolver(createConnectionSchema),
    defaultValues: {
      nome: '',
      whatsapp_token: '',
      whatsapp_phone_id: '',
      whatsapp_verify_token: '',
      whatsapp_webhook_url: '',
      telefone: '',
      is_default: false,
      greetingmessage: '',
      farewellmessage: '',
      fluxo_boas_vindas_id: '',
      fluxo_resposta_padrao_id: '',
    },
  });

  const onSubmit = async (data: CreateConnectionFormData) => {
    setLoading(true);
    try {
      await conexoesService.createConnection({
        nome: data.nome,
        canal: 'whatsapp',
        whatsapp_token: data.whatsapp_token,
        whatsapp_phone_id: data.whatsapp_phone_id,
        whatsapp_verify_token: data.whatsapp_verify_token,
        whatsapp_webhook_url: data.whatsapp_webhook_url || undefined,
        telefone: data.telefone || undefined,
        is_default: data.is_default,
        greetingmessage: data.greetingmessage || undefined,
        farewellmessage: data.farewellmessage || undefined,
        fluxo_boas_vindas_id: data.fluxo_boas_vindas_id || undefined,
        fluxo_resposta_padrao_id: data.fluxo_resposta_padrao_id || undefined,
      });

      toast({
        title: 'Conexão criada com sucesso',
        description: 'A nova conexão WhatsApp foi configurada',
      });

      form.reset();
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      toast({
        title: 'Erro ao criar conexão',
        description: (error as Error).message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FaWhatsapp className="h-5 w-5 text-green-600" />
            Nova Conexão WhatsApp Business API
          </DialogTitle>
          <DialogDescription>
            Configure uma conexão com a API oficial do WhatsApp Business Cloud
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs defaultValue="geral" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="geral">Geral</TabsTrigger>
                <TabsTrigger value="fluxo" className="flex items-center gap-2">
                  <Workflow className="h-4 w-4" />
                  Fluxo
                </TabsTrigger>
              </TabsList>

              {/* Aba Geral */}
              <TabsContent value="geral" className="space-y-4 mt-4">
                {/* Nome da Conexão */}
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da Conexão *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: WhatsApp Principal"
                          {...field}
                          disabled={loading}
                        />
                      </FormControl>
                      <FormDescription>
                        Nome identificador para esta conexão
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* WhatsApp Access Token */}
                <FormField
                  control={form.control}
                  name="whatsapp_token"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        Token de Acesso *
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="h-4 w-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">
                                Obtenha no Meta for Developers → WhatsApp → Começar → Token de acesso permanente
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="EAAxxxxxxxxxxxxx..."
                          {...field}
                          disabled={loading}
                        />
                      </FormControl>
                      <FormDescription>
                        Token permanente da API do WhatsApp Business
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Phone Number ID */}
                <FormField
                  control={form.control}
                  name="whatsapp_phone_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        Phone Number ID *
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="h-4 w-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">
                                Encontre em: WhatsApp → Configuração da API → ID do número de telefone
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="123456789012345"
                          {...field}
                          disabled={loading}
                        />
                      </FormControl>
                      <FormDescription>
                        ID do número de telefone no WhatsApp Business
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Verify Token */}
                <FormField
                  control={form.control}
                  name="whatsapp_verify_token"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        Token de Verificação *
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="h-4 w-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">
                                Crie uma senha segura para validar o webhook. Use a mesma ao configurar no Meta.
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="minha_senha_segura_123"
                          {...field}
                          disabled={loading}
                        />
                      </FormControl>
                      <FormDescription>
                        Token para validação do webhook (mínimo 8 caracteres)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Webhook URL */}
                <FormField
                  control={form.control}
                  name="whatsapp_webhook_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL do Webhook (Opcional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://seu-backend.com/whatsapp/webhook"
                          {...field}
                          disabled={loading}
                        />
                      </FormControl>
                      <FormDescription>
                        URL onde o WhatsApp enviará as mensagens recebidas
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Telefone */}
                <FormField
                  control={form.control}
                  name="telefone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número do WhatsApp</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="+55 11 99999-9999"
                          {...field}
                          disabled={loading}
                        />
                      </FormControl>
                      <FormDescription>
                        Número de telefone associado (opcional)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Conexão Padrão */}
                <FormField
                  control={form.control}
                  name="is_default"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Conexão Padrão
                        </FormLabel>
                        <FormDescription>
                          Definir como conexão padrão para envio de mensagens
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={loading}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {/* Mensagem de Saudação */}
                <FormField
                  control={form.control}
                  name="greetingmessage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mensagem de Saudação</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Olá! Bem-vindo ao nosso atendimento..."
                          className="resize-none"
                          rows={3}
                          {...field}
                          disabled={loading}
                        />
                      </FormControl>
                      <FormDescription>
                        Mensagem automática enviada ao iniciar conversa (opcional)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Mensagem de Despedida */}
                <FormField
                  control={form.control}
                  name="farewellmessage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mensagem de Despedida</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Obrigado por entrar em contato! Até logo."
                          className="resize-none"
                          rows={3}
                          {...field}
                          disabled={loading}
                        />
                      </FormControl>
                      <FormDescription>
                        Mensagem automática enviada ao finalizar conversa (opcional)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              {/* Aba Fluxo */}
              <TabsContent value="fluxo" className="space-y-6 mt-4">
                <div className="rounded-lg border border-border bg-muted/30 p-4 mb-4">
                  <p className="text-sm text-muted-foreground">
                    Configure os fluxos automáticos que serão disparados para esta conexão do WhatsApp.
                  </p>
                </div>

                {/* Fluxo de Boas-vindas */}
                <FormField
                  control={form.control}
                  name="fluxo_boas_vindas_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        Fluxo de Boas-vindas
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="h-4 w-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-sm">
                              <p>
                                Este fluxo é disparado apenas para novos contatos, pessoas que você não possui em sua lista de contatos e que mandaram uma mensagem.
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || ''}
                        disabled={loading || flowsLoading}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um fluxo..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">Nenhum</SelectItem>
                          {flows.map((flow) => (
                            <SelectItem key={flow.id} value={flow.id}>
                              {flow.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Este fluxo é disparado apenas para novos contatos que ainda não estão na sua lista.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Fluxo de Resposta Padrão */}
                <FormField
                  control={form.control}
                  name="fluxo_resposta_padrao_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        Fluxo de Resposta Padrão
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="h-4 w-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-sm">
                              <p>
                                Resposta Padrão é enviada com qualquer caractere diferente de uma palavra chave. ATENÇÃO! Será disparada se o atendimento já estiver fechado.
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || ''}
                        disabled={loading || flowsLoading}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um fluxo..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">Nenhum</SelectItem>
                          {flows.map((flow) => (
                            <SelectItem key={flow.id} value={flow.id}>
                              {flow.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Será disparado quando o atendimento estiver fechado e o contato enviar uma mensagem.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {flows.length === 0 && !flowsLoading && (
                  <div className="rounded-lg border border-dashed border-border p-6 text-center">
                    <Workflow className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Nenhum fluxo ativo encontrado. Crie um fluxo no Flow Builder primeiro.
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Criar Conexão
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateConnectionDialog;
