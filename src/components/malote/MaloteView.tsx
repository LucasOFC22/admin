import { useState, useEffect } from "react";
import { Malote, calcularTotais } from "@/types/malote";
import { Button } from "@/components/ui/button";
import { Printer, ArrowLeft, RectangleVertical, RectangleHorizontal, CheckCircle } from "lucide-react";
import MalotePrint from "./MalotePrint";

interface MaloteViewProps {
  malote: Malote;
  onBack: () => void;
  onPrint: () => void;
}

const MaloteView = ({ malote, onBack, onPrint }: MaloteViewProps) => {
  const totais = calcularTotais(malote);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');

  useEffect(() => {
    const styleId = 'print-orientation-style';
    let styleEl = document.getElementById(styleId) as HTMLStyleElement;
    
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }
    
    styleEl.textContent = `@media print { @page { size: A4 ${orientation}; } }`;
    
    return () => {
      styleEl?.remove();
    };
  }, [orientation]);

  return (
    <div className="animate-fade-in">
      {/* Botões de ação - ocultos na impressão */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6 print:hidden">
        <Button variant="outline" onClick={onBack} className="gap-2 w-full sm:w-auto">
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Button>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="flex items-center border border-border rounded-md overflow-hidden">
            <button
              onClick={() => setOrientation('portrait')}
              className={`flex-1 sm:flex-none px-3 py-2 flex items-center justify-center gap-1 text-sm transition-colors ${
                orientation === 'portrait' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-background text-foreground hover:bg-muted'
              }`}
              title="Retrato"
            >
              <RectangleVertical className="w-4 h-4" />
              <span className="hidden sm:inline">Retrato</span>
            </button>
            <button
              onClick={() => setOrientation('landscape')}
              className={`flex-1 sm:flex-none px-3 py-2 flex items-center justify-center gap-1 text-sm transition-colors ${
                orientation === 'landscape' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-background text-foreground hover:bg-muted'
              }`}
              title="Paisagem"
            >
              <RectangleHorizontal className="w-4 h-4" />
              <span className="hidden sm:inline">Paisagem</span>
            </button>
          </div>
          <Button onClick={onPrint} className="gap-2 w-full sm:w-auto">
            <Printer className="w-4 h-4" />
            Imprimir
          </Button>
        </div>
      </div>

      {/* Status de assinatura - oculto na impressão */}
      {malote.assinado && (
        <div className="mb-4 p-3 sm:p-4 bg-success/10 border border-success/30 rounded-lg flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 print:hidden">
          <CheckCircle className="w-5 h-5 text-success shrink-0" />
          <div>
            <p className="font-medium text-success">Malote Assinado</p>
            <p className="text-sm text-muted-foreground">
              Assinado em {new Date(malote.assinaturaData!).toLocaleString('pt-BR')}
              {malote.assinaturaIp && ` • IP: ${malote.assinaturaIp}`}
            </p>
          </div>
        </div>
      )}

      {/* Visualização na tela - oculto na impressão */}
      <div className="bg-card p-4 sm:p-6 rounded-lg border border-border shadow-sm print:hidden">
        {/* Info do Motorista */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div className="sm:col-span-2 bg-muted/50 p-3 rounded-md">
            <p className="text-xs text-muted-foreground">MOTORISTA {malote.percentual}%</p>
            <p className="text-base sm:text-lg font-bold text-foreground truncate">{malote.motorista}</p>
            {malote.telefoneMotorista && (
              <p className="text-sm text-muted-foreground">{malote.telefoneMotorista}</p>
            )}
          </div>
          <div className="bg-muted/50 p-3 rounded-md">
            <p className="text-xs text-muted-foreground">VALE VIAGEM:</p>
            <p className="text-base sm:text-lg font-bold text-foreground">
              {malote.valeViagem.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          </div>
        </div>

        {/* Tabela de Viagens - Mobile Cards */}
        <div className="mb-4">
          {/* Desktop Table */}
          <div className="hidden sm:block">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-primary text-primary-foreground">
                  <th className="px-3 py-2 text-left font-semibold">DATA</th>
                  <th className="px-3 py-2 text-left font-semibold">ORIGEM</th>
                  <th className="px-3 py-2 text-left font-semibold">DESTINO</th>
                  <th className="px-3 py-2 text-right font-semibold">ADIANT.</th>
                  <th className="px-3 py-2 text-right font-semibold">VALOR FRETE</th>
                  <th className="px-3 py-2 text-right font-semibold">MOTORISTA</th>
                </tr>
              </thead>
              <tbody>
                {malote.viagens.map((viagem, index) => (
                  <tr key={viagem.id} className={index % 2 === 0 ? 'bg-card' : 'bg-muted/30'}>
                    <td className="px-3 py-2 border-b border-border">
                      {new Date(viagem.data).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-3 py-2 border-b border-border">{viagem.origem}</td>
                    <td className="px-3 py-2 border-b border-border">{viagem.destino}</td>
                    <td className="px-3 py-2 text-right border-b border-border">
                      {viagem.adiantamento.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>
                    <td className="px-3 py-2 text-right border-b border-border">
                      {viagem.valorFrete.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>
                    <td className="px-3 py-2 text-right border-b border-border">
                      {viagem.valorMotorista.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-muted font-semibold">
                  <td colSpan={3} className="px-3 py-2 text-right">TOTAL</td>
                  <td className="px-3 py-2 text-right">
                    {totais.totalAdiantamento.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {totais.totalFaturamento.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {totais.totalMotorista.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="sm:hidden space-y-3">
            <h3 className="text-sm font-semibold text-center bg-primary text-primary-foreground py-2 rounded-t-lg">
              VIAGENS ({malote.viagens.length})
            </h3>
            {malote.viagens.map((viagem, index) => (
              <div key={viagem.id} className="bg-muted/30 rounded-lg p-3 space-y-2 border border-border">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Data</span>
                  <span className="text-sm font-medium">{new Date(viagem.data).toLocaleDateString('pt-BR')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Origem</span>
                  <span className="text-sm font-medium truncate max-w-[60%] text-right">{viagem.origem}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Destino</span>
                  <span className="text-sm font-medium truncate max-w-[60%] text-right">{viagem.destino}</span>
                </div>
                <div className="border-t border-border pt-2 mt-2 grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-xs text-muted-foreground">Adiant.</p>
                    <p className="text-xs font-semibold">{viagem.adiantamento.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Frete</p>
                    <p className="text-xs font-semibold">{viagem.valorFrete.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Motorista</p>
                    <p className="text-xs font-semibold">{viagem.valorMotorista.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                  </div>
                </div>
              </div>
            ))}
            {/* Totais Mobile */}
            <div className="bg-muted rounded-lg p-3 grid grid-cols-3 gap-2 text-center font-semibold">
              <div>
                <p className="text-xs text-muted-foreground">Total Adiant.</p>
                <p className="text-xs">{totais.totalAdiantamento.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Frete</p>
                <p className="text-xs">{totais.totalFaturamento.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Mot.</p>
                <p className="text-xs">{totais.totalMotorista.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Despesas */}
        <div>
          <h3 className="text-sm font-semibold mb-2 text-center bg-muted/50 py-2 rounded">DESPESAS</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 text-sm">
            <div className="space-y-1">
              <div className="flex justify-between py-1 border-b border-border">
                <span>Combustível</span>
                <span>{malote.despesas.combustivel.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border">
                <span>Notas</span>
                <span>{malote.despesas.notas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border">
                <span>Extra</span>
                <span>{malote.despesas.extra.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border">
                <span>Motorista</span>
                <span>{totais.totalMotorista.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
              </div>
              {(() => {
                const soma = (malote.despesas.combustivel || 0) + (malote.despesas.notas || 0) + (malote.despesas.extra || 0) + totais.totalMotorista;
                const isNegativo = soma > malote.valeViagem;
                const valeExibir = isNegativo ? -malote.valeViagem : malote.valeViagem;
                const saldo = soma - malote.valeViagem;
                return (
                  <>
                    <div className="flex justify-between py-1 font-semibold bg-muted/30 px-1 rounded">
                      <span>Soma</span>
                      <span>{soma.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                    </div>
                    <div className={`flex justify-between py-1 font-semibold px-1 rounded ${isNegativo ? 'bg-destructive/10 text-destructive' : 'bg-muted/30'}`}>
                      <span>Vale</span>
                      <span>{valeExibir.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                    </div>
                    <div className={`flex justify-between py-1 font-bold px-1 rounded ${saldo >= 0 ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                      <span>Saldo</span>
                      <span>{saldo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                    </div>
                  </>
                );
              })()}
            </div>
            <div className="space-y-1">
              <div className="flex justify-between py-1 border-b border-border">
                <span>Quant. Litros</span>
                <span>{malote.despesas.quantLitros}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border">
                <span>Quant. ARLA</span>
                <span>{malote.despesas.quantArla}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border">
                <span>Pedágio</span>
                <span>{malote.despesas.pedagio.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Assinatura digital */}
        {malote.assinado && malote.assinaturaImagem && (
          <div className="mt-6 pt-4 border-t border-border text-center">
            <p className="text-sm text-muted-foreground mb-2">Assinatura Digital</p>
            <img 
              src={malote.assinaturaImagem} 
              alt="Assinatura do motorista" 
              className="h-16 sm:h-20 mx-auto border border-border rounded p-2 bg-white"
            />
          </div>
        )}
      </div>

      {/* Módulo de impressão */}
      <div className="hidden print:block">
        <MalotePrint malote={malote} />
      </div>
    </div>
  );
};

export default MaloteView;
