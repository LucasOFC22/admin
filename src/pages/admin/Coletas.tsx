import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { CepInput } from '@/components/CepInput';
import { useCepLookup } from '@/hooks/use-cep-lookup';
import { pickupFormSchema, pickupFormDefaultValues, type PickupFormData } from '@/schemas/pickupFormSchema';
import { MapPin, User, Package, Send, Building } from 'lucide-react';
import { toast } from 'sonner';

export default function Coletas() {
  const form = useForm<PickupFormData>({
    resolver: zodResolver(pickupFormSchema),
    defaultValues: pickupFormDefaultValues,
  });

  // Hooks de busca automática de CEP para cada seção
  const coletaCep = useCepLookup(form, 'coleta');
  const remetenteCep = useCepLookup(form, 'remetente');
  const destinatarioCep = useCepLookup(form, 'destinatario');

  const onSubmit = (data: PickupFormData) => {
    console.log('Dados do formulário:', data);
    toast.success('Coleta registrada com sucesso!');
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Nova Coleta</h1>
          <p className="text-muted-foreground">Preencha os dados para solicitar uma coleta</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Seção: Solicitante */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Solicitante
                </CardTitle>
                <CardDescription>Dados de quem está solicitando a coleta</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="solicitante.nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome *</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome completo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="solicitante.telefone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone *</FormLabel>
                      <FormControl>
                        <Input placeholder="(00) 00000-0000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="solicitante.email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email *</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="email@exemplo.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Seção: Local de Coleta */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Local de Coleta
                </CardTitle>
                <CardDescription>Endereço onde a mercadoria será coletada</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-4">
                  <FormField
                    control={form.control}
                    name="coleta.cep"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CEP *</FormLabel>
                        <FormControl>
                          <CepInput
                            {...field}
                            isLoading={coletaCep.isLoading}
                            isSuccess={!!coletaCep.lastFetchedCep}
                            isError={!!coletaCep.error}
                            errorMessage={coletaCep.error || undefined}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="coleta.rua"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Rua *</FormLabel>
                        <FormControl>
                          <Input placeholder="Rua, Avenida..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="coleta.numero"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número *</FormLabel>
                        <FormControl>
                          <Input placeholder="123" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-4">
                  <FormField
                    control={form.control}
                    name="coleta.complemento"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Complemento</FormLabel>
                        <FormControl>
                          <Input placeholder="Apto, Sala..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="coleta.bairro"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bairro *</FormLabel>
                        <FormControl>
                          <Input placeholder="Bairro" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="coleta.cidade"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cidade *</FormLabel>
                        <FormControl>
                          <Input placeholder="Cidade" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="coleta.estado"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estado *</FormLabel>
                        <FormControl>
                          <Input placeholder="UF" maxLength={2} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-4">
                  <FormField
                    control={form.control}
                    name="coleta.pontoReferencia"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ponto de Referência</FormLabel>
                        <FormControl>
                          <Input placeholder="Próximo a..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <Separator />
                <div className="grid gap-4 md:grid-cols-4">
                  <FormField
                    control={form.control}
                    name="coleta.horarioFuncionamento.inicio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Horário Início *</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="coleta.horarioFuncionamento.fim"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Horário Fim *</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="coleta.horarioAlmoco.inicio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Almoço Início</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="coleta.horarioAlmoco.fim"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Almoço Fim</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Seção: Mercadoria */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Mercadoria
                </CardTitle>
                <CardDescription>Informações sobre a carga</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="mercadoria.descricao"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição *</FormLabel>
                        <FormControl>
                          <Input placeholder="Descrição da mercadoria" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="mercadoria.natureza"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Natureza</FormLabel>
                        <FormControl>
                          <Input placeholder="Natureza da carga" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="mercadoria.peso"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Peso (kg) *</FormLabel>
                        <FormControl>
                          <Input placeholder="0.00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="mercadoria.valor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor (R$) *</FormLabel>
                        <FormControl>
                          <Input placeholder="0,00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="mercadoria.quantidade"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantidade *</FormLabel>
                        <FormControl>
                          <Input placeholder="1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="mercadoria.dimensoes.comprimento"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Comprimento (cm) *</FormLabel>
                        <FormControl>
                          <Input placeholder="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="mercadoria.dimensoes.largura"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Largura (cm) *</FormLabel>
                        <FormControl>
                          <Input placeholder="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="mercadoria.dimensoes.altura"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Altura (cm) *</FormLabel>
                        <FormControl>
                          <Input placeholder="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Seção: Remetente */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Remetente
                </CardTitle>
                <CardDescription>Dados do remetente (local alternativo)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="remetente.empresa"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Empresa *</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome da empresa" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="remetente.documento"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CPF/CNPJ *</FormLabel>
                        <FormControl>
                          <Input placeholder="000.000.000-00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="remetente.telefone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone *</FormLabel>
                        <FormControl>
                          <Input placeholder="(00) 00000-0000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <Separator />
                <div className="grid gap-4 md:grid-cols-4">
                  <FormField
                    control={form.control}
                    name="remetente.cep"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CEP *</FormLabel>
                        <FormControl>
                          <CepInput
                            {...field}
                            isLoading={remetenteCep.isLoading}
                            isSuccess={!!remetenteCep.lastFetchedCep}
                            isError={!!remetenteCep.error}
                            errorMessage={remetenteCep.error || undefined}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="remetente.rua"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Rua *</FormLabel>
                        <FormControl>
                          <Input placeholder="Rua, Avenida..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="remetente.numero"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número *</FormLabel>
                        <FormControl>
                          <Input placeholder="123" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="remetente.complemento"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Complemento</FormLabel>
                        <FormControl>
                          <Input placeholder="Apto, Sala..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="remetente.bairro"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bairro *</FormLabel>
                        <FormControl>
                          <Input placeholder="Bairro" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="remetente.cidade"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cidade *</FormLabel>
                        <FormControl>
                          <Input placeholder="Cidade" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="remetente.estado"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estado *</FormLabel>
                        <FormControl>
                          <Input placeholder="UF" maxLength={2} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Seção: Destinatário */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5" />
                  Destinatário
                </CardTitle>
                <CardDescription>Dados do destinatário (local alternativo)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="destinatario.empresa"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Empresa *</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome da empresa" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="destinatario.documento"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CPF/CNPJ *</FormLabel>
                        <FormControl>
                          <Input placeholder="000.000.000-00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="destinatario.telefone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone *</FormLabel>
                        <FormControl>
                          <Input placeholder="(00) 00000-0000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <Separator />
                <div className="grid gap-4 md:grid-cols-4">
                  <FormField
                    control={form.control}
                    name="destinatario.cep"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CEP *</FormLabel>
                        <FormControl>
                          <CepInput
                            {...field}
                            isLoading={destinatarioCep.isLoading}
                            isSuccess={!!destinatarioCep.lastFetchedCep}
                            isError={!!destinatarioCep.error}
                            errorMessage={destinatarioCep.error || undefined}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="destinatario.rua"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Rua *</FormLabel>
                        <FormControl>
                          <Input placeholder="Rua, Avenida..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="destinatario.numero"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número *</FormLabel>
                        <FormControl>
                          <Input placeholder="123" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="destinatario.complemento"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Complemento</FormLabel>
                        <FormControl>
                          <Input placeholder="Apto, Sala..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="destinatario.bairro"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bairro *</FormLabel>
                        <FormControl>
                          <Input placeholder="Bairro" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="destinatario.cidade"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cidade *</FormLabel>
                        <FormControl>
                          <Input placeholder="Cidade" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="destinatario.estado"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estado *</FormLabel>
                        <FormControl>
                          <Input placeholder="UF" maxLength={2} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Observações */}
            <Card>
              <CardHeader>
                <CardTitle>Observações</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="observacoes"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea placeholder="Observações adicionais..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Botão de Submit */}
            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={() => form.reset()}>
                Limpar
              </Button>
              <Button type="submit">
                Registrar Coleta
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
