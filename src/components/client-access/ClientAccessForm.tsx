
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Send, User, Building, Mail, Phone, FileText, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { solicitacaoAcessoService } from '@/services/supabase/solicitacaoAcessoService';

const clientAccessSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  empresa: z.string().min(2, 'Nome da empresa é obrigatório'),
  email: z.string().email('Email inválido'),
  telefone: z.string().min(10, 'Telefone deve ter pelo menos 10 dígitos'),
  cnpj: z.string().optional(),
  cargo: z.string().optional(),
  motivo: z.string().min(10, 'Descreva o motivo para solicitar acesso (mínimo 10 caracteres)'),
});

type ClientAccessFormData = z.infer<typeof clientAccessSchema>;

const ClientAccessForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();

  const form = useForm<ClientAccessFormData>({
    resolver: zodResolver(clientAccessSchema),
    defaultValues: {
      nome: '',
      empresa: '',
      email: '',
      telefone: '',
      cnpj: '',
      cargo: '',
      motivo: '',
    },
  });

  const onSubmit = async (data: ClientAccessFormData) => {
    setIsSubmitting(true);

    try {
      console.log('📤 Salvando solicitação de acesso no Supabase:', data);

      // Salvar no Supabase usando o serviço
      const solicitacao = await solicitacaoAcessoService.criarSolicitacao({
        nome: data.nome,
        empresa: data.empresa,
        email: data.email,
        telefone: data.telefone,
        cnpj: data.cnpj,
        cargo: data.cargo,
        motivo: data.motivo,
        source: 'client_access_form'
      });

      console.log('✅ Solicitação salva no Supabase:', solicitacao);
      
      setIsSuccess(true);
      toast({
        title: "Solicitação registrada!",
        description: "Sua solicitação de acesso foi registrada com sucesso no banco de dados.",
      });

      // Reset form after success
      setTimeout(() => {
        setIsSuccess(false);
        form.reset();
      }, 3000);

    } catch (error) {
      console.error('❌ Erro ao registrar solicitação:', error);
      toast({
        title: "Erro ao registrar",
        description: error instanceof Error ? error.message : "Não foi possível registrar sua solicitação. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center space-y-6 p-8"
      >
        <div className="w-20 h-20 bg-gradient-to-br from-corporate-400 to-corporate-600 rounded-full flex items-center justify-center mx-auto shadow-lg">
          <CheckCircle2 className="h-10 w-10 text-white" />
        </div>
        <div className="space-y-3">
          <h3 className="text-2xl font-bold text-gray-900">Solicitação Registrada!</h3>
          <p className="text-gray-600 max-w-md mx-auto leading-relaxed">
            Sua solicitação de acesso foi registrada com sucesso no banco de dados. Nossa equipe analisará e entrará em contato em breve.
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="w-full">
      <div className="p-6 lg:p-8 border-b border-border">
        <h2 className="flex items-center gap-3 text-xl font-semibold text-foreground">
          <div className="w-10 h-10 bg-corporate-100 rounded-lg flex items-center justify-center">
            <User className="h-5 w-5 text-corporate-600" />
          </div>
          Formulário de Solicitação
        </h2>
        <p className="text-muted-foreground mt-2">
          Preencha os dados abaixo para solicitar acesso
        </p>
      </div>
      <div className="p-6 lg:p-8">

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Dados Pessoais */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
              <div className="w-8 h-8 bg-corporate-100 rounded-lg flex items-center justify-center">
                <User className="h-4 w-4 text-corporate-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900">Dados Pessoais</h4>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="nome" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <span>Nome Completo</span>
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="nome"
                  {...form.register('nome')}
                  placeholder="Digite seu nome completo"
                  className="h-12 border-gray-300 focus:border-corporate-500 focus:ring-corporate-500"
                />
                {form.formState.errors.nome && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                    {form.formState.errors.nome.message}
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <Label htmlFor="cargo" className="text-sm font-medium text-gray-700">
                  Cargo
                </Label>
                <Input
                  id="cargo"
                  {...form.register('cargo')}
                  placeholder="Seu cargo na empresa"
                  className="h-12 border-gray-300 focus:border-corporate-500 focus:ring-corporate-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span>Email</span>
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  {...form.register('email')}
                  placeholder="seu@email.com"
                  className="h-12 border-gray-300 focus:border-corporate-500 focus:ring-corporate-500"
                />
                {form.formState.errors.email && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <Label htmlFor="telefone" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span>Telefone</span>
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="telefone"
                  {...form.register('telefone')}
                  placeholder="(11) 99999-9999"
                  className="h-12 border-gray-300 focus:border-corporate-500 focus:ring-corporate-500"
                />
                {form.formState.errors.telefone && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                    {form.formState.errors.telefone.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Dados da Empresa */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
              <div className="w-8 h-8 bg-corporate-100 rounded-lg flex items-center justify-center">
                <Building className="h-4 w-4 text-corporate-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900">Dados da Empresa</h4>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="empresa" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <span>Nome da Empresa</span>
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="empresa"
                  {...form.register('empresa')}
                  placeholder="Nome da sua empresa"
                  className="h-12 border-gray-300 focus:border-corporate-500 focus:ring-corporate-500"
                />
                {form.formState.errors.empresa && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                    {form.formState.errors.empresa.message}
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <Label htmlFor="cnpj" className="text-sm font-medium text-gray-700">
                  CNPJ
                </Label>
                <Input
                  id="cnpj"
                  {...form.register('cnpj')}
                  placeholder="00.000.000/0000-00"
                  className="h-12 border-gray-300 focus:border-corporate-500 focus:ring-corporate-500"
                />
              </div>
            </div>
          </div>

          {/* Motivo da Solicitação */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
              <div className="w-8 h-8 bg-corporate-100 rounded-lg flex items-center justify-center">
                <FileText className="h-4 w-4 text-corporate-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900">Motivo da Solicitação</h4>
            </div>

            <div className="space-y-3">
              <Label htmlFor="motivo" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <span>Descreva o motivo para solicitar acesso</span>
                <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="motivo"
                {...form.register('motivo')}
                placeholder="Explique por que precisa de acesso à área de cliente, qual o seu relacionamento com a empresa, etc..."
                rows={5}
                className="border-gray-300 focus:border-corporate-500 focus:ring-corporate-500 resize-none"
              />
              {form.formState.errors.motivo && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                  {form.formState.errors.motivo.message}
                </p>
              )}
            </div>
          </div>

          <div className="pt-6">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-14 bg-gradient-to-r from-corporate-600 to-corporate-800 hover:from-corporate-700 hover:to-corporate-900 text-white font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200"
              size="lg"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                  Registrando Solicitação...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 mr-3" />
                  Registrar Solicitação de Acesso
                </>
              )}
            </Button>

            <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600 text-center leading-relaxed">
                <span className="font-medium">🔒 Privacidade garantida:</span> Ao registrar esta solicitação, você concorda que seus dados sejam utilizados 
                para análise e eventual concessão de acesso à área de cliente. Seus dados são protegidos e não serão compartilhados com terceiros.
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClientAccessForm;
