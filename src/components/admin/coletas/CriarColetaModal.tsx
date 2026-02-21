import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Package, User, MapPin, Plus, Send, Search, Trash2, Loader2, Sparkles, Pencil, Check, Copy } from 'lucide-react';
import { backendService } from '@/services/api/backendService';
import { ColetaPayload, ColetaItemPayload } from '@/types/coleta.types';
import { useToast } from '@/hooks/use-toast';
import { SelectRegisterModal } from '@/components/modals/SelectRegisterModal';
import { SelectCityModal } from '@/components/modals/SelectCityModal';
import { fetchCEP, formatValorInput, parseValorToNumber } from '@/lib/formatters';
interface CriarColetaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: (data: any) => void;
}
interface ItemColeta {
  id: string;
  numeroNF: string;
  chaveNFe: string;
  peso: string;
  valor: string;
  tipoMercadoria: string;
  natureza: string;
  volume: string;
  altura: string;
  largura: string;
  profundidade: string;
  observacoes: string;
}
const initialItem: Omit<ItemColeta, 'id'> = {
  numeroNF: '',
  chaveNFe: '',
  peso: '',
  valor: '',
  tipoMercadoria: '',
  natureza: '',
  volume: '',
  altura: '',
  largura: '',
  profundidade: '',
  observacoes: ''
};
export const CriarColetaModal = ({
  open,
  onOpenChange,
  onSave
}: CriarColetaModalProps) => {
  const { toast } = useToast();
  const [aiPrompt, setAiPrompt] = useState('');
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state - data coleta default para hoje
  const today = new Date().toISOString().split('T')[0];
  const [formData, setFormData] = useState({
    tipoRegistro: 'coleta',
    nomeSolicitante: '',
    dataColeta: today,
    dataPrevisaoEntrega: '',
    status: 'pendente',
    horarioColeta: '',
    horarioInicioAtendimento: '',
    horarioFimAtendimento: '',
    paraAlmoco: 'nao',
    horarioInicioAlmoco: '',
    horarioFimAlmoco: '',
    observacoes: '',
    // Local alternativo coleta
    coletaCep: '',
    coletaUf: '',
    coletaCidade: '',
    coletaEndereco: '',
    coletaNumero: '',
    coletaBairro: '',
    // Local alternativo entrega
    entregaCep: '',
    entregaUf: '',
    entregaCidade: '',
    entregaEndereco: '',
    entregaNumero: '',
    entregaBairro: ''
  });
  const [currentItem, setCurrentItem] = useState<Omit<ItemColeta, 'id'>>(initialItem);
  const [itens, setItens] = useState<ItemColeta[]>([]);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [successColetaId, setSuccessColetaId] = useState<number | null>(null);

  // Seleção de remetente/destinatário
  const [remetenteModalOpen, setRemetenteModalOpen] = useState(false);
  const [destinatarioModalOpen, setDestinatarioModalOpen] = useState(false);
  const [selectedRemetente, setSelectedRemetente] = useState<any>(null);
  const [selectedDestinatario, setSelectedDestinatario] = useState<any>(null);

  // Seleção de cidades
  const [cidadeOrigemModalOpen, setCidadeOrigemModalOpen] = useState(false);
  const [cidadeDestinoModalOpen, setCidadeDestinoModalOpen] = useState(false);
  const [selectedCidadeOrigem, setSelectedCidadeOrigem] = useState<any>(null);
  const [selectedCidadeDestino, setSelectedCidadeDestino] = useState<any>(null);

  // Loading states para CEP
  const [loadingColetaCep, setLoadingColetaCep] = useState(false);
  const [loadingEntregaCep, setLoadingEntregaCep] = useState(false);

  // Valores iniciais do formulário - data coleta default para hoje
  const initialFormData = {
    tipoRegistro: 'coleta',
    nomeSolicitante: '',
    dataColeta: new Date().toISOString().split('T')[0],
    dataPrevisaoEntrega: '',
    status: 'pendente',
    horarioColeta: '',
    horarioInicioAtendimento: '',
    horarioFimAtendimento: '',
    paraAlmoco: 'nao',
    horarioInicioAlmoco: '',
    horarioFimAlmoco: '',
    observacoes: '',
    coletaCep: '',
    coletaUf: '',
    coletaCidade: '',
    coletaEndereco: '',
    coletaNumero: '',
    coletaBairro: '',
    entregaCep: '',
    entregaUf: '',
    entregaCidade: '',
    entregaEndereco: '',
    entregaNumero: '',
    entregaBairro: ''
  };

  // Resetar formulário quando o modal abrir
  useEffect(() => {
    if (open) {
      setFormData(initialFormData);
      setCurrentItem(initialItem);
      setItens([]);
      setSelectedRemetente(null);
      setSelectedDestinatario(null);
      setSelectedCidadeOrigem(null);
      setSelectedCidadeDestino(null);
      setAiPrompt('');
      setEditingItemId(null);
    }
  }, [open]);

  // Busca CEP via BrasilAPI para local alternativo de coleta
  const handleColetaCepBlur = useCallback(async () => {
    const cep = formData.coletaCep.replace(/\D/g, '');
    if (cep.length !== 8) return;
    
    setLoadingColetaCep(true);
    try {
      const data = await fetchCEP(cep);
      if (data) {
        setFormData(prev => ({
          ...prev,
          coletaUf: data.state || '',
          coletaCidade: data.city || '',
          coletaEndereco: data.street || '',
          coletaBairro: data.neighborhood || ''
        }));
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
    } finally {
      setLoadingColetaCep(false);
    }
  }, [formData.coletaCep]);

  // Busca CEP via BrasilAPI para local alternativo de entrega
  const handleEntregaCepBlur = useCallback(async () => {
    const cep = formData.entregaCep.replace(/\D/g, '');
    if (cep.length !== 8) return;
    
    setLoadingEntregaCep(true);
    try {
      const data = await fetchCEP(cep);
      if (data) {
        setFormData(prev => ({
          ...prev,
          entregaUf: data.state || '',
          entregaCidade: data.city || '',
          entregaEndereco: data.street || '',
          entregaBairro: data.neighborhood || ''
        }));
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
    } finally {
      setLoadingEntregaCep(false);
    }
  }, [formData.entregaCep]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  const handleItemChange = (field: keyof Omit<ItemColeta, 'id'>, value: string) => {
    setCurrentItem(prev => ({
      ...prev,
      [field]: value
    }));
  };
  const handleAddItem = () => {
    if (!currentItem.peso) return;
    
    if (editingItemId) {
      // Atualizar item existente
      setItens(prev => prev.map(item => 
        item.id === editingItemId 
          ? { ...currentItem, id: editingItemId }
          : item
      ));
      setEditingItemId(null);
    } else {
      // Adicionar novo item
      setItens(prev => [...prev, {
        ...currentItem,
        id: crypto.randomUUID()
      }]);
    }
    setCurrentItem(initialItem);
  };
  
  const handleEditItem = (id: string) => {
    const item = itens.find(i => i.id === id);
    if (item) {
      setCurrentItem({
        numeroNF: item.numeroNF,
        chaveNFe: item.chaveNFe,
        peso: item.peso,
        valor: item.valor,
        tipoMercadoria: item.tipoMercadoria,
        natureza: item.natureza,
        volume: item.volume,
        altura: item.altura,
        largura: item.largura,
        profundidade: item.profundidade,
        observacoes: item.observacoes
      });
      setEditingItemId(id);
    }
  };
  
  const handleCancelEdit = () => {
    setEditingItemId(null);
    setCurrentItem(initialItem);
  };
  
  const handleRemoveItem = (id: string) => {
    setItens(prev => prev.filter(item => item.id !== id));
    if (editingItemId === id) {
      setEditingItemId(null);
      setCurrentItem(initialItem);
    }
  };
  const handleSendToAI = async () => {
    if (!aiPrompt.trim()) return;
    setIsProcessingAI(true);
    
    try {
      const contexto = `Você é um assistente especializado em logística e transporte de cargas no Brasil.
Sua tarefa principal é EXTRAIR INFORMAÇÕES da solicitação de coleta e retornar um JSON válido.

RETORNE APENAS UM JSON VÁLIDO no seguinte formato (sem texto adicional):
{
  "solicitante": "",
  "remetente": { "nome": "", "documento": "", "cidade": "", "uf": "" },
  "destinatario": { "nome": "", "documento": "", "cidade": "", "uf": "" },
  "localColeta": { "cep": "", "endereco": "", "numero": "", "bairro": "", "cidade": "", "uf": "" },
  "localEntrega": { "cep": "", "endereco": "", "numero": "", "bairro": "", "cidade": "", "uf": "" },
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
- Local de coleta alternativo: Se o endereço de coleta/origem for diferente do endereço do remetente, preencha localColeta
- Local de entrega alternativo: Se o endereço de entrega/destino for diferente do endereço do destinatário, preencha localEntrega
- CEP: Se informado CEP de coleta ou entrega (8 dígitos), extraia para localColeta.cep ou localEntrega.cep

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
          handleChange('nomeSolicitante', dados.solicitante);
          camposPreenchidos.push('solicitante');
        }
        
        // Preencher campos do formulário com os dados extraídos
        if (dados.dataColeta) {
          handleChange('dataColeta', dados.dataColeta);
          camposPreenchidos.push('data');
        }
        if (dados.horarioColeta) {
          handleChange('horarioColeta', dados.horarioColeta);
          camposPreenchidos.push('horário coleta');
        }
        if (dados.horarioInicioAtendimento) {
          handleChange('horarioInicioAtendimento', dados.horarioInicioAtendimento);
        }
        if (dados.horarioFimAtendimento) {
          handleChange('horarioFimAtendimento', dados.horarioFimAtendimento);
        }
        
        // Preencher pausa para almoço
        if (dados.paraAlmoco === true || dados.paraAlmoco === 'true') {
          handleChange('paraAlmoco', 'sim');
          camposPreenchidos.push('pausa almoço');
          if (dados.horarioInicioAlmoco) {
            handleChange('horarioInicioAlmoco', dados.horarioInicioAlmoco);
          }
          if (dados.horarioFimAlmoco) {
            handleChange('horarioFimAlmoco', dados.horarioFimAlmoco);
          }
        }
        
        if (dados.observacoes) {
          handleChange('observacoes', dados.observacoes);
          camposPreenchidos.push('observações');
        }
        
        // Buscar e selecionar remetente automaticamente (precisa ter documento)
        if (dados.remetente?.documento) {
          const termoRemetente = dados.remetente.documento;
          console.log('🔍 [AI] Buscando remetente por documento:', termoRemetente);
          try {
            const resRemetente = await backendService.buscarCadastro(termoRemetente);
            const raw = resRemetente.data;
            console.log('📋 [AI] Resposta bruta remetente:', raw);
            
            // Parsing para todas as estruturas possíveis (N8N, array aninhado, array direto, objeto)
            let remetenteData: any[] = [];
            if (Array.isArray(raw)) {
              if (raw.length > 0 && raw[0]?.json?.data) {
                // Estrutura N8N: [{json: {data: [...]}}]
                remetenteData = Array.isArray(raw[0].json.data) ? raw[0].json.data : [raw[0].json.data];
              } else if (raw.length > 0 && Array.isArray(raw[0])) {
                // Array aninhado: [[...]]
                remetenteData = raw[0];
              } else if (raw.length > 0 && raw[0]?.idCliente) {
                // Array direto: [{idCliente: ...}]
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
              setSelectedRemetente(remetente);
              camposPreenchidos.push('remetente');
              console.log('✅ [AI] Remetente selecionado:', remetente);
              
              // Se o remetente tem idCidade, usar diretamente
              if (remetente.idCidade) {
                setSelectedCidadeOrigem({
                  cidade: remetente.cidade || '',
                  uf: remetente.uf || '',
                  idCidade: remetente.idCidade
                });
                camposPreenchidos.push('cidade origem');
                console.log('✅ [AI] Cidade origem selecionada via idCidade:', remetente.idCidade);
              } else if (remetente.cidade && remetente.uf) {
                // Fallback: buscar cidade por nome
                console.log('🔍 [AI] Buscando cidade origem do remetente:', remetente.cidade, remetente.uf);
                const resCidadeOrigem = await backendService.buscarCidades({ nome: remetente.cidade, uf: remetente.uf });
                const cidadesOrigem = Array.isArray(resCidadeOrigem.data) ? resCidadeOrigem.data : [];
                if (cidadesOrigem.length > 0) {
                  setSelectedCidadeOrigem(cidadesOrigem[0]);
                  camposPreenchidos.push('cidade origem');
                  console.log('✅ [AI] Cidade origem selecionada:', cidadesOrigem[0]);
                }
              }
            } else {
              console.log('⚠️ [AI] Nenhum remetente encontrado para documento:', termoRemetente);
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
              setSelectedCidadeOrigem(cidadesOrigem[0]);
              camposPreenchidos.push('cidade origem');
            }
          } catch (e) {
            console.error('❌ [AI] Erro ao buscar cidade origem:', e);
          }
        }
        
        // Buscar e selecionar destinatário automaticamente (precisa ter documento)
        if (dados.destinatario?.documento) {
          const termoDestinatario = dados.destinatario.documento;
          console.log('🔍 [AI] Buscando destinatário por documento:', termoDestinatario);
          try {
            const resDestinatario = await backendService.buscarCadastro(termoDestinatario);
            const raw = resDestinatario.data;
            console.log('📋 [AI] Resposta bruta destinatário:', raw);
            
            // Parsing para todas as estruturas possíveis (N8N, array aninhado, array direto, objeto)
            let destinatarioData: any[] = [];
            if (Array.isArray(raw)) {
              if (raw.length > 0 && raw[0]?.json?.data) {
                // Estrutura N8N: [{json: {data: [...]}}]
                destinatarioData = Array.isArray(raw[0].json.data) ? raw[0].json.data : [raw[0].json.data];
              } else if (raw.length > 0 && Array.isArray(raw[0])) {
                // Array aninhado: [[...]]
                destinatarioData = raw[0];
              } else if (raw.length > 0 && raw[0]?.idCliente) {
                // Array direto: [{idCliente: ...}]
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
              setSelectedDestinatario(destinatario);
              camposPreenchidos.push('destinatário');
              console.log('✅ [AI] Destinatário selecionado:', destinatario);
              
              // Se o destinatário tem idCidade, usar diretamente
              if (destinatario.idCidade) {
                setSelectedCidadeDestino({
                  cidade: destinatario.cidade || '',
                  uf: destinatario.uf || '',
                  idCidade: destinatario.idCidade
                });
                camposPreenchidos.push('cidade destino');
                console.log('✅ [AI] Cidade destino selecionada via idCidade:', destinatario.idCidade);
              } else if (destinatario.cidade && destinatario.uf) {
                // Fallback: buscar cidade por nome
                console.log('🔍 [AI] Buscando cidade destino do destinatário:', destinatario.cidade, destinatario.uf);
                const resCidadeDestino = await backendService.buscarCidades({ nome: destinatario.cidade, uf: destinatario.uf });
                const cidadesDestino = Array.isArray(resCidadeDestino.data) ? resCidadeDestino.data : [];
                if (cidadesDestino.length > 0) {
                  setSelectedCidadeDestino(cidadesDestino[0]);
                  camposPreenchidos.push('cidade destino');
                  console.log('✅ [AI] Cidade destino selecionada:', cidadesDestino[0]);
                }
              }
            } else {
              console.log('⚠️ [AI] Nenhum destinatário encontrado para documento:', termoDestinatario);
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
              setSelectedCidadeDestino(cidadesDestino[0]);
              camposPreenchidos.push('cidade destino');
            }
          } catch (e) {
            console.error('❌ [AI] Erro ao buscar cidade destino:', e);
          }
        }
        
        // Se houver dados de local de coleta alternativo, preencher
        if (dados.localColeta) {
          if (dados.localColeta.cep) {
            handleChange('coletaCep', dados.localColeta.cep);
            
            // Buscar dados completos do CEP automaticamente
            const cepLimpo = dados.localColeta.cep.replace(/\D/g, '');
            if (cepLimpo.length === 8) {
              try {
                const dadosCep = await fetchCEP(cepLimpo);
                if (dadosCep) {
                  // Só preenche se a IA não tiver retornado os dados
                  if (!dados.localColeta.uf && dadosCep.state) {
                    handleChange('coletaUf', dadosCep.state);
                  }
                  if (!dados.localColeta.cidade && dadosCep.city) {
                    handleChange('coletaCidade', dadosCep.city);
                  }
                  if (!dados.localColeta.bairro && dadosCep.neighborhood) {
                    handleChange('coletaBairro', dadosCep.neighborhood);
                  }
                  if (!dados.localColeta.endereco && dadosCep.street) {
                    handleChange('coletaEndereco', dadosCep.street);
                  }
                }
              } catch (error) {
                console.error('Erro ao buscar CEP automaticamente:', error);
              }
            }
          }
          if (dados.localColeta.endereco) {
            handleChange('coletaEndereco', dados.localColeta.endereco);
          }
          if (dados.localColeta.numero) {
            handleChange('coletaNumero', dados.localColeta.numero);
          }
          if (dados.localColeta.bairro) {
            handleChange('coletaBairro', dados.localColeta.bairro);
          }
          if (dados.localColeta.cidade) {
            handleChange('coletaCidade', dados.localColeta.cidade);
          }
          if (dados.localColeta.uf) {
            handleChange('coletaUf', dados.localColeta.uf);
          }
          camposPreenchidos.push('local coleta alternativo');
        }
        
        // Se houver dados de local de entrega alternativo, preencher
        if (dados.localEntrega) {
          if (dados.localEntrega.cep) {
            handleChange('entregaCep', dados.localEntrega.cep);
            
            // Buscar dados completos do CEP automaticamente
            const cepLimpo = dados.localEntrega.cep.replace(/\D/g, '');
            if (cepLimpo.length === 8) {
              try {
                const dadosCep = await fetchCEP(cepLimpo);
                if (dadosCep) {
                  // Só preenche se a IA não tiver retornado os dados
                  if (!dados.localEntrega.uf && dadosCep.state) {
                    handleChange('entregaUf', dadosCep.state);
                  }
                  if (!dados.localEntrega.cidade && dadosCep.city) {
                    handleChange('entregaCidade', dadosCep.city);
                  }
                  if (!dados.localEntrega.bairro && dadosCep.neighborhood) {
                    handleChange('entregaBairro', dadosCep.neighborhood);
                  }
                  if (!dados.localEntrega.endereco && dadosCep.street) {
                    handleChange('entregaEndereco', dadosCep.street);
                  }
                }
              } catch (error) {
                console.error('Erro ao buscar CEP automaticamente:', error);
              }
            }
          }
          if (dados.localEntrega.endereco) {
            handleChange('entregaEndereco', dados.localEntrega.endereco);
          }
          if (dados.localEntrega.numero) {
            handleChange('entregaNumero', dados.localEntrega.numero);
          }
          if (dados.localEntrega.bairro) {
            handleChange('entregaBairro', dados.localEntrega.bairro);
          }
          if (dados.localEntrega.cidade) {
            handleChange('entregaCidade', dados.localEntrega.cidade);
          }
          if (dados.localEntrega.uf) {
            handleChange('entregaUf', dados.localEntrega.uf);
          }
          camposPreenchidos.push('local entrega alternativo');
        }
        
        // Se houver dados de mercadoria, adicionar como item
        if (dados.mercadoria && (dados.mercadoria.peso || dados.mercadoria.descricao)) {
          // Construir observações com embalagem se disponível
          let observacoes = '';
          if (dados.mercadoria.embalagem) {
            observacoes = `Embalagem: ${dados.mercadoria.embalagem}`;
          }
          
          const novoItem: ItemColeta = {
            id: crypto.randomUUID(),
            numeroNF: '',
            chaveNFe: '',
            peso: dados.mercadoria.peso || '',
            valor: dados.mercadoria.valor || '',
            tipoMercadoria: dados.mercadoria.descricao || '',
            natureza: '',
            volume: dados.mercadoria.quantidade || '1',
            altura: dados.mercadoria.altura || '',
            largura: dados.mercadoria.largura || '',
            profundidade: dados.mercadoria.profundidade || '',
            observacoes
          };
          setItens(prev => [...prev, novoItem]);
          camposPreenchidos.push('mercadoria');
        }
        
        toast({
          title: 'IA processou a solicitação',
          description: camposPreenchidos.length > 0 
            ? `Campos preenchidos: ${camposPreenchidos.join(', ')}` 
            : 'Verifique os campos e complete as informações faltantes.'
        });
      } else {
        toast({
          title: 'Erro ao processar',
          description: result.error || 'Não foi possível extrair os dados',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Erro ao enviar para IA:', error);
      toast({
        title: 'Erro de conexão',
        description: 'Não foi possível conectar ao serviço de IA',
        variant: 'destructive'
      });
    } finally {
      setIsProcessingAI(false);
    }
  };
  const handleSave = async () => {
    // Validação básica
    if (!selectedRemetente) {
      toast({ title: 'Remetente obrigatório', variant: 'destructive' });
      return;
    }
    if (!selectedCidadeOrigem) {
      toast({ title: 'Cidade de origem obrigatória', variant: 'destructive' });
      return;
    }
    if (!formData.dataColeta) {
      toast({ title: 'Data de coleta obrigatória', variant: 'destructive' });
      return;
    }
    if (!formData.horarioColeta) {
      toast({ title: 'Horário de coleta obrigatório', variant: 'destructive' });
      return;
    }
    if (itens.length === 0) {
      toast({ title: 'Adicione pelo menos um item', variant: 'destructive' });
      return;
    }
    if (!selectedRemetente?.idCliente) {
      toast({ title: 'Selecione o remetente', variant: 'destructive' });
      return;
    }
    if (!selectedDestinatario?.idCliente) {
      toast({ title: 'Selecione o destinatário', variant: 'destructive' });
      return;
    }
    if (!selectedCidadeOrigem?.idCidade) {
      toast({ title: 'Selecione a cidade de origem', variant: 'destructive' });
      return;
    }
    if (!selectedCidadeDestino?.idCidade) {
      toast({ title: 'Selecione a cidade de destino', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);

    try {
      // Mapear itens para o formato da API
      const itensPayload: ColetaItemPayload[] = itens.map(item => {
        const altura = parseFloat(item.altura) || 0;
        const largura = parseFloat(item.largura) || 0;
        const profundidade = parseFloat(item.profundidade) || 0;
        const volume = parseFloat(item.volume) || 1;
        const m3 = profundidade * largura * altura * volume;
        const pesoCubado = m3 * 300;

        return {
          peso: parseFloat(item.peso) || 0,
          valorMercadoria: parseValorToNumber(item.valor),
          tipoMercadoria: item.tipoMercadoria || '',
          natureza: item.natureza || '',
          volume: parseFloat(item.volume) || 1,
          altura,
          largura,
          profundidade,
          m3: parseFloat(m3.toFixed(4)),
          pesoCubado: parseFloat(pesoCubado.toFixed(2)),
          observacoes: item.observacoes || '',
          chaveAcessoNfe: item.chaveNFe || '',
          numeroNf: item.numeroNF || '',
          un: 'kg'
        };
      });

      // Montar payload da coleta
      const coletaPayload: ColetaPayload = {
        idEmpresa: 2,
        tipoRegistro: 'coleta',
        status: 'PENDENTE',
        idRemetente: selectedRemetente?.idCliente || 0,
        nomeRemetente: selectedRemetente?.nome || '',
        cpfCnpjRemetente: selectedRemetente?.cnpjcpf || '',
        cidadeRemetente: selectedRemetente?.cidade || '',
        ufRemetente: selectedRemetente?.uf || '',
        bairroRemetente: selectedRemetente?.bairro || '',
        idCidadeRemetente: selectedRemetente?.idCidade || 0,
        idDestinatario: selectedDestinatario?.idCliente || 0,
        nomeDestinatario: selectedDestinatario?.nome || '',
        cpfCnpjDestinatario: selectedDestinatario?.cnpjcpf || '',
        cidadeDestinatario: selectedDestinatario?.cidade || '',
        ufDestinatario: selectedDestinatario?.uf || '',
        bairroDestinatario: selectedDestinatario?.bairro || '',
        idCidadeDestinatario: selectedDestinatario?.idCidade || 0,
        cidadeOrigem: selectedCidadeOrigem?.cidade || '',
        ufOrigem: selectedCidadeOrigem?.uf || '',
        idCidadeOrigem: selectedRemetente?.idCidade || 0,
        cidadeDestino: selectedCidadeDestino?.cidade || '',
        ufDestino: selectedCidadeDestino?.uf || '',
        idCidadeDestino: selectedDestinatario?.idCidade || 0,
        nomeSolicitante: formData.nomeSolicitante,
        dataColeta: formData.dataColeta,
        dataPrevisaoEntrega: formData.dataPrevisaoEntrega || null,
        horarioColeta: formData.horarioColeta,
        horarioInicioAtendimento: formData.horarioInicioAtendimento || '',
        horarioFimAtendimento: formData.horarioFimAtendimento || '',
        paraAlmoco: formData.paraAlmoco === 'sim',
        horarioInicioAlmoco: formData.horarioInicioAlmoco || '',
        horarioFimAlmoco: formData.horarioFimAlmoco || '',
        observacoes: formData.observacoes || '',
        ...(formData.coletaCep || formData.coletaEndereco || formData.coletaBairro || formData.coletaCidade
          ? {
              localColeta: {
                cep: formData.coletaCep.replace(/\D/g, ''),
                endereco: formData.coletaNumero 
                  ? `${formData.coletaEndereco}, ${formData.coletaNumero}` 
                  : formData.coletaEndereco || '',
                bairro: formData.coletaBairro || '',
                cidade: formData.coletaCidade || '',
                uf: formData.coletaUf || '',
                idCidade: null
              }
            }
          : {}),
        ...(formData.entregaCep || formData.entregaEndereco || formData.entregaBairro || formData.entregaCidade
          ? {
              localEntrega: {
                cep: formData.entregaCep.replace(/\D/g, ''),
                endereco: formData.entregaNumero 
                  ? `${formData.entregaEndereco}, ${formData.entregaNumero}` 
                  : formData.entregaEndereco || '',
                bairro: formData.entregaBairro || '',
                cidade: formData.entregaCidade || '',
                uf: formData.entregaUf || '',
                idCidade: null
              }
            }
          : {}),
        itens: itensPayload
      };

      // Enviar para o backend
      const response = await backendService.criarColeta(coletaPayload);

      if (!response.success) {
        throw new Error(response.error || 'Erro ao criar coleta');
      }

      const coletaId = response.data?.idColeta;

      // Mostrar modal de sucesso com o número da coleta
      setSuccessColetaId(coletaId || null);

      // Resetar formulário
      setFormData(initialFormData);
      setCurrentItem(initialItem);
      setItens([]);
      setSelectedRemetente(null);
      setSelectedDestinatario(null);
      setSelectedCidadeOrigem(null);
      setSelectedCidadeDestino(null);

      // Callback para atualizar lista
      const data = {
        ...formData,
        remetente: selectedRemetente,
        destinatario: selectedDestinatario,
        cidadeOrigem: selectedCidadeOrigem,
        cidadeDestino: selectedCidadeDestino,
        itens,
        idColeta: coletaId
      };
      onSave?.(data);
    } catch (error) {
      console.error('Erro ao criar coleta:', error);
      toast({
        title: 'Erro ao criar coleta',
        description: error instanceof Error ? error.message : 'Tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  return <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[95vh] p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Package className="h-6 w-6" />
              Criar Nova Coleta
            </DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="max-h-[calc(95vh-100px)]">
            <div className="p-6 space-y-6">
              {/* Aviso sobre taxa adicional */}
              <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg">
                <Package className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                  Atenção: Caso a mercadoria não esteja disponível no momento da coleta, poderá ser cobrada taxa adicional para segunda retirada.
                </p>
              </div>
              {/* AI Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    Assistente IA para Coletas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Descreva a coleta por texto e a IA preencherá os campos automaticamente
                  </p>
                  <Textarea
                    placeholder="Ex: Coleta para a empresa XYZ em São Paulo SP, destino Rio de Janeiro RJ, peso 500kg, valor da mercadoria R$ 10.000, horário 14:00..."
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    rows={3}
                  />
                  <Button 
                    onClick={handleSendToAI} 
                    disabled={!aiPrompt.trim() || isProcessingAI}
                    className="w-full"
                  >
                    {isProcessingAI ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Enviar para IA
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>


              {/* Informações da Coleta */}
              <Card>
                <CardHeader>
                  <CardTitle>Informações da Coleta</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div>
                      <Label>Tipo de Registro *</Label>
                      <Select value={formData.tipoRegistro} onValueChange={v => handleChange('tipoRegistro', v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="coleta">Coleta</SelectItem>
                          <SelectItem value="programacao">Programação</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Nome do Solicitante</Label>
                      <Input placeholder="Nome completo" value={formData.nomeSolicitante} onChange={e => handleChange('nomeSolicitante', e.target.value)} />
                    </div>
                    <div>
                      <Label>Data da Coleta <span className="text-destructive">*</span></Label>
                      <Input type="date" value={formData.dataColeta} onChange={e => handleChange('dataColeta', e.target.value)} />
                    </div>
                    <div>
                      <Label>Data de Previsão de Entrega</Label>
                      <Input type="date" value={formData.dataPrevisaoEntrega} onChange={e => handleChange('dataPrevisaoEntrega', e.target.value)} />
                    </div>
                    <div>
                      <Label>Status *</Label>
                      <Select value={formData.status} onValueChange={v => handleChange('status', v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pendente">Pendente</SelectItem>
                          <SelectItem value="andamento">Em Andamento</SelectItem>
                          <SelectItem value="cancelada">Cancelada</SelectItem>
                          <SelectItem value="realizada">Realizada</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Horário da Coleta <span className="text-destructive">*</span></Label>
                      <Input type="time" value={formData.horarioColeta} onChange={e => handleChange('horarioColeta', e.target.value)} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div>
                      <Label>Horário Início Atendimento</Label>
                      <Input type="time" value={formData.horarioInicioAtendimento} onChange={e => handleChange('horarioInicioAtendimento', e.target.value)} />
                    </div>
                    <div>
                      <Label>Horário Fim Atendimento</Label>
                      <Input type="time" value={formData.horarioFimAtendimento} onChange={e => handleChange('horarioFimAtendimento', e.target.value)} />
                    </div>
                    <div>
                      <Label>Para para Almoço?</Label>
                      <Select value={formData.paraAlmoco} onValueChange={v => handleChange('paraAlmoco', v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="nao">Não</SelectItem>
                          <SelectItem value="sim">Sim</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {formData.paraAlmoco === 'sim' && (
                      <>
                        <div>
                          <Label>Início Almoço</Label>
                          <Input type="time" value={formData.horarioInicioAlmoco} onChange={e => handleChange('horarioInicioAlmoco', e.target.value)} />
                        </div>
                        <div>
                          <Label>Fim Almoço</Label>
                          <Input type="time" value={formData.horarioFimAlmoco} onChange={e => handleChange('horarioFimAlmoco', e.target.value)} />
                        </div>
                      </>
                    )}
                  </div>

                  <div>
                    <Label>Observações</Label>
                    <Textarea placeholder="Observações sobre a coleta..." rows={3} value={formData.observacoes} onChange={e => handleChange('observacoes', e.target.value)} />
                  </div>
                </CardContent>
              </Card>

              {/* Remetente e Destinatário */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Remetente e Destinatário
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Remetente <span className="text-destructive">*</span></Label>
                      <div className="relative mt-1">
                        <Input className="cursor-pointer pr-10" placeholder="Selecione o remetente" readOnly value={selectedRemetente?.nome || ''} onClick={() => setRemetenteModalOpen(true)} />
                        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground cursor-pointer" />
                      </div>
                    </div>
                    <div>
                      <Label>Destinatário <span className="text-destructive">*</span></Label>
                      <div className="relative mt-1">
                        <Input className="cursor-pointer pr-10" placeholder="Selecione o destinatário" readOnly value={selectedDestinatario?.nome || ''} onClick={() => setDestinatarioModalOpen(true)} />
                        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground cursor-pointer" />
                      </div>
                    </div>
                    <div className="pt-4 border-t">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Cidade Origem <span className="text-destructive">*</span></Label>
                          <div className="relative mt-1">
                            <Input className="cursor-pointer pr-10" placeholder="Selecione a cidade de origem" readOnly value={selectedCidadeOrigem ? `${selectedCidadeOrigem.cidade} - ${selectedCidadeOrigem.uf}` : ''} onClick={() => setCidadeOrigemModalOpen(true)} />
                            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground cursor-pointer" />
                          </div>
                        </div>
                        <div>
                          <Label>Cidade Destino <span className="text-destructive">*</span></Label>
                          <div className="relative mt-1">
                            <Input className="cursor-pointer pr-10" placeholder="Selecione a cidade de destino" readOnly value={selectedCidadeDestino ? `${selectedCidadeDestino.cidade} - ${selectedCidadeDestino.uf}` : ''} onClick={() => setCidadeDestinoModalOpen(true)} />
                            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground cursor-pointer" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      Local de Coleta Alternativo
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="relative">
                        <Label>CEP</Label>
                        <Input 
                          placeholder="00000-000" 
                          value={formData.coletaCep} 
                          onChange={e => handleChange('coletaCep', e.target.value)}
                          onBlur={handleColetaCepBlur}
                        />
                        {loadingColetaCep && (
                          <Loader2 className="absolute right-3 top-8 h-4 w-4 animate-spin text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <Label>UF</Label>
                        <Input placeholder="SP" maxLength={2} value={formData.coletaUf} onChange={e => handleChange('coletaUf', e.target.value.toUpperCase())} />
                      </div>
                    </div>
                    <div>
                      <Label>Cidade</Label>
                      <Input placeholder="Nome da cidade" value={formData.coletaCidade} onChange={e => handleChange('coletaCidade', e.target.value)} />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-2">
                        <Label>Endereço</Label>
                        <Input placeholder="Nome da rua" value={formData.coletaEndereco} onChange={e => handleChange('coletaEndereco', e.target.value)} />
                      </div>
                      <div>
                        <Label>Número</Label>
                        <Input placeholder="123" value={formData.coletaNumero} onChange={e => handleChange('coletaNumero', e.target.value)} />
                      </div>
                    </div>
                    <div>
                      <Label>Bairro</Label>
                      <Input placeholder="Nome do bairro" value={formData.coletaBairro} onChange={e => handleChange('coletaBairro', e.target.value)} />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      Local de Entrega Alternativo
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="relative">
                        <Label>CEP</Label>
                        <Input 
                          placeholder="00000-000" 
                          value={formData.entregaCep} 
                          onChange={e => handleChange('entregaCep', e.target.value)}
                          onBlur={handleEntregaCepBlur}
                        />
                        {loadingEntregaCep && (
                          <Loader2 className="absolute right-3 top-8 h-4 w-4 animate-spin text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <Label>UF</Label>
                        <Input placeholder="SP" maxLength={2} value={formData.entregaUf} onChange={e => handleChange('entregaUf', e.target.value.toUpperCase())} />
                      </div>
                    </div>
                    <div>
                      <Label>Cidade</Label>
                      <Input placeholder="Nome da cidade" value={formData.entregaCidade} onChange={e => handleChange('entregaCidade', e.target.value)} />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-2">
                        <Label>Endereço</Label>
                        <Input placeholder="Nome da rua" value={formData.entregaEndereco} onChange={e => handleChange('entregaEndereco', e.target.value)} />
                      </div>
                      <div>
                        <Label>Número</Label>
                        <Input placeholder="123" value={formData.entregaNumero} onChange={e => handleChange('entregaNumero', e.target.value)} />
                      </div>
                    </div>
                    <div>
                      <Label>Bairro</Label>
                      <Input placeholder="Nome do bairro" value={formData.entregaBairro} onChange={e => handleChange('entregaBairro', e.target.value)} />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Itens da Coleta */}
              <Card>
                <CardHeader>
                  <CardTitle>Itens da Coleta <span className="text-destructive">*</span></CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-7 gap-4 p-4 border rounded-lg bg-muted/50">
                    <div>
                      <Label>Número NF</Label>
                      <Input placeholder="123456" value={currentItem.numeroNF} onChange={e => handleItemChange('numeroNF', e.target.value)} />
                    </div>
                    <div>
                      <Label>Chave NFe</Label>
                      <Input placeholder="44 dígitos" maxLength={44} value={currentItem.chaveNFe} onChange={e => handleItemChange('chaveNFe', e.target.value)} />
                    </div>
                    <div>
                      <Label>Peso (kg) *</Label>
                      <Input type="number" placeholder="0.00" step="0.01" value={currentItem.peso} onChange={e => handleItemChange('peso', e.target.value)} />
                    </div>
                    <div>
                      <Label>Valor (R$)</Label>
                      <Input type="text" inputMode="decimal" placeholder="0,00" value={currentItem.valor} onChange={e => handleItemChange('valor', formatValorInput(e.target.value))} />
                    </div>
                    <div>
                      <Label>Natureza</Label>
                      <Input placeholder="Ex: Eletrônicos" value={currentItem.natureza} onChange={e => handleItemChange('natureza', e.target.value)} />
                    </div>
                    <div>
                      <Label>Tipo Mercadoria</Label>
                      <Input placeholder="Descreva o tipo" value={currentItem.tipoMercadoria} onChange={e => handleItemChange('tipoMercadoria', e.target.value)} />
                    </div>
                    <div>
                      <Label>Volume</Label>
                      <Input type="number" placeholder="0" step="1" value={currentItem.volume} onChange={e => handleItemChange('volume', e.target.value)} />
                    </div>
                    <div className="flex items-end gap-2">
                      <Button className="flex-1" onClick={handleAddItem} disabled={!currentItem.peso}>
                        {editingItemId ? (
                          <>
                            <Check className="h-4 w-4 mr-2" />
                            Atualizar
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4 mr-2" />
                            Adicionar
                          </>
                        )}
                      </Button>
                      {editingItemId && (
                        <Button variant="outline" onClick={handleCancelEdit}>
                          Cancelar
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 border rounded-lg bg-muted/50">
                    <div>
                      <Label>Altura (cm)</Label>
                      <Input type="number" placeholder="0" step="0.1" value={currentItem.altura} onChange={e => handleItemChange('altura', e.target.value)} />
                    </div>
                    <div>
                      <Label>Largura (cm)</Label>
                      <Input type="number" placeholder="0" step="0.1" value={currentItem.largura} onChange={e => handleItemChange('largura', e.target.value)} />
                    </div>
                    <div>
                      <Label>Profundidade (cm)</Label>
                      <Input type="number" placeholder="0" step="0.1" value={currentItem.profundidade} onChange={e => handleItemChange('profundidade', e.target.value)} />
                    </div>
                    <div className="md:col-span-2">
                      <Label>Observações</Label>
                      <Input placeholder="Observações do item" value={currentItem.observacoes} onChange={e => handleItemChange('observacoes', e.target.value)} />
                    </div>
                  </div>

                  {/* Lista de itens adicionados */}
                  {itens.length > 0 && <div className="border rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-muted">
                          <tr>
                            <th className="p-2 text-left text-sm font-medium">NF</th>
                            <th className="p-2 text-left text-sm font-medium">Peso</th>
                            <th className="p-2 text-left text-sm font-medium">Valor</th>
                            <th className="p-2 text-left text-sm font-medium">Tipo</th>
                            <th className="p-2 text-left text-sm font-medium">Natureza</th>
                            <th className="p-2 text-left text-sm font-medium">Vol</th>
                            <th className="p-2 text-left text-sm font-medium">Dimensões</th>
                            <th className="p-2 text-right text-sm font-medium">Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {itens.map(item => <tr key={item.id} className={`border-t ${editingItemId === item.id ? 'bg-primary/10' : ''}`}>
                              <td className="p-2 text-sm">{item.numeroNF || '-'}</td>
                              <td className="p-2 text-sm">{item.peso} kg</td>
                              <td className="p-2 text-sm">R$ {item.valor || '0.00'}</td>
                              <td className="p-2 text-sm">{item.tipoMercadoria || '-'}</td>
                              <td className="p-2 text-sm">{item.natureza || '-'}</td>
                              <td className="p-2 text-sm">{item.volume || '-'}</td>
                              <td className="p-2 text-sm">{item.altura || 0}x{item.largura || 0}x{item.profundidade || 0}</td>
                              <td className="p-2 text-right">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleEditItem(item.id)}
                                  disabled={editingItemId === item.id}
                                >
                                  <Pencil className="h-4 w-4 text-blue-500" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => handleRemoveItem(item.id)}>
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </td>
                            </tr>)}
                        </tbody>
                      </table>
                    </div>}
                </CardContent>
              </Card>

              {/* Botões de ação */}
              <div className="flex justify-end gap-4">
                <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                  Cancelar
                </Button>
                <Button 
                  className="bg-orange-500 hover:bg-orange-600 text-white" 
                  onClick={handleSave}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    'Salvar Coleta'
                  )}
                </Button>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Modais de seleção */}
      <SelectRegisterModal open={remetenteModalOpen} onOpenChange={setRemetenteModalOpen} onSelect={register => {
      setSelectedRemetente(register);
      // Auto-preencher cidade de origem com dados do remetente
      if (register?.cidade && register?.uf && register?.idCidade) {
        setSelectedCidadeOrigem({
          cidade: register.cidade,
          uf: register.uf,
          idCidade: register.idCidade
        });
      }
      setRemetenteModalOpen(false);
    }} title="Selecionar Remetente" />

      <SelectRegisterModal open={destinatarioModalOpen} onOpenChange={setDestinatarioModalOpen} onSelect={register => {
      setSelectedDestinatario(register);
      // Auto-preencher cidade de destino com dados do destinatário
      if (register?.cidade && register?.uf && register?.idCidade) {
        setSelectedCidadeDestino({
          cidade: register.cidade,
          uf: register.uf,
          idCidade: register.idCidade
        });
      }
      setDestinatarioModalOpen(false);
    }} title="Selecionar Destinatário" />

      <SelectCityModal open={cidadeOrigemModalOpen} onOpenChange={setCidadeOrigemModalOpen} onSelect={city => {
      setSelectedCidadeOrigem(city);
      setCidadeOrigemModalOpen(false);
    }} title="Selecionar Cidade de Origem" />

      <SelectCityModal open={cidadeDestinoModalOpen} onOpenChange={setCidadeDestinoModalOpen} onSelect={city => {
      setSelectedCidadeDestino(city);
      setCidadeDestinoModalOpen(false);
    }} title="Selecionar Cidade de Destino" />

      {/* Modal de sucesso com número da coleta */}
      <Dialog open={successColetaId !== null} onOpenChange={(open) => {
        if (!open) {
          setSuccessColetaId(null);
          onOpenChange(false);
        }
      }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center">Coleta Criada!</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
              <Check className="h-8 w-8 text-primary" />
            </div>
            <div className="text-center">
              <p className="text-muted-foreground text-sm">Número da coleta</p>
              <p className="text-3xl font-bold text-foreground">#{successColetaId}</p>
            </div>
            <Button variant="outline" className="w-full" onClick={() => {
              navigator.clipboard.writeText(String(successColetaId));
              toast({ title: 'Número copiado!', description: `Coleta #${successColetaId} copiada.` });
            }}>
              <Copy className="h-4 w-4 mr-2" />
              Copiar número
            </Button>
            <Button className="w-full" onClick={() => {
              setSuccessColetaId(null);
              onOpenChange(false);
            }}>
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>;
};