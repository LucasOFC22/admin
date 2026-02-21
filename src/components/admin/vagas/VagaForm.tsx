import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { VagaEmprego, CreateVagaData } from '@/types/vagas';

const vagaSchema = z.object({
  titulo: z.string().min(3, 'Título deve ter no mínimo 3 caracteres'),
  cidade: z.string().min(2, 'Cidade é obrigatória'),
  descricao: z.string().min(10, 'Descrição deve ter no mínimo 10 caracteres'),
  requisitos: z.string().optional(),
  vagas: z.coerce.number().min(1, 'Mínimo 1 vaga').default(1),
  ativo: z.boolean().default(true),
});

type VagaFormData = z.infer<typeof vagaSchema>;

interface VagaFormProps {
  vaga?: VagaEmprego;
  onSubmit: (data: CreateVagaData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const VagaForm: React.FC<VagaFormProps> = ({ vaga, onSubmit, onCancel, isLoading }) => {
  const form = useForm<VagaFormData>({
    resolver: zodResolver(vagaSchema),
    defaultValues: {
      titulo: vaga?.titulo || '',
      cidade: vaga?.cidade || '',
      descricao: vaga?.descricao || '',
      requisitos: vaga?.requisitos || '',
      vagas: vaga?.vagas ?? 1,
      ativo: vaga?.ativo ?? true,
    },
  });

  const handleSubmit = (data: VagaFormData) => {
    onSubmit({
      titulo: data.titulo,
      cidade: data.cidade,
      descricao: data.descricao,
      requisitos: data.requisitos,
      vagas: data.vagas,
      ativo: data.ativo,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="titulo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título da Vaga</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Auxiliar Logístico" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="cidade"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cidade</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Blumenau" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="descricao"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Descreva as atividades e responsabilidades da vaga..."
                  rows={5}
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="requisitos"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Requisitos (opcional)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Liste os requisitos necessários para a vaga..."
                  rows={4}
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="vagas"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Quantidade de Vagas</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  min={1}
                  placeholder="1"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="ativo"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-lg border border-border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Vaga Ativa</FormLabel>
                <p className="text-sm text-muted-foreground">
                  Vagas ativas são exibidas no site
                </p>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex gap-4 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading} className="flex-1">
            {isLoading ? 'Salvando...' : vaga ? 'Atualizar Vaga' : 'Criar Vaga'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default VagaForm;
