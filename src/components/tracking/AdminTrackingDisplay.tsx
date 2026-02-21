import React from 'react';
import { formatDate as formatDateFromUtils } from '@/utils/dateFormatters';
import { 
  MapPin, 
  Package, 
  FileText, 
  Truck, 
  Calendar, 
  User, 
  Clock,
  Building,
  Weight,
  DollarSign,
  Info,
  CheckCircle,
  List,
  Hash,
  CreditCard
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { formatCnpjCpf } from '@/lib/utils';

// Interface para dados de CT-e (quando não é coleta)
interface CTeData {
  success: boolean;
  data: {
    idInterno?: number;
    nroNf?: string;
    chaveNfe?: string;
    nroConhec?: number;
    vlrTotal?: number;
    destinatario?: string;
    cnpjCpfDestinatario?: string;
    remetente?: string;
    cnpjCpfDestinatario1?: string;
    emissaoNfe?: string;
    emissaoCte?: string;
    volumes?: number;
    ultimoStatus?: string;
    codigoUltimoStatus?: string;
    dataUltimoStatus?: string;
    possuiComprovante?: string;
    ocorrencias?: Array<{
      descricaoOcorrencia?: string;
      codigoOcorrencia?: string;
      dataOcorrencia?: string;
      horaOcorrencia?: string;
      finalizadora?: string;
    }>;
  };
}

// Interface para dados de Coleta
interface ColetaData {
  success: boolean;
  data: {
    nroNf?: string;
    remetente?: string;
    destinatario?: string;
    cnpjCpfDestinatario?: string;
    ultimoStatus?: string;
    dataUltimoStatus?: string;
    volumes?: number;
    peso?: number;
    ocorrencias?: Array<{
      data?: string;
      descricao?: string;
      tipo?: string;
    }>;
    nroColeta?: number;
    cidadeOrigem?: string;
    cidadeDestino?: string;
    ufOrigem?: string;
    ufDestino?: string;
    origem?: string;
    coletaOriginal?: {
      descTipoRegistro?: string;
      idColeta?: number;
      idEmpresa?: number;
      placa?: string;
      condutor?: string;
      emissao?: string;
      nroColeta?: number;
      dias?: number;
      solicitante?: string;
      remetente?: string;
      coletaCidade?: string;
      coletaUf?: string;
      coletaBairro?: string;
      coletaEnd?: string;
      diaColeta?: string;
      horaColeta?: string;
      almoco?: string;
      tPeso?: number;
      tVlrMerc?: number;
      obs?: string;
      dataEntrega?: string;
      situacao?: string;
      condutor1?: string;
      placa1?: string;
    };
    totalColetasEncontradas?: number;
    outrasColetas?: Array<{
      nroColeta?: number;
    }>;
  };
}

interface AdminTrackingDisplayProps {
  data: ColetaData | CTeData;
}

// Formatar data ISO para formato legível
const formatDate = (dateStr?: string): string => {
  if (!dateStr) return '-';
  // If already in DD/MM/YYYY format, return as-is
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) return dateStr;
  return formatDateFromUtils(dateStr);
};
// Mapear situação para cor do badge
const getSituacaoColor = (situacao?: string): string => {
  const s = situacao?.toUpperCase() || '';
  if (s.includes('REALIZADA') || s.includes('ENTREGUE')) return 'bg-green-500 hover:bg-green-600';
  if (s.includes('PENDENTE') || s.includes('AGUARDANDO')) return 'bg-yellow-500 hover:bg-yellow-600';
  if (s.includes('CANCELAD')) return 'bg-red-500 hover:bg-red-600';
  if (s.includes('PROCESSAMENTO') || s.includes('TRANSITO') || s.includes('DEPOSITO')) return 'bg-blue-500 hover:bg-blue-600';
  return 'bg-primary hover:bg-primary/90';
};

// Verifica se é uma coleta
const isColeta = (data: ColetaData | CTeData): data is ColetaData => {
  return 'data' in data && (data.data as any)?.origem === 'coleta';
};

export const AdminTrackingDisplay: React.FC<AdminTrackingDisplayProps> = ({ data }) => {
  const isColetaData = isColeta(data);
  
  if (isColetaData) {
    return <ColetaDisplay data={data} />;
  }
  
  return <CTeDisplay data={data as CTeData} />;
};

// Componente para exibição de CT-e
const CTeDisplay: React.FC<{ data: CTeData }> = ({ data }) => {
  const d = data.data;
  
  return (
    <div className="space-y-4">
      {/* Status Card */}
      <Card className="overflow-hidden border border-border">
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 p-5 sm:p-8 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white/10 rounded-lg">
                <FileText className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div>
                <h2 className="text-lg sm:text-2xl font-bold">CT-e Localizado</h2>
                <p className="text-white/80 text-sm">
                  CT-e Nº {d.nroConhec || '-'}
                  {d.nroNf && ` • NF ${d.nroNf}`}
                </p>
              </div>
            </div>
            <div className="text-left sm:text-right">
              <Badge className={`${getSituacaoColor(d.ultimoStatus)} text-white px-3 py-1.5 text-sm font-semibold`}>
                {d.ultimoStatus || 'Em processamento'}
              </Badge>
              {d.dataUltimoStatus && (
                <p className="text-sm text-white/80 mt-2">
                  {formatDate(d.dataUltimoStatus)}
                </p>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Main Info Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Remetente/Destinatário */}
        <Card className="border border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="p-1.5 bg-blue-600 rounded-md">
                <Building className="h-4 w-4 text-white" />
              </div>
              Partes Envolvidas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 bg-muted/30 rounded-lg border border-border/50 space-y-1">
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Remetente</p>
              <p className="font-semibold text-foreground">{d.remetente || '-'}</p>
              {d.cnpjCpfDestinatario1 && (
                <p className="text-sm text-muted-foreground">CNPJ: {formatCnpjCpf(d.cnpjCpfDestinatario1)}</p>
              )}
            </div>
            
            <div className="p-3 bg-muted/30 rounded-lg border border-border/50 space-y-1">
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Destinatário</p>
              <p className="font-semibold text-foreground">{d.destinatario || '-'}</p>
              {d.cnpjCpfDestinatario && (
                <p className="text-sm text-muted-foreground">CNPJ/CPF: {formatCnpjCpf(d.cnpjCpfDestinatario)}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Detalhes do CT-e */}
        <Card className="border border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="p-1.5 bg-blue-600 rounded-md">
                <FileText className="h-4 w-4 text-white" />
              </div>
              Detalhes do CT-e
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg border border-border/50">
              <span className="text-sm text-muted-foreground font-medium">Nº CT-e</span>
              <span className="font-bold text-foreground">{d.nroConhec || '-'}</span>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg border border-border/50">
              <span className="text-sm text-muted-foreground font-medium">Nº NF-e</span>
              <span className="font-semibold text-foreground">{d.nroNf || '-'}</span>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg border border-border/50">
              <span className="text-sm text-muted-foreground font-medium">ID Interno</span>
              <span className="font-semibold text-foreground">{d.idInterno || '-'}</span>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg border border-border/50">
              <span className="text-sm text-muted-foreground font-medium">Volumes</span>
              <span className="font-semibold text-foreground">{d.volumes || '-'}</span>
            </div>
            
            {d.vlrTotal && d.vlrTotal > 0 && (
              <div className="flex justify-between items-center p-3 bg-blue-50/50 border-blue-100 rounded-lg border">
                <span className="text-sm text-muted-foreground font-medium">Valor Total</span>
                <span className="font-bold text-lg text-blue-600">
                  R$ {d.vlrTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Datas e Chave NFe */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Datas */}
        <Card className="border border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="p-1.5 bg-blue-600 rounded-md">
                <Calendar className="h-4 w-4 text-white" />
              </div>
              Datas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {d.emissaoNfe && (
              <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg border border-border/50">
                <span className="text-sm text-muted-foreground font-medium">Emissão NF-e</span>
                <span className="font-semibold text-foreground">{formatDate(d.emissaoNfe)}</span>
              </div>
            )}
            
            {d.emissaoCte && (
              <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg border border-border/50">
                <span className="text-sm text-muted-foreground font-medium">Emissão CT-e</span>
                <span className="font-semibold text-foreground">{formatDate(d.emissaoCte)}</span>
              </div>
            )}
            
            {d.dataUltimoStatus && (
              <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg border border-border/50">
                <span className="text-sm text-muted-foreground font-medium">Último Status</span>
                <span className="font-semibold text-foreground">{formatDate(d.dataUltimoStatus)}</span>
              </div>
            )}
            
            <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg border border-border/50">
              <span className="text-sm text-muted-foreground font-medium">Comprovante</span>
              <Badge variant={d.possuiComprovante === 'S' ? 'default' : 'secondary'}>
                {d.possuiComprovante === 'S' ? 'Disponível' : 'Não disponível'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Chave NFe */}
        {d.chaveNfe && (
          <Card className="border border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <div className="p-1.5 bg-blue-600 rounded-md">
                  <CreditCard className="h-4 w-4 text-white" />
                </div>
                Chave NF-e
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-3 bg-muted/30 rounded-lg border border-border/50">
                <p className="text-xs font-mono break-all text-foreground">{d.chaveNfe}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Ocorrências */}
      {d.ocorrencias && d.ocorrencias.length > 0 && (
        <Card className="border border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="p-1.5 bg-blue-600 rounded-md">
                <List className="h-4 w-4 text-white" />
              </div>
              Histórico de Ocorrências
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {d.ocorrencias.map((oc, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg border border-border/50">
                  <div className="flex-shrink-0 mt-0.5">
                    <CheckCircle className={`h-4 w-4 ${oc.finalizadora === 'S' ? 'text-green-500' : 'text-blue-500'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground">{oc.descricaoOcorrencia}</p>
                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                      <span>{formatDate(oc.dataOcorrencia)}</span>
                      {oc.horaOcorrencia && <span>às {oc.horaOcorrencia}</span>}
                      {oc.codigoOcorrencia && <span className="text-xs">Cód: {oc.codigoOcorrencia}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Componente para exibição de Coleta (com TODOS os campos)
const ColetaDisplay: React.FC<{ data: ColetaData }> = ({ data }) => {
  const d = data.data;
  const coleta = d.coletaOriginal;
  
  return (
    <div className="space-y-4">
      {/* Status Card */}
      <Card className="overflow-hidden border border-border">
        <div className="bg-gradient-to-r from-corporate-500 via-corporate-600 to-corporate-700 p-5 sm:p-8 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white/10 rounded-lg">
                <Truck className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div>
                <h2 className="text-lg sm:text-2xl font-bold">Coleta Localizada</h2>
                <p className="text-white/80 text-sm">
                  Coleta Nº {d.nroColeta || coleta?.nroColeta || '-'}
                  {d.nroNf && ` • NF ${d.nroNf}`}
                </p>
              </div>
            </div>
            <div className="text-left sm:text-right">
              <Badge className={`${getSituacaoColor(d.ultimoStatus || coleta?.situacao)} text-white px-3 py-1.5 text-sm font-semibold`}>
                {d.ultimoStatus || coleta?.situacao || 'Em processamento'}
              </Badge>
              {(d.dataUltimoStatus || coleta?.dataEntrega) && (
                <p className="text-sm text-white/80 mt-2">
                  {formatDate(d.dataUltimoStatus || coleta?.dataEntrega)}
                </p>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Info Banner */}
      <Card className="border border-corporate-100 bg-corporate-50/50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-corporate-600 mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                Dados de Coleta
              </p>
              <p className="text-sm text-muted-foreground">
                Esta mercadoria foi localizada através do registro de coleta. 
                Alguns campos podem não estar disponíveis até a emissão do CT-e.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Info Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Remetente e Local de Coleta */}
        <Card className="border border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="p-1.5 bg-corporate-500 rounded-md">
                <MapPin className="h-4 w-4 text-white" />
              </div>
              Origem da Coleta
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 bg-muted/30 rounded-lg border border-border/50 space-y-1">
              <p className="text-xs font-semibold text-corporate-600 uppercase tracking-wider">Remetente</p>
              <p className="font-semibold text-foreground">
                {d.remetente || coleta?.remetente || '-'}
              </p>
            </div>
            
            {d.cnpjCpfDestinatario && (
              <div className="p-3 bg-muted/30 rounded-lg border border-border/50 space-y-1">
                <p className="text-xs font-semibold text-corporate-600 uppercase tracking-wider">CNPJ/CPF</p>
                <p className="font-semibold text-foreground">{formatCnpjCpf(d.cnpjCpfDestinatario)}</p>
              </div>
            )}
            
            {(coleta?.coletaCidade || coleta?.coletaUf) && (
              <div className="p-3 bg-muted/30 rounded-lg border border-border/50 space-y-1">
                <p className="text-xs font-semibold text-corporate-600 uppercase tracking-wider">Local de Coleta</p>
                <p className="font-semibold text-foreground">
                  {coleta.coletaCidade && coleta.coletaUf 
                    ? `${coleta.coletaCidade} - ${coleta.coletaUf}`
                    : coleta.coletaCidade || coleta.coletaUf || '-'
                  }
                </p>
                {coleta.coletaBairro && (
                  <p className="text-sm text-muted-foreground">{coleta.coletaBairro}</p>
                )}
              </div>
            )}

            {coleta?.coletaEnd && (
              <div className="p-3 bg-muted/30 rounded-lg border border-border/50 space-y-1">
                <p className="text-xs font-semibold text-corporate-600 uppercase tracking-wider">Endereço</p>
                <p className="text-sm text-foreground">{coleta.coletaEnd}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Detalhes da Coleta */}
        <Card className="border border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="p-1.5 bg-corporate-500 rounded-md">
                <Package className="h-4 w-4 text-white" />
              </div>
              Detalhes da Coleta
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg border border-border/50">
              <span className="text-sm text-muted-foreground font-medium">Nº Coleta</span>
              <span className="font-bold text-foreground">{d.nroColeta || coleta?.nroColeta || '-'}</span>
            </div>
            
            {coleta?.idColeta && (
              <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg border border-border/50">
                <span className="text-sm text-muted-foreground font-medium">ID Coleta</span>
                <span className="font-semibold text-foreground">{coleta.idColeta}</span>
              </div>
            )}
            
            <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg border border-border/50">
              <span className="text-sm text-muted-foreground font-medium">Volumes</span>
              <span className="font-semibold text-foreground">{d.volumes || 1}</span>
            </div>
            
            {(d.peso || coleta?.tPeso) && (d.peso || coleta?.tPeso)! > 0 && (
              <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg border border-border/50">
                <span className="text-sm text-muted-foreground font-medium">Peso Total</span>
                <span className="font-semibold text-foreground">{d.peso || coleta?.tPeso} kg</span>
              </div>
            )}
            
            {coleta?.dias !== undefined && (
              <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg border border-border/50">
                <span className="text-sm text-muted-foreground font-medium">Dias</span>
                <span className="font-semibold text-foreground">{coleta.dias}</span>
              </div>
            )}
            
            {coleta?.tVlrMerc && coleta.tVlrMerc > 0 && (
              <div className="flex justify-between items-center p-3 bg-corporate-50/50 border-corporate-100 rounded-lg border">
                <span className="text-sm text-muted-foreground font-medium">Valor da Mercadoria</span>
                <span className="font-bold text-lg text-corporate-600">
                  R$ {coleta.tVlrMerc.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Datas e Transporte */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Datas */}
        <Card className="border border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="p-1.5 bg-corporate-500 rounded-md">
                <Calendar className="h-4 w-4 text-white" />
              </div>
              Datas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {coleta?.emissao && (
              <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg border border-border/50">
                <span className="text-sm text-muted-foreground font-medium">Emissão</span>
                <span className="font-semibold text-foreground">{formatDate(coleta.emissao)}</span>
              </div>
            )}
            
            {coleta?.diaColeta && (
              <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg border border-border/50">
                <span className="text-sm text-muted-foreground font-medium">Data da Coleta</span>
                <span className="font-semibold text-foreground">{formatDate(coleta.diaColeta)}</span>
              </div>
            )}
            
            {coleta?.dataEntrega && (
              <div className="flex justify-between items-center p-3 bg-green-50/50 border-green-100 rounded-lg border">
                <span className="text-sm text-muted-foreground font-medium">Data de Entrega</span>
                <span className="font-semibold text-green-600">{formatDate(coleta.dataEntrega)}</span>
              </div>
            )}
            
            {coleta?.horaColeta && coleta.horaColeta.trim() !== ':' && coleta.horaColeta.trim() !== '  :  ' && (
              <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg border border-border/50">
                <span className="text-sm text-muted-foreground font-medium">Horário</span>
                <span className="font-semibold text-foreground">{coleta.horaColeta}</span>
              </div>
            )}
            
            {coleta?.almoco && (
              <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg border border-border/50">
                <span className="text-sm text-muted-foreground font-medium">Horário Almoço</span>
                <span className="font-semibold text-foreground">{coleta.almoco}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Transporte (Motorista e Placa) */}
        <Card className="border border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="p-1.5 bg-corporate-500 rounded-md">
                <Truck className="h-4 w-4 text-white" />
              </div>
              Transporte
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(coleta?.condutor || coleta?.condutor1) && (
              <div className="p-3 bg-muted/30 rounded-lg border border-border/50 space-y-1">
                <p className="text-xs font-semibold text-corporate-600 uppercase tracking-wider">Motorista</p>
                <p className="font-semibold text-foreground">
                  {(coleta.condutor || coleta.condutor1)?.trim()}
                </p>
              </div>
            )}
            
            {(coleta?.placa || coleta?.placa1) && (
              <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg border border-border/50">
                <span className="text-sm text-muted-foreground font-medium">Placa</span>
                <span className="font-bold text-foreground">{coleta.placa || coleta.placa1}</span>
              </div>
            )}
            
            {coleta?.idEmpresa && (
              <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg border border-border/50">
                <span className="text-sm text-muted-foreground font-medium">ID Empresa</span>
                <span className="font-semibold text-foreground">{coleta.idEmpresa}</span>
              </div>
            )}
            
            {coleta?.solicitante && (
              <div className="p-3 bg-muted/30 rounded-lg border border-border/50 space-y-1">
                <p className="text-xs font-semibold text-corporate-600 uppercase tracking-wider">Solicitante</p>
                <p className="font-semibold text-foreground">{coleta.solicitante.trim()}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Observações */}
      {coleta?.obs && (
        <Card className="border border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="p-1.5 bg-corporate-500 rounded-md">
                <FileText className="h-4 w-4 text-white" />
              </div>
              Observações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground bg-muted/30 p-4 rounded-lg border border-border/50">
              {coleta.obs}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Ocorrências */}
      {d.ocorrencias && d.ocorrencias.length > 0 && (
        <Card className="border border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="p-1.5 bg-corporate-500 rounded-md">
                <List className="h-4 w-4 text-white" />
              </div>
              Ocorrências
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {d.ocorrencias.map((oc, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg border border-border/50">
                  <div className="flex-shrink-0 mt-0.5">
                    <CheckCircle className="h-4 w-4 text-corporate-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground">{oc.descricao}</p>
                    {oc.data && (
                      <p className="text-sm text-muted-foreground">{formatDate(oc.data)}</p>
                    )}
                    {oc.tipo && (
                      <Badge variant="secondary" className="mt-1 text-xs">{oc.tipo}</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Outras Coletas Encontradas */}
      {d.totalColetasEncontradas && d.totalColetasEncontradas > 1 && d.outrasColetas && d.outrasColetas.length > 0 && (
        <Card className="border border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="p-1.5 bg-corporate-500 rounded-md">
                <Hash className="h-4 w-4 text-white" />
              </div>
              Outras Coletas Encontradas
              <Badge variant="secondary" className="ml-2">{d.totalColetasEncontradas}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {d.outrasColetas.map((oc, index) => (
                <Badge 
                  key={index} 
                  variant="outline" 
                  className="cursor-pointer hover:bg-corporate-50"
                >
                  Coleta #{oc.nroColeta}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminTrackingDisplay;
