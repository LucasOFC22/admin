import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useMensagensRapidas } from '@/hooks/useMensagensRapidas';
import { MensagemRapida, CreateMensagemRapidaData } from '@/services/mensagensRapidas/mensagensRapidasService';
import { availableVariables } from '@/utils/messageVariables';
import { Variable, Copy, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { toast } from '@/lib/toast';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const formSchema = z.object({
  comando: z
    .string()
    .min(1, 'Comando é obrigatório')
    .regex(/^[a-z0-9_-]+$/, 'Apenas letras minúsculas, números, - e _')
    .max(50, 'Comando deve ter no máximo 50 caracteres'),
  titulo: z.string().min(1, 'Título é obrigatório').max(100, 'Título deve ter no máximo 100 caracteres'),
  conteudo: z.string().min(1, 'Conteúdo é obrigatório').max(2000, 'Conteúdo deve ter no máximo 2000 caracteres'),
});

type FormData = z.infer<typeof formSchema>;

interface MensagemRapidaModalProps {
  isOpen: boolean;
  onClose: () => void;
  mensagem: MensagemRapida | null;
}

const MensagemRapidaModal = ({ isOpen, onClose, mensagem }: MensagemRapidaModalProps) => {
  const { criar, atualizar, isCriando, isAtualizando } = useMensagensRapidas();
  const [showVariables, setShowVariables] = useState(false);
  const isEditing = !!mensagem;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      comando: '',
      titulo: '',
      conteudo: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (mensagem) {
        form.reset({
          comando: mensagem.comando,
          titulo: mensagem.titulo,
          conteudo: mensagem.conteudo,
        });
      } else {
        form.reset({
          comando: '',
          titulo: '',
          conteudo: '',
        });
      }
    }
  }, [isOpen, mensagem, form]);

  const onSubmit = (data: FormData) => {
    // Garantir que todos os campos estão presentes
    const formattedData: CreateMensagemRapidaData = {
      comando: data.comando,
      titulo: data.titulo,
      conteudo: data.conteudo
    };
    
    if (isEditing && mensagem) {
      atualizar(
        { 
          id: mensagem.id, 
          data: formattedData
        },
        {
          onSuccess: () => {
            onClose();
          },
        }
      );
    } else {
      criar(formattedData, {
        onSuccess: () => {
          onClose();
        },
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Variável copiada!');
  };

  const insertVariable = (variable: string) => {
    const currentContent = form.getValues('conteudo');
    form.setValue('conteudo', currentContent + variable);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Mensagem Rápida' : 'Nova Mensagem Rápida'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="comando"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Comando</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">/</span>
                      <Input
                        placeholder="exemplo: ola, bem-vindo, horario"
                        {...field}
                        disabled={isCriando || isAtualizando}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                  <p className="text-xs text-gray-500">
                    Use apenas letras minúsculas, números, hífen (-) e underscore (_)
                  </p>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="titulo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Título descritivo da mensagem"
                      {...field}
                      disabled={isCriando || isAtualizando}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="conteudo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Conteúdo</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Digite o conteúdo da mensagem rápida. Use variáveis como {{nome_cliente}} para personalização automática."
                      rows={6}
                      {...field}
                      disabled={isCriando || isAtualizando}
                    />
                  </FormControl>
                  <FormMessage />
                  <p className="text-xs text-muted-foreground">
                    Este texto será inserido automaticamente no chat ao selecionar este comando.
                    As variáveis serão substituídas pelos dados reais do contato.
                  </p>
                </FormItem>
              )}
            />

            {/* Seção de Variáveis Disponíveis */}
            <Collapsible open={showVariables} onOpenChange={setShowVariables}>
              <CollapsibleTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Variable className="h-4 w-4" />
                    <span>Variáveis Disponíveis</span>
                  </div>
                  {showVariables ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3">
                <div className="bg-muted/30 rounded-lg p-3 mb-3">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-muted-foreground">
                      Clique em uma variável para inserir no conteúdo. As variáveis serão substituídas automaticamente pelos dados reais quando a mensagem for selecionada no chat.
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                  {availableVariables.slice(0, 12).map((variable) => (
                    <div 
                      key={variable.variable}
                      className="flex items-center justify-between p-2 bg-muted/20 rounded border border-border/50 hover:border-primary/30 transition-colors group cursor-pointer"
                      onClick={() => insertVariable(variable.variable)}
                    >
                      <div className="flex-1 min-w-0">
                        <code className="text-[10px] font-mono text-primary bg-primary/10 px-1 py-0.5 rounded">
                          {variable.variable}
                        </code>
                        <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                          {variable.description}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(variable.variable);
                        }}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isCriando || isAtualizando}>
                {isCriando || isAtualizando
                  ? 'Salvando...'
                  : isEditing
                  ? 'Atualizar'
                  : 'Criar'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default MensagemRapidaModal;
