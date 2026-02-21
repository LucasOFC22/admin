import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Package, Clock, User, MapPin, FileText, 
  ChevronLeft, ChevronRight, Check, Sparkles, 
  Mic, Send, Plus, Trash2, Search, Loader2, X, Download, Pencil, Save
} from 'lucide-react';
import { fetchCEP } from '@/lib/formatters';
import { toast } from 'sonner';
import { ColetaPayload, ColetaItemPayload } from '@/types/coleta.types';
import { ColetaApiData } from '@/types/coleta';
import { backendService } from '@/services/api/backendService';
import { useAuthState } from '@/hooks/useAuthState';
import { SelectRegisterModal } from '@/components/modals/SelectRegisterModal';
import { SelectCityModal } from '@/components/modals/SelectCityModal';

// PDF carregado on-demand para reduzir bundle inicial
const getPDFRenderer = async () => {
  const [{ pdf }, { FormalColetaPDF }] = await Promise.all([
    import('@react-pdf/renderer'),
    import('@/components/pdf/FormalColetaPDF')
  ]);
  return { pdf, FormalColetaPDF };
};

interface EditarColetaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coleta: ColetaApiData | null;
  onSave: () => void;
}

interface StepConfig {
  id: number;
  name: string;
  icon: React.ElementType;
  description: string;
}

const STEPS: StepConfig[] = [
  { id: 1, name: 'Informações', icon: Clock, description: 'Data, horário e dados gerais' },
  { id: 2, name: 'Clientes', icon: User, description: 'Remetente e destinatário' },
  { id: 3, name: 'Locais', icon: MapPin, description: 'Endereços de coleta e entrega' },
  { id: 4, name: 'Itens', icon: Package, description: 'Itens da coleta' },
  { id: 5, name: 'Revisão', icon: FileText, description: 'Confirmar dados' },
];

const STATUS_OPTIONS = [
  { value: 'PENDENTE', label: 'Pendente' },
  { value: 'ANDAMENTO', label: 'Em Andamento' },
  { value: 'REALIZADA', label: 'Realizada' },
  { value: 'CANCELADA', label: 'Cancelada' },
];

const TIPO_MERCADORIA_OPTIONS = [
  'GERAL', 'FRÁGIL', 'PERECÍVEL', 'QUÍMICO', 'ELETRÔNICO', 'OUTROS'
];

const UNIDADE_OPTIONS = ['UN', 'CX', 'PC', 'KG', 'L', 'M'];

const createEmptyItem = (): ColetaItemPayload => ({
  peso: 0,
  valorMercadoria: 0,
  tipoMercadoria: 'GERAL',
  natureza: '',
  volume: 1,
  altura: 0,
  largura: 0,
  profundidade: 0,
  m3: 0,
  pesoCubado: 0,
  observacoes: '',
  chaveAcessoNfe: '',
  numeroNf: '',
  un: 'UN',
});

export const EditarColetaModal: React.FC<EditarColetaModalProps> = ({
  open,
  onOpenChange,
  coleta,
  onSave,
}) => {
  const { user } = useAuthState();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [fatorCubagem, setFatorCubagem] = useState(300);
  const [coletaCompleta, setColetaCompleta] = useState<any>(null);

  // Form state
  const [formData, setFormData] = useState<Partial<ColetaPayload>>({
    tipoRegistro: 'coleta',
    status: 'PENDENTE',
    dataColeta: new Date().toISOString().split('T')[0],
    horarioColeta: '08:00',
    horarioInicioAtendimento: '08:00',
    horarioFimAtendimento: '18:00',
    paraAlmoco: false,
    horarioInicioAlmoco: '12:00',
    horarioFimAlmoco: '13:00',
    nomeSolicitante: '',
    observacoes: '',
    itens: [createEmptyItem()],
  });

  // AI Assistant state
  const [aiPrompt, setAiPrompt] = useState('');
  const [isProcessingAi, setIsProcessingAi] = useState(false);

  // Função para processar IA e preencher campos automaticamente
  const handleSendToAI = async () => {
    if (!aiPrompt.trim()) return;
    setIsProcessingAi(true);
    
    try {
      const contexto = `Você é um assistente especializado em logística e transporte de cargas no Brasil.
Sua tarefa principal é EXTRAIR INFORMAÇÕES da solicitação de coleta e retornar um JSON válido.

RETORNE APENAS UM JSON VÁLIDO no seguinte formato (sem texto adicional):
{
  "solicitante": "",
  "remetente": { "nome": "", "documento": "", "cidade": "", "uf": "" },
  "destinatario": { "nome": "", "documento": "", "cidade": "", "uf": "" },
  "localColeta": { "endereco": "", "numero": "", "bairro": "", "cidade": "", "uf": "" },
  "mercadoria": { 
    "descricao": "", 
    "peso": "", 
    "valor": "", 
    "quantidade": "",
    "altura": "",
    "largura": "",
    "profundidade": "",
    "embalagem": ""
  },
  "dataColeta": "YYYY-MM-DD",
  "horarioColeta": "HH:MM",
  "horarioInicioAtendimento": "HH:MM",
  "horarioFimAtendimento": "HH:MM",
  "paraAlmoco": false,
  "horarioInicioAlmoco": "HH:MM",
  "horarioFimAlmoco": "HH:MM",
  "observacoes": ""
}

=== REGRA CRÍTICA PARA CPF/CNPJ ===
O campo "documento" em remetente e destinatario é EXTREMAMENTE IMPORTANTE para buscar automaticamente o cadastro e a cidade.
- CNPJ tem 14 dígitos: Formatos aceitos: "12.345.678/0001-90", "12345678000190", "12 345 678 0001 90"
- CPF tem 11 dígitos: Formatos aceitos: "123.456.789-00", "12345678900", "123 456 789 00"
- EXTRAIA APENAS OS NÚMEROS do documento (remova pontos, traços, barras e espaços)
- Exemplo: "CNPJ: 12.345.678/0001-90" → documento: "12345678000190"
- Exemplo: "CPF 123.456.789-00" → documento: "12345678900"
- O documento pode aparecer após palavras como: CNPJ, CPF, documento, doc, CGC, inscrito sob

=== IDENTIFICAÇÃO DE REMETENTE E DESTINATÁRIO ===
- Remetente = quem ENVIA a carga (origem) - palavras-chave: remetente, origem, de, saindo de, coleta em, buscar em
- Destinatário = quem RECEBE a carga (destino) - palavras-chave: destinatário, destino, para, entregar em, levar para
- Se informado "CNPJ do remetente: X" ou "remetente CNPJ X", coloque em remetente.documento
- Se informado "CNPJ do destinatário: X" ou "destinatário CNPJ X", coloque em destinatario.documento
- A CIDADE DO REMETENTE será usada como CIDADE ORIGEM
- A CIDADE DO DESTINATÁRIO será usada como CIDADE DESTINO

=== OUTRAS REGRAS ===
- Datas: formato YYYY-MM-DD (ex: 2025-01-15)
- Horários: formato HH:MM 24h (ex: 08:00, 17:30)
- Horário de atendimento: Se informado "08:00 - 17:30", use horarioInicioAtendimento: "08:00" e horarioFimAtendimento: "17:30"
- Pausa almoço: Se mencionar almoço, intervalo, ou pausa, defina paraAlmoco: true
- Dimensões em metros: Se informado "40x40x40" ou similar com valores > 3, são centímetros - divida por 100
- Local de coleta alternativo: Se o endereço de coleta for diferente do endereço do remetente

PREENCHA APENAS OS CAMPOS QUE CONSEGUIR IDENTIFICAR. Deixe string vazia "" os que não encontrar.`;

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'https://api.fptranscargas.com.br'}/coleta/ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt, contexto })
      });

      const result = await response.json();
      console.log('📦 [AI] Resultado da IA:', result);
      
      if (result.success && result.data) {
        const dados = result.data;
        let camposPreenchidos: string[] = [];
        
        // Preencher solicitante
        if (dados.solicitante) {
          updateFormField('nomeSolicitante', dados.solicitante);
          camposPreenchidos.push('solicitante');
        }
        
        // Preencher campos do formulário com os dados extraídos
        if (dados.dataColeta) {
          updateFormField('dataColeta', dados.dataColeta);
          camposPreenchidos.push('data');
        }
        if (dados.horarioColeta) {
          updateFormField('horarioColeta', dados.horarioColeta);
          camposPreenchidos.push('horário coleta');
        }
        if (dados.horarioInicioAtendimento) {
          updateFormField('horarioInicioAtendimento', dados.horarioInicioAtendimento);
        }
        if (dados.horarioFimAtendimento) {
          updateFormField('horarioFimAtendimento', dados.horarioFimAtendimento);
        }
        
        // Preencher pausa para almoço
        if (dados.paraAlmoco === true || dados.paraAlmoco === 'true') {
          updateFormField('paraAlmoco', true);
          camposPreenchidos.push('pausa almoço');
          if (dados.horarioInicioAlmoco) {
            updateFormField('horarioInicioAlmoco', dados.horarioInicioAlmoco);
          }
          if (dados.horarioFimAlmoco) {
            updateFormField('horarioFimAlmoco', dados.horarioFimAlmoco);
          }
        }
        
        if (dados.observacoes) {
          updateFormField('observacoes', dados.observacoes);
          camposPreenchidos.push('observações');
        }
        
        // Buscar e selecionar remetente automaticamente (precisa ter documento)
        if (dados.remetente?.documento) {
          const termoRemetente = dados.remetente.documento.replace(/\D/g, ''); // Limpar formatação
          console.log('🔍 [AI] Buscando remetente por documento:', termoRemetente);
          try {
            const resRemetente = await backendService.buscarCadastro(termoRemetente);
            const raw = resRemetente.data;
            console.log('📋 [AI] Resposta bruta remetente:', raw);
            
            // Parsing para todas as estruturas possíveis (N8N, array aninhado, array direto, objeto)
            let remetenteData: any[] = [];
            if (Array.isArray(raw)) {
              if (raw.length > 0 && raw[0]?.json?.data) {
                remetenteData = Array.isArray(raw[0].json.data) ? raw[0].json.data : [raw[0].json.data];
              } else if (raw.length > 0 && Array.isArray(raw[0])) {
                remetenteData = raw[0];
              } else if (raw.length > 0 && raw[0]?.idCliente) {
                remetenteData = raw;
              }
            } else if (raw?.json?.data) {
              remetenteData = Array.isArray(raw.json.data) ? raw.json.data : [raw.json.data];
            } else if (raw && typeof raw === 'object' && raw.idCliente) {
              remetenteData = [raw];
            }
            
            console.log('📋 [AI] Dados parseados remetente:', remetenteData);
            
            if (remetenteData.length > 0) {
              const remetente = remetenteData[0];
              handleSelectRemetente(remetente);
              camposPreenchidos.push('remetente');
              console.log('✅ [AI] Remetente selecionado:', remetente);
              
              // Se o remetente tem idCidade, usar diretamente como cidade origem
              if (remetente.idCidade) {
                setFormData(prev => ({
                  ...prev,
                  idCidadeOrigem: remetente.idCidade,
                  cidadeOrigem: remetente.cidade || '',
                  ufOrigem: remetente.uf || ''
                }));
                camposPreenchidos.push('cidade origem');
                console.log('✅ [AI] Cidade origem selecionada via idCidade do remetente:', remetente.idCidade);
              } else if (remetente.cidade && remetente.uf) {
                // Fallback: buscar cidade por nome
                console.log('🔍 [AI] Buscando cidade origem do remetente:', remetente.cidade, remetente.uf);
                const resCidadeOrigem = await backendService.buscarCidades({ nome: remetente.cidade, uf: remetente.uf });
                const cidadesOrigem = Array.isArray(resCidadeOrigem.data) ? resCidadeOrigem.data : [];
                if (cidadesOrigem.length > 0) {
                  handleSelectCidadeOrigem(cidadesOrigem[0]);
                  camposPreenchidos.push('cidade origem');
                  console.log('✅ [AI] Cidade origem selecionada via busca:', cidadesOrigem[0]);
                }
              }
            } else {
              console.log('⚠️ [AI] Nenhum remetente encontrado para documento:', termoRemetente);
              toast.error(`Remetente não encontrado para documento: ${termoRemetente}`);
            }
          } catch (e) {
            console.error('❌ [AI] Erro ao buscar remetente:', e);
          }
        } else if (dados.remetente?.cidade && dados.remetente?.uf) {
          // Se não tem documento mas tem cidade, buscar apenas a cidade
          console.log('🔍 [AI] Buscando cidade origem (sem remetente):', dados.remetente.cidade, dados.remetente.uf);
          try {
            const resCidadeOrigem = await backendService.buscarCidades({ nome: dados.remetente.cidade, uf: dados.remetente.uf });
            const cidadesOrigem = Array.isArray(resCidadeOrigem.data) ? resCidadeOrigem.data : [];
            if (cidadesOrigem.length > 0) {
              handleSelectCidadeOrigem(cidadesOrigem[0]);
              camposPreenchidos.push('cidade origem');
            }
          } catch (e) {
            console.error('❌ [AI] Erro ao buscar cidade origem:', e);
          }
        }
        
        // Buscar e selecionar destinatário automaticamente (precisa ter documento)
        if (dados.destinatario?.documento) {
          const termoDestinatario = dados.destinatario.documento.replace(/\D/g, ''); // Limpar formatação
          console.log('🔍 [AI] Buscando destinatário por documento:', termoDestinatario);
          try {
            const resDestinatario = await backendService.buscarCadastro(termoDestinatario);
            const raw = resDestinatario.data;
            console.log('📋 [AI] Resposta bruta destinatário:', raw);
            
            // Parsing para todas as estruturas possíveis
            let destinatarioData: any[] = [];
            if (Array.isArray(raw)) {
              if (raw.length > 0 && raw[0]?.json?.data) {
                destinatarioData = Array.isArray(raw[0].json.data) ? raw[0].json.data : [raw[0].json.data];
              } else if (raw.length > 0 && Array.isArray(raw[0])) {
                destinatarioData = raw[0];
              } else if (raw.length > 0 && raw[0]?.idCliente) {
                destinatarioData = raw;
              }
            } else if (raw?.json?.data) {
              destinatarioData = Array.isArray(raw.json.data) ? raw.json.data : [raw.json.data];
            } else if (raw && typeof raw === 'object' && raw.idCliente) {
              destinatarioData = [raw];
            }
            
            console.log('📋 [AI] Dados parseados destinatário:', destinatarioData);
            
            if (destinatarioData.length > 0) {
              const destinatario = destinatarioData[0];
              handleSelectDestinatario(destinatario);
              camposPreenchidos.push('destinatário');
              console.log('✅ [AI] Destinatário selecionado:', destinatario);
              
              // Se o destinatário tem idCidade, usar diretamente como cidade destino
              if (destinatario.idCidade) {
                setFormData(prev => ({
                  ...prev,
                  idCidadeDestino: destinatario.idCidade,
                  cidadeDestino: destinatario.cidade || '',
                  ufDestino: destinatario.uf || ''
                }));
                camposPreenchidos.push('cidade destino');
                console.log('✅ [AI] Cidade destino selecionada via idCidade do destinatário:', destinatario.idCidade);
              } else if (destinatario.cidade && destinatario.uf) {
                // Fallback: buscar cidade por nome
                console.log('🔍 [AI] Buscando cidade destino do destinatário:', destinatario.cidade, destinatario.uf);
                const resCidadeDestino = await backendService.buscarCidades({ nome: destinatario.cidade, uf: destinatario.uf });
                const cidadesDestino = Array.isArray(resCidadeDestino.data) ? resCidadeDestino.data : [];
                if (cidadesDestino.length > 0) {
                  handleSelectCidadeDestino(cidadesDestino[0]);
                  camposPreenchidos.push('cidade destino');
                  console.log('✅ [AI] Cidade destino selecionada via busca:', cidadesDestino[0]);
                }
              }
            } else {
              console.log('⚠️ [AI] Nenhum destinatário encontrado para documento:', termoDestinatario);
              toast.error(`Destinatário não encontrado para documento: ${termoDestinatario}`);
            }
          } catch (e) {
            console.error('❌ [AI] Erro ao buscar destinatário:', e);
          }
        } else if (dados.destinatario?.cidade && dados.destinatario?.uf) {
          // Se não tem documento mas tem cidade, buscar apenas a cidade
          console.log('🔍 [AI] Buscando cidade destino (sem destinatário):', dados.destinatario.cidade, dados.destinatario.uf);
          try {
            const resCidadeDestino = await backendService.buscarCidades({ nome: dados.destinatario.cidade, uf: dados.destinatario.uf });
            const cidadesDestino = Array.isArray(resCidadeDestino.data) ? resCidadeDestino.data : [];
            if (cidadesDestino.length > 0) {
              handleSelectCidadeDestino(cidadesDestino[0]);
              camposPreenchidos.push('cidade destino');
            }
          } catch (e) {
            console.error('❌ [AI] Erro ao buscar cidade destino:', e);
          }
        }
        
        // Se houver dados de local de coleta alternativo, preencher
        if (dados.localColeta) {
          if (dados.localColeta.endereco) {
            updateFormField('enderecoColeta', dados.localColeta.endereco);
          }
          if (dados.localColeta.bairro) {
            updateFormField('bairroColeta', dados.localColeta.bairro);
          }
          camposPreenchidos.push('local coleta');
        }
        
        // Se houver dados de mercadoria, adicionar como item
        if (dados.mercadoria && (dados.mercadoria.peso || dados.mercadoria.descricao)) {
          let observacoes = '';
          if (dados.mercadoria.embalagem) {
            observacoes = `Embalagem: ${dados.mercadoria.embalagem}`;
          }
          
          const novoItem: ColetaItemPayload = {
            peso: parseFloat(dados.mercadoria.peso) || 0,
            valorMercadoria: parseFloat(dados.mercadoria.valor) || 0,
            tipoMercadoria: dados.mercadoria.descricao || 'GERAL',
            natureza: '',
            volume: parseInt(dados.mercadoria.quantidade) || 1,
            altura: parseFloat(dados.mercadoria.altura) || 0,
            largura: parseFloat(dados.mercadoria.largura) || 0,
            profundidade: parseFloat(dados.mercadoria.profundidade) || 0,
            m3: 0,
            pesoCubado: 0,
            observacoes,
            chaveAcessoNfe: '',
            numeroNf: '',
            un: 'UN'
          };
          
          // Calcular m3 e peso cubado
          const m3 = (novoItem.altura * novoItem.largura * novoItem.profundidade) / 1000000 * novoItem.volume;
          novoItem.m3 = parseFloat(m3.toFixed(4));
          novoItem.pesoCubado = parseFloat((m3 * fatorCubagem).toFixed(2));
          
          setFormData(prev => ({
            ...prev,
            itens: [...(prev.itens || []), novoItem]
          }));
          camposPreenchidos.push('mercadoria');
        }
        
        toast.success(
          camposPreenchidos.length > 0 
            ? `IA preencheu: ${camposPreenchidos.join(', ')}` 
            : 'Verifique os campos e complete as informações faltantes.'
        );
      } else {
        toast.error(result.error || 'Não foi possível extrair os dados');
      }
    } catch (error) {
      console.error('Erro ao enviar para IA:', error);
      toast.error('Não foi possível conectar ao serviço de IA');
    } finally {
      setIsProcessingAi(false);
    }
  };


  const [remetenteModalOpen, setRemetenteModalOpen] = useState(false);
  const [destinatarioModalOpen, setDestinatarioModalOpen] = useState(false);
  const [cidadeOrigemModalOpen, setCidadeOrigemModalOpen] = useState(false);
  const [cidadeDestinoModalOpen, setCidadeDestinoModalOpen] = useState(false);
  
  // CEP loading states
  const [loadingColetaCep, setLoadingColetaCep] = useState(false);
  const [loadingEntregaCep, setLoadingEntregaCep] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [editingItemData, setEditingItemData] = useState<ColetaItemPayload | null>(null);
  const [newItemForm, setNewItemForm] = useState<ColetaItemPayload>(createEmptyItem());

  // Load coleta data when modal opens and reset to first step
  useEffect(() => {
    if (open && coleta) {
      setCurrentStep(1);
      loadColetaData();
    }
  }, [open, coleta]);

  const loadColetaData = useCallback(async () => {
    if (!coleta) return;

    try {
      setIsLoadingData(true);
      
      // Buscar detalhes da coleta via endpoint /coleta/detalhes (apenas leitura)
      const response = await backendService.buscarDetalhesColeta(coleta.idColeta);
      
      if (response.success && response.data) {
        const d = response.data;
        setColetaCompleta(d);
        
        // Extrair data e hora da dataColetar se disponível
        let dataColeta = d.emissao ? d.emissao.split('T')[0] : new Date().toISOString().split('T')[0];
        let horaColeta = d.horaColeta || '08:00';
        
        if (d.dataColetar) {
          const dataColetar = new Date(d.dataColetar);
          dataColeta = dataColetar.toISOString().split('T')[0];
          // Extrair hora se não vier separada
          if (!d.horaColeta) {
            horaColeta = dataColetar.toTimeString().slice(0, 5);
          }
        }

        // Mapear itens da API para o formato do formulário
        // Aceita ambos os formatos: campos antigos e novos da API
        const itensFormatados = d.itens?.map((item: any) => ({
          peso: item.peso || 0,
          valorMercadoria: item.valorMercadoria || item.vlrMerc || 0,
          tipoMercadoria: item.tipoMercadoria || 'GERAL',
          natureza: item.natureza || '',
          volume: item.volume || item.vol || 1,
          altura: item.altura || item.a || 0,
          largura: item.largura || item.b || 0,
          profundidade: item.profundidade || item.c || 0,
          m3: item.m3 || 0,
          pesoCubado: item.pesoCubado || 0,
          observacoes: item.observacoes || item.obs || '',
          chaveAcessoNfe: item.chave_nfe || item.chaveAcessoNfe || '',
          numeroNf: item.numeroNf || item.notas || '',
          un: item.un || 'UN',
        })) || [createEmptyItem()];
        
        // Mapear dados completos para o formulário usando campos corretos da API
        setFormData({
          tipoRegistro: d.tipoRegistro || 'coleta',
          status: 'PENDENTE',
          dataColeta,
          dataPrevisaoEntrega: d.dataEntrega ? d.dataEntrega.split('T')[0] : undefined,
          horarioColeta: horaColeta,
          horarioInicioAtendimento: d.atende || '08:00',
          horarioFimAtendimento: d.atende1 || '18:00',
          paraAlmoco: false,
          horarioInicioAlmoco: '12:00',
          horarioFimAlmoco: '13:00',
          nomeSolicitante: d.solicitante || '',
          observacoes: '',
          
          // Remetente
          idRemetente: d.idRemetente || 0,
          nomeRemetente: d.nomeRemetente || '',
          
          // Destinatário
          idDestinatario: d.idDestinatario || 0,
          nomeDestinatario: d.nomeDestinatario || '',
          
          // Cliente
          idCliente: d.idCliente || 0,
          nomeCliente: d.nomeCliente || '',
          
          // Cidade Origem
          idCidadeOrigem: d.idCidadeOrigem || 0,
          cidadeOrigem: d.cidadeOrigem || '',
          ufOrigem: d.ufOrigem || '',
          
          // Cidade Destino
          idCidadeDestino: d.idCidadeDestino || 0,
          cidadeDestino: d.cidadeDestino || '',
          ufDestino: d.ufDestino || '',
          
          // Endereço de Coleta (outro local)
          enderecoColeta: d.outroLocalColetaEnd || '',
          bairroColeta: d.outroLocalColetaBairro || '',
          cepColeta: d.outroLocalColetaCep || '',
          
          // Endereço de Entrega (outro local)
          enderecoEntrega: d.outroLocalEntregaEnd || '',
          bairroEntrega: d.outroLocalEntregaBairro || '',
          cepEntrega: d.outroLocalEntregaCep || '',
          
          // Veículo
          tipoVeiculo: d.tipoVeiculo || '',
          
          // Itens
          itens: itensFormatados.length > 0 ? itensFormatados : [createEmptyItem()],
          
          // Totais
          totPeso: d.tPeso || 0,
          totVolume: d.tVolume || 0,
          totM3: d.tM3 || 0,
          totValorMerc: d.tVlrMerc || 0,
          
          // IDs
          idEmpresa: d.idEmpresa || Number(user?.empresa) || 0,
          idColeta: d.idColeta,
          nroColeta: d.nroColeta,
        });
        
        toast.success('Dados carregados com sucesso');
      } else {
        // Fallback para dados básicos se a API falhar
        console.warn('Usando dados básicos da coleta:', response.error);
        setFormData({
          tipoRegistro: 'coleta',
          status: String(coleta.situacao) || 'PENDENTE',
          dataColeta: coleta.diaColeta || new Date().toISOString().split('T')[0],
          dataPrevisaoEntrega: coleta.dataEntrega || undefined,
          horarioColeta: coleta.horaColeta || '08:00',
          horarioInicioAtendimento: '08:00',
          horarioFimAtendimento: '18:00',
          paraAlmoco: coleta.almoco === 'S',
          horarioInicioAlmoco: '12:00',
          horarioFimAlmoco: '13:00',
          nomeSolicitante: coleta.solicitante || '',
          observacoes: coleta.obs || '',
          idRemetente: 0,
          nomeRemetente: coleta.remetente,
          idDestinatario: 0,
          idCidadeOrigem: 0,
          cidadeOrigem: coleta.coletaCidade,
          ufOrigem: coleta.coletaUf,
          idCidadeDestino: 0,
          itens: [createEmptyItem()],
          idEmpresa: Number(user?.empresa) || coleta.idEmpresa || 0,
          totPeso: coleta.tPeso,
          totValorMerc: coleta.tVlrMerc,
        });
      }
      
      setLastSaved(new Date());
    } catch (error) {
      console.error('Erro ao carregar dados da coleta:', error);
      toast.error('Erro ao carregar dados da coleta');
    } finally {
      setIsLoadingData(false);
    }
  }, [coleta, user]);

  const updateFormField = <K extends keyof ColetaPayload>(field: K, value: ColetaPayload[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleItemChange = (index: number, field: keyof ColetaItemPayload, value: any) => {
    const itens = [...(formData.itens || [])];
    itens[index] = { ...itens[index], [field]: value };

    // Recalculate m3 and peso cubado
    if (['altura', 'largura', 'profundidade', 'volume'].includes(field)) {
      const item = itens[index];
      const m3 = (item.altura * item.largura * item.profundidade) / 1000000 * item.volume;
      itens[index].m3 = parseFloat(m3.toFixed(4));
      itens[index].pesoCubado = parseFloat((m3 * fatorCubagem).toFixed(2));
    }

    setFormData(prev => ({ ...prev, itens }));
  };

  const addItem = () => {
    // Adicionar o item do formulário à lista
    const itemToAdd = { ...newItemForm };
    
    // Recalcular m3 e peso cubado
    const m3 = (itemToAdd.altura * itemToAdd.largura * itemToAdd.profundidade) / 1000000 * itemToAdd.volume;
    itemToAdd.m3 = parseFloat(m3.toFixed(4));
    itemToAdd.pesoCubado = parseFloat((m3 * fatorCubagem).toFixed(2));
    
    setFormData(prev => ({
      ...prev,
      itens: [...(prev.itens || []), itemToAdd],
    }));
    
    // Resetar formulário
    setNewItemForm(createEmptyItem());
    toast.success('Item adicionado com sucesso!');
  };

  const removeItem = (index: number) => {
    const itens = [...(formData.itens || [])];
    if (itens.length > 1) {
      itens.splice(index, 1);
      setFormData(prev => ({ ...prev, itens }));
      // Se estava editando o item removido, cancelar edição
      if (editingItemIndex === index) {
        setEditingItemIndex(null);
        setEditingItemData(null);
      } else if (editingItemIndex !== null && editingItemIndex > index) {
        // Ajustar índice se o item removido estava antes do item sendo editado
        setEditingItemIndex(editingItemIndex - 1);
      }
    }
  };

  // Funções para edição inline de itens
  const startEditingItem = (index: number) => {
    const item = formData.itens?.[index];
    if (item) {
      setEditingItemIndex(index);
      setEditingItemData({ ...item });
    }
  };

  const cancelEditingItem = () => {
    setEditingItemIndex(null);
    setEditingItemData(null);
  };

  const saveEditingItem = () => {
    if (editingItemIndex !== null && editingItemData) {
      const itens = [...(formData.itens || [])];
      
      // Recalcular m3 e peso cubado
      const m3 = (editingItemData.altura * editingItemData.largura * editingItemData.profundidade) / 1000000 * editingItemData.volume;
      editingItemData.m3 = parseFloat(m3.toFixed(4));
      editingItemData.pesoCubado = parseFloat((m3 * fatorCubagem).toFixed(2));
      
      itens[editingItemIndex] = editingItemData;
      
      setFormData(prev => ({ ...prev, itens }));
      setEditingItemIndex(null);
      setEditingItemData(null);
      toast.success('Item atualizado com sucesso!');
    }
  };

  const handleEditingItemChange = (field: keyof ColetaItemPayload, value: any) => {
    if (editingItemData) {
      const updated = { ...editingItemData, [field]: value };
      
      // Recalcular m3 e peso cubado se dimensões mudarem
      if (['altura', 'largura', 'profundidade', 'volume'].includes(field)) {
        const m3 = (updated.altura * updated.largura * updated.profundidade) / 1000000 * updated.volume;
        updated.m3 = parseFloat(m3.toFixed(4));
        updated.pesoCubado = parseFloat((m3 * fatorCubagem).toFixed(2));
      }
      
      setEditingItemData(updated);
    }
  };

  const handleNewItemFormChange = (field: keyof ColetaItemPayload, value: any) => {
    const updated = { ...newItemForm, [field]: value };
    
    // Recalcular m3 e peso cubado se dimensões mudarem
    if (['altura', 'largura', 'profundidade', 'volume'].includes(field)) {
      const m3 = (updated.altura * updated.largura * updated.profundidade) / 1000000 * updated.volume;
      updated.m3 = parseFloat(m3.toFixed(4));
      updated.pesoCubado = parseFloat((m3 * fatorCubagem).toFixed(2));
    }
    
    setNewItemForm(updated);
  };

  const calculateTotals = () => {
    const itens = formData.itens || [];
    return {
      totPeso: itens.reduce((sum, item) => sum + (item.peso || 0), 0),
      totVolume: itens.reduce((sum, item) => sum + (item.volume || 0), 0),
      totM3: itens.reduce((sum, item) => sum + (item.m3 || 0), 0),
      totValorMerc: itens.reduce((sum, item) => sum + (item.valorMercadoria || 0), 0),
      totPesoCubado: itens.reduce((sum, item) => sum + (item.pesoCubado || 0), 0),
    };
  };

  // Função para mapear itens do frontend para o formato da API
  const mapItemToAPI = (item: ColetaItemPayload) => ({
    numeroNf: item.numeroNf || '',
    chaveAcessoNfe: item.chaveAcessoNfe || '',
    peso: item.peso || 0,
    valorMercadoria: item.valorMercadoria || 0,
    natureza: item.natureza || '',
    tipoMercadoria: item.tipoMercadoria || 'GERAL',
    altura: item.altura || 0,
    largura: item.largura || 0,
    profundidade: item.profundidade || 0,
    volume: item.volume || 1,
    m3: item.m3 || 0,
    pesoCubado: item.pesoCubado || 0,
    observacoes: item.observacoes || ''
  });

  const handleSave = async () => {
    if (!coleta?.idColeta) {
      toast.error('ID da coleta não encontrado');
      return;
    }

    setIsSaving(true);
    try {
      const totals = calculateTotals();
      
      // Priorizar idEmpresa: formData > coleta original > user.empresa
      const idEmpresa = formData.idEmpresa || coleta?.idEmpresa || Number(user?.empresa) || 0;
      
      if (!idEmpresa) {
        toast.error('ID da empresa é obrigatório');
        setIsSaving(false);
        return;
      }
      
      const payload: ColetaPayload = {
        ...formData,
        idEmpresa,
        tipoRegistro: 'coleta',
        idCidadeOrigem: formData.idCidadeOrigem || 0,
        idCidadeDestino: formData.idCidadeDestino || 0,
        idRemetente: formData.idRemetente || 0,
        idDestinatario: formData.idDestinatario || 0,
        nomeSolicitante: formData.nomeSolicitante || '',
        dataColeta: formData.dataColeta || new Date().toISOString().split('T')[0],
        horarioColeta: formData.horarioColeta || '08:00',
        horarioInicioAtendimento: formData.horarioInicioAtendimento || '08:00',
        horarioFimAtendimento: formData.horarioFimAtendimento || '18:00',
        observacoes: formData.observacoes || '',
        itens: (formData.itens || []).map(mapItemToAPI) as any,  // Converter itens para formato da API
        ...totals,
      } as ColetaPayload;

      const response = await backendService.atualizarColeta(coleta.idColeta, payload);

      if (response.success) {
        toast.success('Coleta atualizada com sucesso!');
        setLastSaved(new Date());
        onSave();
        onOpenChange(false);
      } else {
        throw new Error('Falha ao atualizar coleta');
      }
    } catch (error) {
      console.error('Erro ao salvar coleta:', error);
      toast.error('Erro ao salvar coleta');
    } finally {
      setIsSaving(false);
    }
  };

  // Handlers for client and city selection
  const handleSelectRemetente = (cadastro: any) => {
    setFormData(prev => ({
      ...prev,
      idRemetente: cadastro.idCliente,
      nomeRemetente: cadastro.nome,
      cpfCnpjRemetente: cadastro.cpfcgc,
      cidadeRemetente: cadastro.cidade,
      ufRemetente: cadastro.uf,
      bairroRemetente: cadastro.bairro,
      idCidadeRemetente: cadastro.idCidade,
    }));
    toast.success(`Remetente "${cadastro.nome}" selecionado`);
  };

  const handleSelectDestinatario = (cadastro: any) => {
    setFormData(prev => ({
      ...prev,
      idDestinatario: cadastro.idCliente,
      nomeDestinatario: cadastro.nome,
      cpfCnpjDestinatario: cadastro.cpfcgc,
      cidadeDestinatario: cadastro.cidade,
      ufDestinatario: cadastro.uf,
      bairroDestinatario: cadastro.bairro,
      idCidadeDestinatario: cadastro.idCidade,
    }));
    toast.success(`Destinatário "${cadastro.nome}" selecionado`);
  };

  const handleSelectCidadeOrigem = (cidade: any) => {
    setFormData(prev => ({
      ...prev,
      idCidadeOrigem: cidade.idCidade,
      cidadeOrigem: cidade.cidade,
      ufOrigem: cidade.uf,
    }));
    toast.success(`Cidade de origem: ${cidade.cidade}/${cidade.uf}`);
  };

  const handleSelectCidadeDestino = (cidade: any) => {
    setFormData(prev => ({
      ...prev,
      idCidadeDestino: cidade.idCidade,
      cidadeDestino: cidade.cidade,
      ufDestino: cidade.uf,
    }));
    toast.success(`Cidade de destino: ${cidade.cidade}/${cidade.uf}`);
  };

  // CEP lookup handlers
  const handleColetaCepBlur = useCallback(async () => {
    const cep = formData.localColeta?.cep?.replace(/\D/g, '') || '';
    if (cep.length !== 8) return;
    
    setLoadingColetaCep(true);
    try {
      const data = await fetchCEP(cep);
      if (data) {
        updateFormField('localColeta', {
          ...formData.localColeta,
          cep: formData.localColeta?.cep || '',
          uf: data.state || '',
          cidade: data.city || '',
          endereco: data.street || '',
          bairro: data.neighborhood || '',
        } as any);
        toast.success('Endereço preenchido automaticamente');
      } else {
        toast.error('CEP não encontrado');
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      toast.error('Erro ao buscar CEP');
    } finally {
      setLoadingColetaCep(false);
    }
  }, [formData.localColeta]);

  const handleEntregaCepBlur = useCallback(async () => {
    const cep = formData.localEntrega?.cep?.replace(/\D/g, '') || '';
    if (cep.length !== 8) return;
    
    setLoadingEntregaCep(true);
    try {
      const data = await fetchCEP(cep);
      if (data) {
        updateFormField('localEntrega', {
          ...formData.localEntrega,
          cep: formData.localEntrega?.cep || '',
          uf: data.state || '',
          cidade: data.city || '',
          endereco: data.street || '',
          bairro: data.neighborhood || '',
        } as any);
        toast.success('Endereço preenchido automaticamente');
      } else {
        toast.error('CEP não encontrado');
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      toast.error('Erro ao buscar CEP');
    } finally {
      setLoadingEntregaCep(false);
    }
  }, [formData.localEntrega]);

  // Função para baixar PDF da coleta
  const handleDownloadPDF = async () => {
    if (!coleta?.idColeta) {
      toast.error('ID da coleta não encontrado');
      return;
    }

    try {
      setIsGeneratingPDF(true);
      
      // Preparar dados para o PDF usando coletaCompleta ou formData
      const pdfData = coletaCompleta || {
        id: coleta.idColeta,
        nroColeta: formData.nroColeta || coleta.nroColeta,
        nomeRemetente: formData.nomeRemetente,
        nomeDestinatario: formData.nomeDestinatario,
        cidadeOrigem: formData.cidadeOrigem,
        ufOrigem: formData.ufOrigem,
        cidadeDestino: formData.cidadeDestino,
        ufDestino: formData.ufDestino,
        dataColeta: formData.dataColeta,
        horarioColeta: formData.horarioColeta,
        itens: formData.itens,
        tPeso: calculateTotals().totPeso,
        tVolume: calculateTotals().totVolume,
        tM3: calculateTotals().totM3,
        tVlrMerc: calculateTotals().totValorMerc,
        observacoes: formData.observacoes,
        solicitante: formData.nomeSolicitante,
      };
      
      // Carrega PDF renderer on-demand
      const { pdf, FormalColetaPDF } = await getPDFRenderer();
      const doc = <FormalColetaPDF coleta={pdfData} />;
      const asPdf = pdf(doc);
      const blob = await asPdf.toBlob();
      
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `ordem-coleta-entrega-${coleta.idColeta}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      
      toast.success('PDF baixado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast.error('Não foi possível gerar o PDF.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const goToStep = (step: number) => {
    if (step >= 1 && step <= STEPS.length) {
      setCurrentStep(step);
    }
  };

  const progressPercentage = (currentStep / STEPS.length) * 100;

  const renderStepIndicator = () => (
    <div className="flex items-center justify-between mb-4">
      {STEPS.map((step, index) => (
        <React.Fragment key={step.id}>
          <div className="flex items-center flex-1">
            <button
              onClick={() => goToStep(step.id)}
              className={`flex flex-col items-center gap-1 p-1 sm:p-2 rounded-lg transition-all w-full ${
                currentStep === step.id ? 'bg-primary/10' : 'hover:bg-muted cursor-pointer'
              }`}
            >
              <div
                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all ${
                  currentStep === step.id
                    ? 'bg-primary text-primary-foreground'
                    : currentStep > step.id
                    ? 'bg-green-500 text-white'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {currentStep > step.id ? (
                  <Check className="h-4 w-4 sm:h-5 sm:w-5" />
                ) : (
                  <step.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                )}
              </div>
              <span
                className={`text-xs font-medium hidden sm:block ${
                  currentStep === step.id ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                {step.name}
              </span>
            </button>
          </div>
          {index < STEPS.length - 1 && (
            <div className="h-0.5 flex-1 mx-1 sm:mx-2 bg-muted hidden sm:block" />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-6">
      {/* AI Assistant Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Assistente IA para Coletas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Descreva a coleta por texto ou voz e a IA preencherá os campos automaticamente</span>
          </div>
          <Textarea
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            placeholder="Ex: Coleta para a empresa XYZ em São Paulo SP, destino Rio de Janeiro RJ, peso 500kg, valor da mercadoria R$ 10.000, horário 14:00..."
            rows={4}
          />
          <div className="flex gap-2">
            <Button variant="outline">
              <Mic className="h-4 w-4 mr-2" />
              Gravar Áudio
            </Button>
            <Button onClick={handleSendToAI} className="flex-1" disabled={!aiPrompt.trim() || isProcessingAi}>
              {isProcessingAi ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
              {isProcessingAi ? 'Processando...' : 'Enviar para IA'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* General Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Informações Gerais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Tipo de Registro *</Label>
              <Select value="coleta" disabled>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="coleta">Coleta</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>
                Data da Coleta <span className="text-destructive">*</span>
              </Label>
              <Input
                type="date"
                value={formData.dataColeta || ''}
                onChange={(e) => updateFormField('dataColeta', e.target.value)}
              />
            </div>
            <div>
              <Label>Data de Previsão de Entrega</Label>
              <Input
                type="date"
                value={formData.dataPrevisaoEntrega || ''}
                onChange={(e) => updateFormField('dataPrevisaoEntrega', e.target.value || null)}
              />
            </div>
            <div>
              <Label>Status</Label>
              <Select
                value={formData.status || 'PENDENTE'}
                onValueChange={(value) => updateFormField('status', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>
                Horário da Coleta <span className="text-destructive">*</span>
              </Label>
              <Input
                type="time"
                value={formData.horarioColeta || ''}
                onChange={(e) => updateFormField('horarioColeta', e.target.value)}
              />
            </div>
            <div>
              <Label>Nome do Solicitante</Label>
              <Input
                placeholder="Nome completo"
                value={formData.nomeSolicitante || ''}
                onChange={(e) => updateFormField('nomeSolicitante', e.target.value)}
              />
            </div>
            <div>
              <Label>Fator de Cubagem</Label>
              <Input
                type="number"
                placeholder="300"
                value={fatorCubagem}
                onChange={(e) => setFatorCubagem(Number(e.target.value))}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Usado para peso cubado (m³ x fator)
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Label>Horário Início Atendimento</Label>
              <Input
                type="time"
                value={formData.horarioInicioAtendimento || ''}
                onChange={(e) => updateFormField('horarioInicioAtendimento', e.target.value)}
              />
            </div>
            <div>
              <Label>Horário Fim Atendimento</Label>
              <Input
                type="time"
                value={formData.horarioFimAtendimento || ''}
                onChange={(e) => updateFormField('horarioFimAtendimento', e.target.value)}
              />
            </div>
            <div>
              <Label>Para para Almoço?</Label>
              <Select
                value={formData.paraAlmoco ? 'sim' : 'nao'}
                onValueChange={(value) => updateFormField('paraAlmoco', value === 'sim')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nao">Não</SelectItem>
                  <SelectItem value="sim">Sim</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.paraAlmoco && (
              <>
                <div>
                  <Label>Início Almoço</Label>
                  <Input
                    type="time"
                    value={formData.horarioInicioAlmoco || ''}
                    onChange={(e) => updateFormField('horarioInicioAlmoco', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Fim Almoço</Label>
                  <Input
                    type="time"
                    value={formData.horarioFimAlmoco || ''}
                    onChange={(e) => updateFormField('horarioFimAlmoco', e.target.value)}
                  />
                </div>
              </>
            )}
          </div>

          <div>
            <Label>Observações</Label>
            <Textarea
              placeholder="Observações sobre a coleta..."
              rows={3}
              value={formData.observacoes || ''}
              onChange={(e) => updateFormField('observacoes', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Remetente
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Nome/Razão Social</Label>
              <div className="flex gap-2">
                <Input
                  value={formData.nomeRemetente || ''}
                  onChange={(e) => updateFormField('nomeRemetente', e.target.value)}
                  placeholder="Clique para buscar remetente..."
                  readOnly
                  className="cursor-pointer"
                  onClick={() => setRemetenteModalOpen(true)}
                />
                <Button variant="outline" size="icon" onClick={() => setRemetenteModalOpen(true)}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div>
              <Label>CPF/CNPJ</Label>
              <Input
                value={formData.cpfCnpjRemetente || ''}
                readOnly
                className="bg-muted"
                placeholder="Preenchido automaticamente"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Cidade</Label>
              <Input
                value={formData.cidadeRemetente || ''}
                readOnly
                className="bg-muted"
                placeholder="Cidade"
              />
            </div>
            <div>
              <Label>UF</Label>
              <Input
                value={formData.ufRemetente || ''}
                readOnly
                className="bg-muted"
                placeholder="UF"
              />
            </div>
            <div>
              <Label>Bairro</Label>
              <Input
                value={formData.bairroRemetente || ''}
                readOnly
                className="bg-muted"
                placeholder="Bairro"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Destinatário
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Nome/Razão Social</Label>
              <div className="flex gap-2">
                <Input
                  value={formData.nomeDestinatario || ''}
                  onChange={(e) => updateFormField('nomeDestinatario', e.target.value)}
                  placeholder="Clique para buscar destinatário..."
                  readOnly
                  className="cursor-pointer"
                  onClick={() => setDestinatarioModalOpen(true)}
                />
                <Button variant="outline" size="icon" onClick={() => setDestinatarioModalOpen(true)}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div>
              <Label>CPF/CNPJ</Label>
              <Input
                value={formData.cpfCnpjDestinatario || ''}
                readOnly
                className="bg-muted"
                placeholder="Preenchido automaticamente"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Cidade</Label>
              <Input
                value={formData.cidadeDestinatario || ''}
                readOnly
                className="bg-muted"
                placeholder="Cidade"
              />
            </div>
            <div>
              <Label>UF</Label>
              <Input
                value={formData.ufDestinatario || ''}
                readOnly
                className="bg-muted"
                placeholder="UF"
              />
            </div>
            <div>
              <Label>Bairro</Label>
              <Input
                value={formData.bairroDestinatario || ''}
                readOnly
                className="bg-muted"
                placeholder="Bairro"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Origem e Destino
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Cidade de Origem</Label>
              <div className="flex gap-2">
                <Input
                  value={formData.cidadeOrigem ? `${formData.cidadeOrigem}/${formData.ufOrigem}` : ''}
                  placeholder="Clique para buscar cidade..."
                  readOnly
                  className="cursor-pointer"
                  onClick={() => setCidadeOrigemModalOpen(true)}
                />
                <Button variant="outline" size="icon" onClick={() => setCidadeOrigemModalOpen(true)}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div>
              <Label>Cidade de Destino</Label>
              <div className="flex gap-2">
                <Input
                  value={formData.cidadeDestino ? `${formData.cidadeDestino}/${formData.ufDestino}` : ''}
                  placeholder="Clique para buscar cidade..."
                  readOnly
                  className="cursor-pointer"
                  onClick={() => setCidadeDestinoModalOpen(true)}
                />
                <Button variant="outline" size="icon" onClick={() => setCidadeDestinoModalOpen(true)}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Local de Coleta Alternativo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-blue-500" />
              Local de Coleta Alternativo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>CEP</Label>
                <Input
                  value={formData.localColeta?.cep || ''}
                  onChange={(e) =>
                    updateFormField('localColeta', {
                      ...formData.localColeta,
                      cep: e.target.value,
                    } as any)
                  }
                  onBlur={handleColetaCepBlur}
                  placeholder="00000-000"
                  maxLength={9}
                />
              </div>
              <div>
                <Label>Cidade/UF</Label>
                <Input
                  value={formData.localColeta?.cidade && formData.localColeta?.uf 
                    ? `${formData.localColeta.cidade}/${formData.localColeta.uf}` 
                    : ''}
                  readOnly
                  className="bg-muted"
                  placeholder="Preenchido pelo CEP"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <Label>Endereço</Label>
                <Input
                  value={formData.localColeta?.endereco || ''}
                  onChange={(e) =>
                    updateFormField('localColeta', {
                      ...formData.localColeta,
                      endereco: e.target.value,
                    } as any)
                  }
                  placeholder="Rua, Avenida, etc."
                />
              </div>
              <div>
                <Label>Número</Label>
                <Input
                  value={formData.localColeta?.numero || ''}
                  onChange={(e) =>
                    updateFormField('localColeta', {
                      ...formData.localColeta,
                      numero: e.target.value,
                    } as any)
                  }
                  placeholder="Nº"
                />
              </div>
            </div>
            <div>
              <Label>Bairro</Label>
              <Input
                value={formData.localColeta?.bairro || ''}
                onChange={(e) =>
                  updateFormField('localColeta', {
                    ...formData.localColeta,
                    bairro: e.target.value,
                  } as any)
                }
                placeholder="Nome do bairro"
              />
            </div>
          </CardContent>
        </Card>

        {/* Local de Entrega Alternativo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-green-500" />
              Local de Entrega Alternativo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>CEP</Label>
                <Input
                  value={formData.localEntrega?.cep || ''}
                  onChange={(e) =>
                    updateFormField('localEntrega', {
                      ...formData.localEntrega,
                      cep: e.target.value,
                    } as any)
                  }
                  onBlur={handleEntregaCepBlur}
                  placeholder="00000-000"
                  maxLength={9}
                />
              </div>
              <div>
                <Label>Cidade/UF</Label>
                <Input
                  value={formData.localEntrega?.cidade && formData.localEntrega?.uf 
                    ? `${formData.localEntrega.cidade}/${formData.localEntrega.uf}` 
                    : ''}
                  readOnly
                  className="bg-muted"
                  placeholder="Preenchido pelo CEP"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <Label>Endereço</Label>
                <Input
                  value={formData.localEntrega?.endereco || ''}
                  onChange={(e) =>
                    updateFormField('localEntrega', {
                      ...formData.localEntrega,
                      endereco: e.target.value,
                    } as any)
                  }
                  placeholder="Rua, Avenida, etc."
                />
              </div>
              <div>
                <Label>Número</Label>
                <Input
                  value={formData.localEntrega?.numero || ''}
                  onChange={(e) =>
                    updateFormField('localEntrega', {
                      ...formData.localEntrega,
                      numero: e.target.value,
                    } as any)
                  }
                  placeholder="Nº"
                />
              </div>
            </div>
            <div>
              <Label>Bairro</Label>
              <Input
                value={formData.localEntrega?.bairro || ''}
                onChange={(e) =>
                  updateFormField('localEntrega', {
                    ...formData.localEntrega,
                    bairro: e.target.value,
                  } as any)
                }
                placeholder="Nome do bairro"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderStep4 = () => {
    const totals = calculateTotals();
    const itemCount = formData.itens?.length || 0;
    const isEditing = editingItemIndex !== null;
    const currentData = isEditing ? editingItemData : newItemForm;

    return (
      <div className="space-y-6">
        {/* Card principal de itens */}
        <Card className={`transition-all duration-300 ${itemCount > 0 ? 'ring-2 ring-green-500/50 ring-offset-2' : ''}`}>
          <CardHeader className="p-4 sm:p-6">
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle className="text-xl sm:text-2xl font-semibold leading-none tracking-tight">
                Itens da Coleta <span className="text-destructive">*</span>
              </CardTitle>
              {itemCount > 0 && (
                <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors border-transparent bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  <Check className="h-3 w-3 mr-1" />
                  {itemCount} {itemCount === 1 ? 'item' : 'itens'}
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
            {/* Formulário de edição/criação - Primeira linha */}
            <div className="grid grid-cols-1 md:grid-cols-7 gap-4 p-4 border rounded-lg bg-muted/30">
              <div>
                <Label className="text-sm font-medium">Número NF</Label>
                <Input
                  value={currentData?.numeroNf || ''}
                  onChange={(e) => isEditing 
                    ? handleEditingItemChange('numeroNf', e.target.value)
                    : handleNewItemFormChange('numeroNf', e.target.value)
                  }
                  placeholder="123456"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Chave NFe</Label>
                <Input
                  value={currentData?.chaveAcessoNfe || ''}
                  onChange={(e) => isEditing 
                    ? handleEditingItemChange('chaveAcessoNfe', e.target.value)
                    : handleNewItemFormChange('chaveAcessoNfe', e.target.value)
                  }
                  placeholder="44 dígitos"
                  maxLength={44}
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Peso (kg) *</Label>
                <Input
                  type="number"
                  value={currentData?.peso || ''}
                  onChange={(e) => isEditing 
                    ? handleEditingItemChange('peso', Number(e.target.value))
                    : handleNewItemFormChange('peso', Number(e.target.value))
                  }
                  placeholder="0.00"
                  step="0.01"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Valor (R$)</Label>
                <Input
                  type="number"
                  value={currentData?.valorMercadoria || ''}
                  onChange={(e) => isEditing 
                    ? handleEditingItemChange('valorMercadoria', Number(e.target.value))
                    : handleNewItemFormChange('valorMercadoria', Number(e.target.value))
                  }
                  placeholder="0.00"
                  step="0.01"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Natureza</Label>
                <Input
                  value={currentData?.natureza || ''}
                  onChange={(e) => isEditing 
                    ? handleEditingItemChange('natureza', e.target.value)
                    : handleNewItemFormChange('natureza', e.target.value)
                  }
                  placeholder="Ex: Eletrônicos, Alimentos..."
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Tipo Mercadoria</Label>
                <Input
                  value={currentData?.tipoMercadoria || ''}
                  onChange={(e) => isEditing 
                    ? handleEditingItemChange('tipoMercadoria', e.target.value)
                    : handleNewItemFormChange('tipoMercadoria', e.target.value)
                  }
                  placeholder="Ex: Caixas, Peças..."
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Volume</Label>
                <Input
                  type="number"
                  value={currentData?.volume || ''}
                  onChange={(e) => isEditing 
                    ? handleEditingItemChange('volume', Number(e.target.value))
                    : handleNewItemFormChange('volume', Number(e.target.value))
                  }
                  placeholder="0"
                  step="1"
                />
              </div>
              <div className="flex items-end gap-2">
                {isEditing ? (
                  <>
                    <Button onClick={saveEditingItem} className="flex-1">
                      <Save className="h-4 w-4 mr-2" />
                      Salvar
                    </Button>
                    <Button variant="outline" size="icon" onClick={cancelEditingItem}>
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <Button onClick={addItem} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar
                  </Button>
                )}
              </div>
            </div>

            {/* Banner de edição */}
            {isEditing && (
              <div className="p-3 border rounded-lg bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 animate-fade-in">
                <div className="flex items-center gap-2">
                  <Pencil className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <span className="text-sm font-medium text-amber-700 dark:text-amber-300">Editando item {(editingItemIndex || 0) + 1}</span>
                  <span className="text-xs text-amber-600 dark:text-amber-400">- Altere os campos acima e clique em Salvar</span>
                </div>
              </div>
            )}

            {/* Segunda linha - Dimensões */}
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4 p-4 border rounded-lg bg-muted/30">
              <div>
                <Label className="text-sm font-medium">Altura (m)</Label>
                <Input
                  type="number"
                  value={currentData?.altura || ''}
                  onChange={(e) => isEditing 
                    ? handleEditingItemChange('altura', Number(e.target.value))
                    : handleNewItemFormChange('altura', Number(e.target.value))
                  }
                  placeholder="0.00"
                  step="0.01"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Largura (m)</Label>
                <Input
                  type="number"
                  value={currentData?.largura || ''}
                  onChange={(e) => isEditing 
                    ? handleEditingItemChange('largura', Number(e.target.value))
                    : handleNewItemFormChange('largura', Number(e.target.value))
                  }
                  placeholder="0.00"
                  step="0.01"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Profundidade (m)</Label>
                <Input
                  type="number"
                  value={currentData?.profundidade || ''}
                  onChange={(e) => isEditing 
                    ? handleEditingItemChange('profundidade', Number(e.target.value))
                    : handleNewItemFormChange('profundidade', Number(e.target.value))
                  }
                  placeholder="0.00"
                  step="0.01"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">M³ Total</Label>
                <Input
                  type="number"
                  value={currentData?.m3?.toFixed(4) || '0.0000'}
                  readOnly
                  placeholder="0.0000"
                  step="0.0001"
                />
                <p className="text-xs text-muted-foreground mt-1">= dim × volumes</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Peso Cubado (kg)</Label>
                <Input
                  type="number"
                  value={currentData?.pesoCubado?.toFixed(2) || '0.00'}
                  readOnly
                  placeholder="0.00"
                  step="0.01"
                />
                <p className="text-xs text-muted-foreground mt-1">Auto se preencher M³</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Observações</Label>
                <Input
                  value={currentData?.observacoes || ''}
                  onChange={(e) => isEditing 
                    ? handleEditingItemChange('observacoes', e.target.value)
                    : handleNewItemFormChange('observacoes', e.target.value)
                  }
                  placeholder="Observações do item"
                />
              </div>
            </div>

            {/* Lista de itens */}
            <div className="space-y-4">
              {/* Tabela */}
              <div className="relative w-full overflow-auto">
                <table className="w-full caption-bottom text-sm">
                  <thead className="[&_tr]:border-b">
                    <tr className="border-b transition-colors hover:bg-muted/50">
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Número NF</th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Chave NFe</th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Peso (kg)</th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Valor (R$)</th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Tipo</th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Volume</th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">UN</th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Dimensões</th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">M³</th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Peso Cubado</th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Obs</th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="[&_tr:last-child]:border-0">
                    {(formData.itens || []).map((item, index) => (
                      <tr 
                        key={index} 
                        className={`border-b transition-colors hover:bg-muted/50 ${editingItemIndex === index ? 'bg-amber-50 dark:bg-amber-950/30' : ''}`}
                      >
                        <td className="p-4 align-middle">{item.numeroNf || '-'}</td>
                        <td className="p-4 align-middle text-xs max-w-[100px] truncate" title={item.chaveAcessoNfe || ''}>
                          {item.chaveAcessoNfe || '-'}
                        </td>
                        <td className="p-4 align-middle">
                          {item.peso?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
                        </td>
                        <td className="p-4 align-middle">
                          R$&nbsp;{item.valorMercadoria?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
                        </td>
                        <td className="p-4 align-middle">{item.natureza || item.tipoMercadoria || '-'}</td>
                        <td className="p-4 align-middle">{item.volume || 0}</td>
                        <td className="p-4 align-middle">{item.un || '-'}</td>
                        <td className="p-4 align-middle">
                          {item.altura && item.largura && item.profundidade
                            ? `${item.altura}×${item.largura}×${item.profundidade}`
                            : '-'}
                        </td>
                        <td className="p-4 align-middle">{item.m3?.toFixed(4) || '0,0000'}</td>
                        <td className="p-4 align-middle">{item.pesoCubado?.toFixed(2) || '0,00'} kg</td>
                        <td className="p-4 align-middle max-w-[100px] truncate" title={item.observacoes || ''}>
                          {item.observacoes || '-'}
                        </td>
                        <td className="p-4 align-middle">
                          <div className="flex gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-9 px-3"
                              title="Editar item"
                              onClick={() => startEditingItem(index)}
                              disabled={editingItemIndex === index}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              className="h-9 px-3"
                              onClick={() => removeItem(index)}
                              disabled={(formData.itens?.length || 0) <= 1 || editingItemIndex === index}
                              title="Remover item"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totais */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                  <label className="font-medium text-sm text-blue-600 dark:text-blue-400">Peso Total</label>
                  <p className="text-lg font-semibold text-blue-700 dark:text-blue-300">
                    {totals.totPeso.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} kg
                  </p>
                </div>
                <div className="bg-green-50 dark:bg-green-950/30 p-4 rounded-lg border border-green-200 dark:border-green-800">
                  <label className="font-medium text-sm text-green-600 dark:text-green-400">Valor Total</label>
                  <p className="text-lg font-semibold text-green-700 dark:text-green-300">
                    R$&nbsp;{totals.totValorMerc.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="bg-purple-50 dark:bg-purple-950/30 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                  <label className="font-medium text-sm text-purple-600 dark:text-purple-400">Volume Total</label>
                  <p className="text-lg font-semibold text-purple-700 dark:text-purple-300">
                    {totals.totVolume} unidades
                  </p>
                </div>
                <div className="bg-orange-50 dark:bg-orange-950/30 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
                  <label className="font-medium text-sm text-orange-600 dark:text-orange-400">M³ Total</label>
                  <p className="text-lg font-semibold text-orange-700 dark:text-orange-300">
                    {totals.totM3.toFixed(4)} m³
                  </p>
                </div>
                <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
                  <label className="font-medium text-sm text-amber-600 dark:text-amber-400">Peso Cubado Total</label>
                  <p className="text-lg font-semibold text-amber-700 dark:text-amber-300">
                    {totals.totPesoCubado.toFixed(2)} kg
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderStep5 = () => {
    const totals = calculateTotals();
    const { formatDateOnly } = require('@/utils/dateFormatters');
    const formatDate = (dateStr: string | null | undefined) => {
      if (!dateStr) return '-';
      return formatDateOnly(dateStr);
    };

    return (
      <div className="space-y-6">
        {/* Banner de sucesso */}
        {lastSaved && (
          <Card className="border-green-500 bg-green-50 dark:bg-green-950/30">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Check className="h-6 w-6 text-green-600" />
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-green-800 dark:text-green-300">
                      Coleta salva com sucesso!
                    </h3>
                    <p className="text-green-600 dark:text-green-400 text-sm">
                      Nº da Coleta: {formData.nroColeta || '-'} | ID: {formData.idColeta || coleta?.idColeta}
                    </p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  className="border-green-500 text-green-700 hover:bg-green-100 dark:text-green-400 dark:hover:bg-green-900/30 w-full sm:w-auto"
                  onClick={handleDownloadPDF}
                  disabled={isGeneratingPDF}
                >
                  {isGeneratingPDF ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Gerando PDF...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Baixar PDF
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Grid de cards principais */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Card Informações Gerais */}
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-2xl">
                <Clock className="h-5 w-5" />
                Informações Gerais
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 space-y-2">
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground text-sm">Tipo:</span>
                <span className="font-medium capitalize text-sm">{formData.tipoRegistro || 'coleta'}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground text-sm">Data da Coleta:</span>
                <span className="font-medium text-sm">{formatDate(formData.dataColeta)}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground text-sm">Previsão Entrega:</span>
                <span className="font-medium text-sm">{formatDate(formData.dataPrevisaoEntrega)}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground text-sm">Horário:</span>
                <span className="font-medium text-sm">{formData.horarioColeta || '-'}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground text-sm">Atendimento:</span>
                <span className="font-medium text-sm">
                  {formData.horarioInicioAtendimento || '-'} às {formData.horarioFimAtendimento || '-'}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground text-sm">Para Almoço:</span>
                <span className="font-medium text-sm">
                  {formData.paraAlmoco ? `Sim (${formData.horarioInicioAlmoco} - ${formData.horarioFimAlmoco})` : 'Não'}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground text-sm">Status:</span>
                <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold">
                  {formData.status || 'PENDENTE'}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground text-sm">Solicitante:</span>
                <span className="font-medium text-sm">{formData.nomeSolicitante || '-'}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground text-sm">Fator Cubagem:</span>
                <span className="font-medium text-sm">{fatorCubagem}</span>
              </div>
            </CardContent>
          </Card>

          {/* Card Clientes */}
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-2xl">
                <User className="h-5 w-5" />
                Clientes
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
              {/* Remetente */}
              <div>
                <span className="text-sm text-muted-foreground">Remetente:</span>
                <div className="mt-1 p-2 sm:p-3 bg-muted/50 rounded">
                  <p className="font-medium text-sm sm:text-base">{formData.nomeRemetente || '-'}</p>
                  {formData.cpfCnpjRemetente && (
                    <p className="text-xs sm:text-sm text-muted-foreground">{formData.cpfCnpjRemetente}</p>
                  )}
                  {(formData.cidadeRemetente || formData.bairroRemetente) && (
                    <p className="text-xs text-muted-foreground">
                      {formData.bairroRemetente && `${formData.bairroRemetente}, `}
                      {formData.cidadeRemetente} {formData.ufRemetente && `- ${formData.ufRemetente}`}
                    </p>
                  )}
                </div>
              </div>

              {/* Destinatário */}
              <div>
                <span className="text-sm text-muted-foreground">Destinatário:</span>
                <div className="mt-1 p-2 sm:p-3 bg-muted/50 rounded">
                  <p className="font-medium text-sm sm:text-base">{formData.nomeDestinatario || '-'}</p>
                  {formData.cpfCnpjDestinatario && (
                    <p className="text-xs sm:text-sm text-muted-foreground">{formData.cpfCnpjDestinatario}</p>
                  )}
                  {(formData.cidadeDestinatario || formData.bairroDestinatario) && (
                    <p className="text-xs text-muted-foreground">
                      {formData.bairroDestinatario && `${formData.bairroDestinatario}, `}
                      {formData.cidadeDestinatario} {formData.ufDestinatario && `- ${formData.ufDestinatario}`}
                    </p>
                  )}
                </div>
              </div>

              {/* Origem e Destino */}
              <div className="pt-2 border-t space-y-2">
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground text-sm">Origem:</span>
                  <span className="font-medium text-sm">
                    {formData.cidadeOrigem || '-'} {formData.ufOrigem && `- ${formData.ufOrigem}`}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground text-sm">Destino:</span>
                  <span className="font-medium text-sm">
                    {formData.cidadeDestino || '-'} {formData.ufDestino && `- ${formData.ufDestino}`}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Card Locais Alternativos */}
        {((formData.localColeta?.endereco && formData.localColeta.endereco !== ',') || formData.localEntrega?.endereco) && (
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-2xl">
                <MapPin className="h-5 w-5" />
                Locais Alternativos
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {formData.localColeta?.endereco && formData.localColeta.endereco !== ',' && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-sm font-medium text-blue-700 dark:text-blue-400 mb-1">Local de Coleta</p>
                    <p className="text-sm">{formData.localColeta.endereco}</p>
                    <p className="text-xs text-muted-foreground">
                      {formData.localColeta.bairro && `${formData.localColeta.bairro}, `}
                      {formData.localColeta.cidade} {formData.localColeta.uf && `- ${formData.localColeta.uf}`}
                    </p>
                    {formData.localColeta.cep && (
                      <p className="text-xs text-muted-foreground">CEP: {formData.localColeta.cep}</p>
                    )}
                  </div>
                )}
                {formData.localEntrega?.endereco && (
                  <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                    <p className="text-sm font-medium text-green-700 dark:text-green-400 mb-1">Local de Entrega</p>
                    <p className="text-sm">{formData.localEntrega.endereco}</p>
                    <p className="text-xs text-muted-foreground">
                      {formData.localEntrega.bairro && `${formData.localEntrega.bairro}, `}
                      {formData.localEntrega.cidade} {formData.localEntrega.uf && `- ${formData.localEntrega.uf}`}
                    </p>
                    {formData.localEntrega.cep && (
                      <p className="text-xs text-muted-foreground">CEP: {formData.localEntrega.cep}</p>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Card Itens */}
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-2xl">
              <Package className="h-5 w-5" />
              Itens ({formData.itens?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            {/* Totais coloridos */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4">
              <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded-lg text-center border border-blue-200 dark:border-blue-800">
                <p className="text-xs sm:text-sm text-blue-600 dark:text-blue-400">Peso Total</p>
                <p className="text-base sm:text-lg font-bold text-blue-700 dark:text-blue-300">
                  {totals.totPeso.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} kg
                </p>
              </div>
              <div className="bg-green-50 dark:bg-green-950/30 p-3 rounded-lg text-center border border-green-200 dark:border-green-800">
                <p className="text-xs sm:text-sm text-green-600 dark:text-green-400">Valor Total</p>
                <p className="text-base sm:text-lg font-bold text-green-700 dark:text-green-300">
                  R$ {totals.totValorMerc.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-950/30 p-3 rounded-lg text-center border border-purple-200 dark:border-purple-800">
                <p className="text-xs sm:text-sm text-purple-600 dark:text-purple-400">Volume</p>
                <p className="text-base sm:text-lg font-bold text-purple-700 dark:text-purple-300">
                  {totals.totVolume} un
                </p>
              </div>
              <div className="bg-orange-50 dark:bg-orange-950/30 p-3 rounded-lg text-center border border-orange-200 dark:border-orange-800">
                <p className="text-xs sm:text-sm text-orange-600 dark:text-orange-400">M³ Total</p>
                <p className="text-base sm:text-lg font-bold text-orange-700 dark:text-orange-300">
                  {totals.totM3.toFixed(4)}
                </p>
              </div>
              <div className="bg-amber-50 dark:bg-amber-950/30 p-3 rounded-lg text-center border border-amber-200 dark:border-amber-800 col-span-2 md:col-span-1">
                <p className="text-xs sm:text-sm text-amber-600 dark:text-amber-400">Peso Cubado</p>
                <p className="text-base sm:text-lg font-bold text-amber-700 dark:text-amber-300">
                  {totals.totPesoCubado.toFixed(2)} kg
                </p>
              </div>
            </div>

            {/* Lista de itens */}
            {formData.itens && formData.itens.length > 0 && (
              <div className="mt-4 space-y-2">
                {formData.itens.map((item, index) => (
                  <div key={index} className="p-3 bg-muted/30 rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">Item {index + 1}</span>
                      {item.numeroNf && (
                        <span className="text-xs text-muted-foreground">NF: {item.numeroNf}</span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs sm:text-sm">
                      <div>
                        <span className="text-muted-foreground">Peso:</span>
                        <span className="ml-1 font-medium">{item.peso?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} kg</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Valor:</span>
                        <span className="ml-1 font-medium">R$ {item.valorMercadoria?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Volume:</span>
                        <span className="ml-1 font-medium">{item.volume}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">M³:</span>
                        <span className="ml-1 font-medium">{item.m3?.toFixed(4) || '0.0000'}</span>
                      </div>
                    </div>
                    {item.observacoes && (
                      <p className="mt-2 text-xs text-muted-foreground">Obs: {item.observacoes}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Observações gerais */}
        {formData.observacoes && (
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-2xl">
                <FileText className="h-5 w-5" />
                Observações
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <p className="text-sm text-muted-foreground p-3 bg-muted rounded-lg">
                {formData.observacoes}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      case 4:
        return renderStep4();
      case 5:
        return renderStep5();
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-1rem)] sm:w-[calc(100%-2rem)] max-w-[98vw] sm:max-w-[95vw] md:max-w-6xl max-h-[98vh] sm:max-h-[95vh] overflow-hidden p-0 mx-auto">
        <ScrollArea className="h-[90vh] sm:h-[88vh] md:h-[90vh]">
          <div className="p-2 sm:p-4 md:p-6">
            <DialogHeader className="mb-3 sm:mb-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Package className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" />
                  <DialogTitle className="text-base sm:text-xl md:text-2xl truncate">
                    Editar Coleta {coleta?.nroColeta || coleta?.idColeta}
                  </DialogTitle>
                </div>
                <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                  {lastSaved && (
                    <div className="flex items-center gap-1 sm:gap-2 text-green-600">
                      <Check className="h-4 w-4" />
                      <span className="text-xs sm:text-sm hidden sm:inline">Salvo</span>
                    </div>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onOpenChange(false)}
                    className="h-8 w-8 touch-manipulation"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </DialogHeader>

            {/* Stepper */}
            <Card className="mb-4 sm:mb-6">
              <CardContent className="p-3 sm:pt-6 sm:p-6">
                {renderStepIndicator()}
                <Progress value={progressPercentage} className="h-1.5 sm:h-2" />
                <p className="text-xs sm:text-sm text-muted-foreground mt-2 text-center">
                  Etapa {currentStep} de {STEPS.length}: <span className="hidden sm:inline">{STEPS[currentStep - 1].description}</span><span className="sm:hidden">{STEPS[currentStep - 1].name}</span>
                </p>
              </CardContent>
            </Card>

            {/* Step Content */}
            <div className="transition-all duration-200 ease-out">{renderCurrentStep()}</div>

            {/* Navigation */}
            <Card className="mt-3 sm:mt-6">
              <CardContent className="p-3 sm:pt-6 sm:p-6">
                <div className="flex justify-between items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => goToStep(currentStep - 1)}
                    disabled={currentStep === 1}
                    size="sm"
                    className="h-9 sm:h-10 px-3 sm:px-4 touch-manipulation"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="hidden sm:inline ml-2">Anterior</span>
                  </Button>
                  <div className="flex gap-2">
                    {currentStep < STEPS.length ? (
                      <Button 
                        onClick={() => goToStep(currentStep + 1)} 
                        size="sm" 
                        className="h-9 sm:h-10 px-3 sm:px-4 touch-manipulation"
                      >
                        <span className="hidden sm:inline mr-2">Próximo</span>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button 
                        onClick={handleSave} 
                        disabled={isSaving} 
                        size="sm" 
                        className="h-9 sm:h-10 px-3 sm:px-4 touch-manipulation"
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-1" />
                            <span className="hidden sm:inline">Salvando...</span>
                          </>
                        ) : (
                          <>
                            <span className="hidden sm:inline mr-2">Salvar Alterações</span>
                            <span className="sm:hidden">Salvar</span>
                            <Check className="h-4 w-4 ml-1" />
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </DialogContent>

      {/* Modal de Seleção de Remetente */}
      <SelectRegisterModal
        open={remetenteModalOpen}
        onOpenChange={setRemetenteModalOpen}
        onSelect={handleSelectRemetente}
        title="Selecionar Remetente"
      />

      {/* Modal de Seleção de Destinatário */}
      <SelectRegisterModal
        open={destinatarioModalOpen}
        onOpenChange={setDestinatarioModalOpen}
        onSelect={handleSelectDestinatario}
        title="Selecionar Destinatário"
      />

      {/* Modal de Seleção de Cidade de Origem */}
      <SelectCityModal
        open={cidadeOrigemModalOpen}
        onOpenChange={setCidadeOrigemModalOpen}
        onSelect={handleSelectCidadeOrigem}
        title="Selecionar Cidade de Origem"
      />

      {/* Modal de Seleção de Cidade de Destino */}
      <SelectCityModal
        open={cidadeDestinoModalOpen}
        onOpenChange={setCidadeDestinoModalOpen}
        onSelect={handleSelectCidadeDestino}
        title="Selecionar Cidade de Destino"
      />
    </Dialog>
  );
};

export default EditarColetaModal;
