import { useState, useEffect } from "react";
import { Malote, Viagem, createEmptyMalote, createEmptyViagem, calcularTotais, ValeViagemItem } from "@/types/malote";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Save, X, Search, Truck, MapPin } from "lucide-react";
import { toast } from '@/lib/toast';
import { SelectRegisterModal } from "@/components/modals/SelectRegisterModal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTiposCaminhao } from "@/hooks/useTiposCaminhao";
import { Badge } from "@/components/ui/badge";
import { ValeViagemModal } from "./ValeViagemModal";
import { SelectCityModal } from "@/components/modals/SelectCityModal";

interface MaloteFormProps {
  initialData?: Malote;
  onSave: (malote: Omit<Malote, 'id' | 'createdAt' | 'updatedAt' | 'assinado'>) => void;
  onCancel: () => void;
  isLoading?: boolean;
}
const MaloteForm = ({
  initialData,
  onSave,
  onCancel,
  isLoading
}: MaloteFormProps) => {
  const {
    tiposCaminhao,
    loading: loadingTipos,
    fetchTiposCaminhao
  } = useTiposCaminhao();
  const [formData, setFormData] = useState<Omit<Malote, 'id' | 'createdAt' | 'updatedAt' | 'assinado'>>(initialData ? {
    motorista: initialData.motorista,
    motoristaId: initialData.motoristaId,
    telefoneMotorista: initialData.telefoneMotorista || '',
    percentual: initialData.percentual,
    valeViagem: initialData.valeViagem,
    valeViagemItens: initialData.valeViagemItens || [],
    tipoCaminhaoId: initialData.tipoCaminhaoId,
    tipoCaminhaoNome: initialData.tipoCaminhaoNome,
    viagens: initialData.viagens,
    despesas: initialData.despesas
  } : createEmptyMalote());
  const [isMotoristaModalOpen, setIsMotoristaModalOpen] = useState(false);
  const [isValeViagemModalOpen, setIsValeViagemModalOpen] = useState(false);
  const [showViagemErrors, setShowViagemErrors] = useState(false);
  const [showRequiredErrors, setShowRequiredErrors] = useState(false);
  const [cityModalOpen, setCityModalOpen] = useState<{ viagemId: string; field: 'origem' | 'destino' } | null>(null);

  // Busca apenas tipos ativos
  useEffect(() => {
    fetchTiposCaminhao(true);
  }, [fetchTiposCaminhao]);
  const selectedTipo = tiposCaminhao.find(t => t.id === formData.tipoCaminhaoId);
  const handleTipoCaminhaoChange = (tipoId: string) => {
    const tipo = tiposCaminhao.find(t => t.id === tipoId);
    if (tipo) {
      setFormData(prev => ({
        ...prev,
        tipoCaminhaoId: tipo.id,
        tipoCaminhaoNome: tipo.nome,
        percentual: tipo.percentual
      }));
      // Recalcular valores do motorista nas viagens
      setFormData(prev => ({
        ...prev,
        viagens: prev.viagens.map(v => ({
          ...v,
          valorMotorista: v.valorFrete * tipo.percentual / 100
        }))
      }));
    }
  };
  const handleAddViagem = () => {
    const newViagem: Viagem = {
      ...createEmptyViagem(),
      id: crypto.randomUUID()
    };
    setFormData(prev => ({
      ...prev,
      viagens: [...prev.viagens, newViagem]
    }));
  };
  const handleRemoveViagem = (id: string) => {
    setFormData(prev => ({
      ...prev,
      viagens: prev.viagens.filter(v => v.id !== id)
    }));
  };
  const handleViagemChange = (id: string, field: keyof Viagem, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      viagens: prev.viagens.map(v => {
        if (v.id !== id) return v;
        const updatedViagem = {
          ...v,
          [field]: value
        };
        if (field === 'valorFrete') {
          updatedViagem.valorMotorista = Number(value) * prev.percentual / 100;
        }
        return updatedViagem;
      })
    }));
  };
  const handleDespesaChange = (field: keyof typeof formData.despesas, value: number) => {
    setFormData(prev => ({
      ...prev,
      despesas: {
        ...prev.despesas,
        [field]: value
      }
    }));
  };
  const handleSelectMotorista = (cadastro: {
    idCliente: number;
    nome: string;
  }) => {
    setFormData(prev => ({
      ...prev,
      motorista: cadastro.nome,
      motoristaId: cadastro.idCliente
    }));
  };
  const totais = calcularTotais(formData);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowRequiredErrors(true);
    if (!formData.motorista.trim()) {
      toast.error("Selecione o motorista");
      return;
    }
    if (!formData.telefoneMotorista?.trim()) {
      toast.error("Informe o telefone do motorista");
      return;
    }
    if (!formData.tipoCaminhaoId) {
      toast.error("Selecione o tipo de caminhão");
      return;
    }
    if (formData.viagens.length === 0) {
      toast.error("Adicione pelo menos 1 viagem");
      return;
    }

    // Validar origem e destino de todas as viagens
    const temViagemIncompleta = formData.viagens.some(v => !v.origem?.trim() || !v.destino?.trim());
    if (temViagemIncompleta) {
      setShowViagemErrors(true);
      toast.error("Preencha origem e destino de todas as viagens");
      return;
    }
    setShowViagemErrors(false);
    // Atualiza o valor do motorista nas despesas com o total calculado
    const dataToSave = {
      ...formData,
      despesas: {
        ...formData.despesas,
        motorista: totais.totalMotorista
      }
    };
    onSave(dataToSave);
  };
  return <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
      {/* Cabeçalho do Malote */}
      <div className="bg-gradient-to-br from-card to-muted/30 border border-border rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Truck className="w-4 h-4 text-primary" />
          </div>
          Informações do Motorista
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
          <div className="lg:col-span-2">
            <Label htmlFor="motorista" className="text-sm font-medium text-foreground">
              Motorista <span className="text-destructive">*</span>
            </Label>
            <div className="flex gap-2 mt-2">
              <Input id="motorista" value={formData.motorista} readOnly placeholder="Selecione o motorista" className={`flex-1 cursor-pointer bg-background ${showRequiredErrors && !formData.motorista ? 'border-destructive/50' : ''}`} onClick={() => setIsMotoristaModalOpen(true)} />
              <Button type="button" variant="outline" size="icon" onClick={() => setIsMotoristaModalOpen(true)} className="shrink-0">
                <Search className="w-4 h-4" />
              </Button>
            </div>
            {formData.motoristaId && <p className="text-xs text-muted-foreground mt-1">ID: {formData.motoristaId}</p>}
            {showRequiredErrors && !formData.motorista && <p className="text-xs text-destructive mt-1">Campo obrigatório</p>}
          </div>
          <div>
            <Label htmlFor="telefone" className="text-sm font-medium text-foreground">
              Telefone <span className="text-destructive">*</span>
            </Label>
            <Input id="telefone" value={formData.telefoneMotorista || ''} onChange={e => setFormData(prev => ({
            ...prev,
            telefoneMotorista: e.target.value
          }))} placeholder="(00) 00000-0000" className={`mt-2 bg-background ${showRequiredErrors && !formData.telefoneMotorista ? 'border-destructive/50' : ''}`} />
            {showRequiredErrors && !formData.telefoneMotorista && <p className="text-xs text-destructive mt-1">Campo obrigatório</p>}
          </div>
          <div>
            <Label className="text-sm font-medium text-foreground">
              Tipo Caminhão <span className="text-destructive">*</span>
            </Label>
            <Select value={formData.tipoCaminhaoId || ''} onValueChange={handleTipoCaminhaoChange} disabled={loadingTipos}>
              <SelectTrigger className={`mt-2 bg-background ${showRequiredErrors && !formData.tipoCaminhaoId ? 'border-destructive/50' : ''}`}>
                <SelectValue placeholder="Selecione">
                  {selectedTipo ? <span className="flex items-center gap-2">
                      <Truck className="w-3.5 h-3.5" />
                      {selectedTipo.nome} ({selectedTipo.percentual}%)
                    </span> : "Selecione"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {tiposCaminhao.map(tipo => <SelectItem key={tipo.id} value={tipo.id}>
                    <div className="flex items-center justify-between gap-4 w-full">
                      <span>{tipo.nome}</span>
                      <Badge variant="secondary">{tipo.percentual}%</Badge>
                    </div>
                  </SelectItem>)}
              </SelectContent>
            </Select>
            {showRequiredErrors && !formData.tipoCaminhaoId && <p className="text-xs text-destructive mt-1">Campo obrigatório</p>}
          </div>
          <div>
            <Label className="text-sm font-medium text-foreground">Vale Viagem (R$)</Label>
            <div
              onClick={() => setIsValeViagemModalOpen(true)}
              className="mt-2 flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm cursor-pointer hover:bg-muted/50 transition-colors"
            >
              <span className={formData.valeViagem > 0 ? 'text-foreground font-medium' : 'text-muted-foreground'}>
                {formData.valeViagem > 0
                  ? formData.valeViagem.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                  : 'Clique para adicionar itens'}
              </span>
              {formData.valeViagemItens.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {formData.valeViagemItens.length} {formData.valeViagemItens.length === 1 ? 'item' : 'itens'}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de seleção de motorista */}
      <SelectRegisterModal open={isMotoristaModalOpen} onOpenChange={setIsMotoristaModalOpen} onSelect={handleSelectMotorista} title="Selecionar Motorista" />

      {/* Modal de Vale Viagem */}
      <ValeViagemModal
        open={isValeViagemModalOpen}
        onOpenChange={setIsValeViagemModalOpen}
        itens={formData.valeViagemItens}
        onSave={(itens) => {
          const total = itens.reduce((acc, item) => acc + (item.valor || 0), 0);
          setFormData(prev => ({
            ...prev,
            valeViagemItens: itens,
            valeViagem: total
          }));
        }}
      />

      {/* Modal de seleção de cidade */}
      <SelectCityModal
        open={!!cityModalOpen}
        onOpenChange={(open) => !open && setCityModalOpen(null)}
        onSelect={(cidade) => {
          if (cityModalOpen) {
            handleViagemChange(cityModalOpen.viagemId, cityModalOpen.field, cidade.cidade);
            if (cidade.cidade.trim()) setShowViagemErrors(false);
            setCityModalOpen(null);
          }
        }}
        title={cityModalOpen?.field === 'origem' ? 'Selecionar Origem' : 'Selecionar Destino'}
      />

      {/* Tabela de Viagens */}
      <div className="bg-gradient-to-br from-card to-muted/30 border border-border rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-foreground">Viagens</h2>
            <Badge variant={formData.viagens.length > 0 ? "default" : "destructive"} className="text-xs">
              {formData.viagens.length} {formData.viagens.length === 1 ? 'viagem' : 'viagens'}
            </Badge>
          </div>
          <Button type="button" onClick={handleAddViagem} size="sm" className="gap-2">
            <Plus className="w-4 h-4" />
            Adicionar
          </Button>
        </div>

        {formData.viagens.length === 0 ? <div className="border-2 border-dashed border-destructive/30 rounded-lg p-8 text-center bg-destructive/5">
            <p className="text-destructive font-medium">Adicione pelo menos 1 viagem *</p>
            <p className="text-sm text-muted-foreground mt-1">Clique em "Adicionar" para começar</p>
          </div> : <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full table-fixed">
              <colgroup>
                <col className="w-40" />
                <col className="w-32" />
                <col className="w-32" />
                <col className="w-28" />
                <col className="w-28" />
                <col className="w-28" />
                <col className="w-14" />
              </colgroup>
              <thead>
                <tr className="bg-muted/70">
                  <th className="px-3 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wide">Data</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wide">Origem</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wide">Destino</th>
                  <th className="px-3 py-3 text-right text-xs font-semibold text-foreground uppercase tracking-wide">Adiant.</th>
                  <th className="px-3 py-3 text-right text-xs font-semibold text-foreground uppercase tracking-wide">Frete</th>
                  <th className="px-3 py-3 text-right text-xs font-semibold text-foreground uppercase tracking-wide">Motorista</th>
                  <th className="px-3 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {formData.viagens.map((viagem, index) => <tr key={viagem.id} className={index % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                    <td className="px-3 py-2">
                      <Input type="date" value={viagem.data} onChange={e => handleViagemChange(viagem.id, 'data', e.target.value)} className="w-full h-9 text-sm" />
                    </td>
                    <td className="px-3 py-2">
                      <div
                        onClick={() => setCityModalOpen({ viagemId: viagem.id, field: 'origem' })}
                        className={`flex items-center gap-2 w-full h-9 px-3 rounded-md border cursor-pointer hover:bg-muted/50 transition-colors text-sm ${
                          showViagemErrors && !viagem.origem?.trim() 
                            ? 'border-destructive' 
                            : 'border-input bg-background'
                        }`}
                      >
                        <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <span className={viagem.origem ? 'text-foreground truncate' : 'text-muted-foreground'}>
                          {viagem.origem || 'Selecionar'}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div
                        onClick={() => setCityModalOpen({ viagemId: viagem.id, field: 'destino' })}
                        className={`flex items-center gap-2 w-full h-9 px-3 rounded-md border cursor-pointer hover:bg-muted/50 transition-colors text-sm ${
                          showViagemErrors && !viagem.destino?.trim() 
                            ? 'border-destructive' 
                            : 'border-input bg-background'
                        }`}
                      >
                        <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <span className={viagem.destino ? 'text-foreground truncate' : 'text-muted-foreground'}>
                          {viagem.destino || 'Selecionar'}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <Input type="number" step="0.01" value={viagem.adiantamento} onChange={e => handleViagemChange(viagem.id, 'adiantamento', Number(e.target.value))} className="w-full h-9 text-sm text-right" />
                    </td>
                    <td className="px-3 py-2">
                      <Input type="number" step="0.01" value={viagem.valorFrete} onChange={e => handleViagemChange(viagem.id, 'valorFrete', Number(e.target.value))} className="w-full h-9 text-sm text-right" />
                    </td>
                    <td className="px-3 py-2">
                      <Input type="number" step="0.01" value={viagem.valorMotorista} readOnly disabled className="w-full h-9 text-sm text-right bg-muted/50 cursor-not-allowed" />
                    </td>
                    <td className="px-1 py-2 text-center">
                      <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveViagem(viagem.id)} className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>)}
              </tbody>
              <tfoot>
                <tr className="bg-primary/5 font-semibold">
                  <td colSpan={3} className="px-3 py-3 text-right text-sm text-foreground">TOTAIS:</td>
                  <td className="px-3 py-3 text-right text-sm text-foreground tabular-nums">
                    {totais.totalAdiantamento.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                })}
                  </td>
                  <td className="px-3 py-3 text-right text-sm text-foreground tabular-nums">
                    {totais.totalFaturamento.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                })}
                  </td>
                  <td className="px-3 py-3 text-right text-sm text-primary font-bold tabular-nums">
                    {totais.totalMotorista.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                })}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>}
      </div>

      {/* Despesas */}
      <div className="bg-gradient-to-br from-card to-muted/30 border border-border rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-foreground mb-6">Despesas</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm text-muted-foreground">Combustível (R$)</Label>
            <Input type="number" step="0.01" value={formData.despesas.combustivel || ''} onChange={e => handleDespesaChange('combustivel', Number(e.target.value))} className="mt-2 bg-background" />
          </div>
          <div>
            <Label className="text-sm text-muted-foreground">Quant. Litros</Label>
            <Input type="number" step="0.01" value={formData.despesas.quantLitros || ''} onChange={e => handleDespesaChange('quantLitros', Number(e.target.value))} className="mt-2 bg-background" />
          </div>
          <div>
            <Label className="text-sm text-muted-foreground">Notas (R$)</Label>
            <Input type="number" step="0.01" value={formData.despesas.notas || ''} onChange={e => handleDespesaChange('notas', Number(e.target.value))} className="mt-2 bg-background" />
          </div>
          <div>
            <Label className="text-sm text-muted-foreground">Quant. ARLA</Label>
            <Input type="number" step="0.01" value={formData.despesas.quantArla || ''} onChange={e => handleDespesaChange('quantArla', Number(e.target.value))} className="mt-2 bg-background" />
          </div>
          <div>
            <Label className="text-sm text-muted-foreground">Extra (R$)</Label>
            <Input type="number" step="0.01" value={formData.despesas.extra || ''} onChange={e => handleDespesaChange('extra', Number(e.target.value))} className="mt-2 bg-background" />
          </div>
          <div>
            <Label className="text-sm text-muted-foreground">Pedágio (R$)</Label>
            <Input type="number" step="0.01" value={formData.despesas.pedagio || ''} onChange={e => handleDespesaChange('pedagio', Number(e.target.value))} className="mt-2 bg-background" />
          </div>
          <div className="col-span-2 md:col-span-1">
            <Label className="text-sm text-muted-foreground">Motorista (R$)</Label>
            <Input type="number" step="0.01" value={totais.totalMotorista} readOnly disabled className="mt-2 bg-muted/50 cursor-not-allowed" />
          </div>
        </div>
        
        {/* Soma e Vale */}
        <div className="mt-6 pt-4 border-t border-border space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Soma</span>
            <span className="text-base font-semibold text-foreground tabular-nums">
              {((formData.despesas.combustivel || 0) + (formData.despesas.notas || 0) + (formData.despesas.extra || 0) + totais.totalMotorista).toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL'
            })}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Vale</span>
            {(() => {
              const soma = (formData.despesas.combustivel || 0) + (formData.despesas.notas || 0) + (formData.despesas.extra || 0) + totais.totalMotorista;
              const isNegativo = soma > formData.valeViagem;
              const valorExibir = isNegativo ? -formData.valeViagem : formData.valeViagem;
              return (
                <span className={`text-base font-semibold tabular-nums ${isNegativo ? 'text-destructive' : 'text-foreground'}`}>
                  {valorExibir.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  })}
                </span>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Resultado */}
      {(() => {
      const soma = (formData.despesas.combustivel || 0) + (formData.despesas.notas || 0) + (formData.despesas.extra || 0) + totais.totalMotorista;
      const resultado = soma - formData.valeViagem;
      const isPositivo = resultado >= 0;
      return <div className={`rounded-xl p-6 shadow-sm border ${isPositivo ? 'bg-green-500/10 border-green-500/30' : 'bg-destructive/10 border-destructive/30'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${isPositivo ? 'text-green-600' : 'text-destructive'}`}>
                  {isPositivo ? 'Motorista tem a receber' : 'Motorista tem que pagar'}
                </p>
              </div>
              <div className={`text-3xl font-bold tabular-nums ${isPositivo ? 'text-green-600' : 'text-destructive'}`}>
                {resultado.toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL'
            })}
              </div>
            </div>
          </div>;
    })()}

      {/* Botões */}
      <div className="flex items-center justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel} className="gap-2" disabled={isLoading}>
          <X className="w-4 h-4" />
          Cancelar
        </Button>
        <Button type="submit" className="gap-2" disabled={isLoading}>
          <Save className="w-4 h-4" />
          {isLoading ? 'Salvando...' : 'Salvar Malote'}
        </Button>
      </div>
    </form>;
};
export default MaloteForm;