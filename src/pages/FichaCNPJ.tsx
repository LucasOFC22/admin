import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  Mail, 
  FileText, 
  User2, 
  Calendar,
  Clock
} from 'lucide-react';
import { requireAuthenticatedClient } from '@/config/supabaseAuth';
import { useAuthState } from '@/hooks/useAuthState';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface UsuarioData {
  id: number;
  nome: string;
  email: string;
  cargo?: number;
  cargo_nome?: string;
  departamento_nome?: string;
  telefone?: string;
  cnpjcpf?: string;
  ativo: boolean;
  data_criacao?: string;
  data_ultima_atividade?: string;
  acesso_area_cliente: boolean;
  acesso_area_admin: boolean;
}

const FichaCNPJ = () => {
  const { userEmail } = useAuthState();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<UsuarioData | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!userEmail) return;

      try {
        setLoading(true);
        
        // Buscar dados completos do usuário com cargo e departamento
        const supabase = requireAuthenticatedClient();
        const { data, error } = await supabase
          .from('usuarios')
          .select(`
            *,
            cargo:cargos(nome, departamento:cargos_departamento(nome))
          `)
          .eq('email', userEmail)
          .single();

        if (error) throw error;

        if (data) {
          setUserData({
            ...data,
            cargo_nome: data.cargo?.nome,
            departamento_nome: data.cargo?.departamento?.nome
          });
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar seus dados',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userEmail, toast]);

  const formatCNPJCPF = (value?: string) => {
    if (!value) return 'Não informado';
    
    // Remove caracteres não numéricos
    const numbers = value.replace(/\D/g, '');
    
    // Formata CPF (11 dígitos)
    if (numbers.length === 11) {
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    
    // Formata CNPJ (14 dígitos)
    if (numbers.length === 14) {
      return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
    
    return value;
  };

  const formatPhone = (value?: string) => {
    if (!value) return 'Não informado';
    const numbers = value.replace(/\D/g, '');
    
    if (numbers.length === 11) {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    if (numbers.length === 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    
    return value;
  };

  const formatDate = (date?: string) => {
    if (!date) return 'Não informado';
    try {
      return format(new Date(date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    } catch {
      return 'Data inválida';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="text-muted-foreground">Carregando seus dados...</p>
      </div>
    );
  }

  if (!userData) {
    return (
      <Card>
        <CardContent className="pt-6 flex flex-col items-center justify-center py-12">
          <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-center text-lg">Nenhum dado encontrado</p>
          <p className="text-muted-foreground text-center text-sm mt-2">
            Entre em contato com o suporte para atualizar suas informações
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Meus Dados</h1>
          <p className="text-muted-foreground mt-2">
            Informações cadastrais e de acesso
          </p>
        </div>
        <Badge variant={userData.ativo ? "default" : "secondary"} className="text-sm px-3 py-1">
          {userData.ativo ? "Ativo" : "Inativo"}
        </Badge>
      </div>

      {/* Cards Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Dados Pessoais */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User2 className="h-5 w-5 text-primary" />
              Dados Pessoais
            </CardTitle>
            <CardDescription>
              Informações básicas do seu cadastro
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome" className="text-xs uppercase text-muted-foreground font-semibold">
                Nome Completo
              </Label>
              <Input
                id="nome"
                value={userData.nome}
                disabled
                className="bg-muted border-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cpf-cnpj" className="text-xs uppercase text-muted-foreground font-semibold">
                CPF/CNPJ
              </Label>
              <Input
                id="cpf-cnpj"
                value={formatCNPJCPF(userData.cnpjcpf)}
                disabled
                className="bg-muted border-none"
              />
            </div>
          </CardContent>
        </Card>

        {/* Contato */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              Informações de Contato
            </CardTitle>
            <CardDescription>
              E-mail e telefone de contato
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs uppercase text-muted-foreground font-semibold">
                E-mail
              </Label>
              <Input
                id="email"
                value={userData.email}
                disabled
                className="bg-muted border-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefone" className="text-xs uppercase text-muted-foreground font-semibold">
                Telefone
              </Label>
              <Input
                id="telefone"
                value={formatPhone(userData.telefone)}
                disabled
                className="bg-muted border-none"
              />
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Informações do Sistema */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Informações do Sistema
          </CardTitle>
          <CardDescription>
            Datas e histórico de atividade
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-xs uppercase text-muted-foreground font-semibold flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5" />
                Data de Cadastro
              </Label>
              <Input
                value={formatDate(userData.data_criacao)}
                disabled
                className="bg-muted border-none"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs uppercase text-muted-foreground font-semibold flex items-center gap-2">
                <Clock className="h-3.5 w-3.5" />
                Última Atividade
              </Label>
              <Input
                value={formatDate(userData.data_ultima_atividade)}
                disabled
                className="bg-muted border-none"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Footer Info */}
      <Card className="border-muted bg-muted/50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3 text-sm text-muted-foreground">
            <FileText className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-foreground mb-1">Precisa atualizar alguma informação?</p>
              <p>
                Entre em contato com nosso suporte através do e-mail{' '}
                <a href="mailto:comercial@fptranscargas.com.br" className="text-primary hover:underline">
                  comercial@fptranscargas.com.br
                </a>
                {' '}ou telefone{' '}
                <a href="tel:+5575981222015" className="text-primary hover:underline">
                  (75) 98122-2015
                </a>
                .
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FichaCNPJ;
