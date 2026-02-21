import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, MapPin, UserCheck, Users } from 'lucide-react';
import { formatCPFCNPJ, formatCEP, formatPhone } from '@/lib/formatters';

interface CNPJData {
  alias: string;
  company: {
    name: string;
  };
  address: {
    street: string;
    number: string;
    details: string | null;
    zip: string;
    district: string;
    city: string;
    state: string;
  };
  phones?: Array<{ area: string; number: string }>;
}

export interface EnderecoData {
  cnpjcpf: string;
  nome: string;
  telefone: string;
  cep: string;
  endereco: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
}

interface EnderecoFormSectionProps {
  tipo: 'remetente' | 'destinatario';
  data: EnderecoData;
  onChange: (data: EnderecoData) => void;
  required?: boolean;
}

export const EnderecoFormSection = ({ tipo, data, onChange, required = false }: EnderecoFormSectionProps) => {
  const [isLoadingCNPJ, setIsLoadingCNPJ] = useState(false);
  const [isLoadingCEP, setIsLoadingCEP] = useState(false);

  const isRemetente = tipo === 'remetente';
  const title = isRemetente ? 'Dados do Remetente' : 'Dados do Destinatário';
  const description = isRemetente 
    ? 'Quem está enviando a mercadoria?' 
    : 'Quem receberá a mercadoria?';
  const Icon = isRemetente ? UserCheck : Users;

  const handleChange = (field: keyof EnderecoData, value: string) => {
    onChange({ ...data, [field]: value });
  };

  // Usar a mesma API da página /cotacao
  const fetchCNPJData = async (cnpj: string): Promise<CNPJData | null> => {
    const cleanCNPJ = cnpj.replace(/\D/g, '');
    if (cleanCNPJ.length !== 14) return null;

    try {
      const response = await fetch(`https://open.cnpja.com/office/${cleanCNPJ}`, {
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(10000)
      });
      
      if (!response.ok) return null;

      const responseData = await response.json();
      return responseData;
    } catch (error) {
      console.error('Erro ao buscar dados do CNPJ:', error);
      return null;
    }
  };

  const handleCNPJBlur = async (value: string) => {
    const cleanValue = value.replace(/\D/g, '');
    
    // Só busca se for CNPJ (14 dígitos)
    if (cleanValue.length === 14) {
      setIsLoadingCNPJ(true);
      const cnpjData = await fetchCNPJData(value);
      
      if (cnpjData) {
        // Formatar telefone se disponível
        let telefone = data.telefone;
        if (cnpjData.phones && cnpjData.phones.length > 0) {
          const phone = cnpjData.phones[0];
          telefone = formatPhone(`${phone.area}${phone.number}`);
        }

        onChange({
          ...data,
          nome: cnpjData.alias || cnpjData.company?.name || '',
          cep: formatCEP(cnpjData.address?.zip || ''),
          endereco: cnpjData.address?.street || '',
          numero: cnpjData.address?.number || '',
          complemento: cnpjData.address?.details || '',
          bairro: cnpjData.address?.district || '',
          cidade: cnpjData.address?.city || '',
          uf: cnpjData.address?.state || '',
          telefone
        });
      }
      setIsLoadingCNPJ(false);
    }
  };

  const handleCEPChange = async (cep: string) => {
    const formattedCEP = formatCEP(cep);
    handleChange('cep', formattedCEP);

    const cleanCEP = cep.replace(/\D/g, '');
    if (cleanCEP.length === 8) {
      setIsLoadingCEP(true);
      try {
        const response = await fetch(`https://brasilapi.com.br/api/cep/v2/${cleanCEP}`);
        
        if (response.ok) {
          const cepData = await response.json();
          onChange({
            ...data,
            cep: formattedCEP,
            endereco: cepData.street || data.endereco,
            bairro: cepData.neighborhood || data.bairro,
            cidade: cepData.city || data.cidade,
            uf: cepData.state || data.uf
          });
        }
      } catch (error) {
        console.error('Erro ao buscar CEP:', error);
      } finally {
        setIsLoadingCEP(false);
      }
    }
  };

  const requiredMark = required ? <span className="text-destructive">*</span> : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Icon className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* CPF/CNPJ e Nome */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>CPF/CNPJ {requiredMark}</Label>
            <div className="relative">
              <Input 
                placeholder="000.000.000-00 ou 00.000.000/0000-00" 
                value={data.cnpjcpf}
                onChange={e => handleChange('cnpjcpf', formatCPFCNPJ(e.target.value))}
                onBlur={e => handleCNPJBlur(e.target.value)}
                maxLength={18}
                disabled={isLoadingCNPJ}
              />
              {isLoadingCNPJ && (
                <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
              )}
            </div>
          </div>
          <div>
            <Label>Nome/Razão Social {requiredMark}</Label>
            <Input 
              placeholder="Nome completo ou razão social" 
              value={data.nome}
              onChange={e => handleChange('nome', e.target.value)}
            />
          </div>
        </div>

        {/* Telefone */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Telefone</Label>
            <Input 
              placeholder="(00) 00000-0000" 
              value={data.telefone}
              onChange={e => handleChange('telefone', formatPhone(e.target.value))}
            />
          </div>
        </div>

        {/* Endereço */}
        <div className="pt-2">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">Endereço</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>CEP {requiredMark}</Label>
              <div className="relative">
                <Input 
                  placeholder="00000-000" 
                  value={data.cep}
                  onChange={e => handleCEPChange(e.target.value)}
                  maxLength={9}
                />
                {isLoadingCEP && (
                  <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
                )}
              </div>
            </div>
            <div className="md:col-span-3">
              <Label>Rua {requiredMark}</Label>
              <Input 
                placeholder="Nome da rua" 
                value={data.endereco}
                onChange={e => handleChange('endereco', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
            <div>
              <Label>Número {requiredMark}</Label>
              <Input 
                placeholder="123" 
                value={data.numero}
                onChange={e => handleChange('numero', e.target.value)}
              />
            </div>
            <div>
              <Label>Complemento</Label>
              <Input 
                placeholder="Apto, sala, etc." 
                value={data.complemento}
                onChange={e => handleChange('complemento', e.target.value)}
              />
            </div>
            <div>
              <Label>Bairro {requiredMark}</Label>
              <Input 
                placeholder="Bairro" 
                value={data.bairro}
                onChange={e => handleChange('bairro', e.target.value)}
              />
            </div>
            <div>
              <Label>Cidade {requiredMark}</Label>
              <Input 
                placeholder="Cidade" 
                value={data.cidade}
                onChange={e => handleChange('cidade', e.target.value)}
              />
            </div>
            <div>
              <Label>Estado {requiredMark}</Label>
              <Input 
                placeholder="UF" 
                value={data.uf}
                onChange={e => handleChange('uf', e.target.value)}
                maxLength={2}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};