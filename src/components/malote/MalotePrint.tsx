import { Malote, calcularTotais } from "@/types/malote";

interface MalotePrintProps {
  malote: Malote;
}

const MalotePrint = ({ malote }: MalotePrintProps) => {
  const totais = calcularTotais(malote);

  return (
    <div className="p-6 bg-white text-black min-h-full" id="malote-print">
      {/* Cabeçalho compacto */}
      <div className="flex items-center justify-between border-b border-gray-300 pb-3 mb-4">
        <div className="flex items-center gap-3">
          <img 
            src="https://fptranscargas.com.br/imags/logo.png" 
            alt="FP Transcargas" 
            className="h-10 w-auto print:h-10" 
          />
          <div className="text-[10px] leading-tight text-gray-600">
            <p className="font-semibold text-xs text-black">FP TRANSCARGAS</p>
            <p>CNPJ: 05.805.337/0001-90</p>
            <p>Rua Comendador Gomes, 265 - Tomba | Feira de Santana - BA</p>
          </div>
        </div>
        <div className="text-right">
          <div className="border border-gray-400 px-4 py-2 rounded">
            <p className="text-[9px] text-gray-500 uppercase">Malote</p>
            <p className="text-xl font-bold">{malote.numero || '—'}</p>
          </div>
        </div>
      </div>

      {/* Motorista e Vale em linha */}
      <div className="flex items-center justify-between bg-gray-50 px-4 py-2 rounded mb-4 border border-gray-200">
        <div className="flex items-center gap-6">
          <div>
            <span className="text-[9px] text-gray-500 uppercase">Motorista ({malote.percentual}%)</span>
            <p className="font-semibold text-sm">{malote.motorista}</p>
          </div>
          {malote.telefoneMotorista && (
            <div>
              <span className="text-[9px] text-gray-500 uppercase">Telefone</span>
              <p className="text-sm">{malote.telefoneMotorista}</p>
            </div>
          )}
        </div>
        <div className="text-right">
          <span className="text-[9px] text-gray-500 uppercase">Vale Viagem</span>
          <p className="font-bold text-sm">
            {malote.valeViagem.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
        </div>
      </div>

      {/* Tabela de Viagens */}
      <table className="w-full border-collapse mb-4 text-[10px]">
        <thead>
          <tr className="bg-gray-800 text-white">
            <th className="px-2 py-1.5 text-left font-medium">Data</th>
            <th className="px-2 py-1.5 text-left font-medium">Origem</th>
            <th className="px-2 py-1.5 text-left font-medium">Destino</th>
            <th className="px-2 py-1.5 text-right font-medium">Adiantamento</th>
            <th className="px-2 py-1.5 text-right font-medium">Frete</th>
            <th className="px-2 py-1.5 text-right font-medium">Motorista</th>
          </tr>
        </thead>
        <tbody>
          {malote.viagens.map((viagem, index) => (
            <tr key={viagem.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              <td className="px-2 py-1.5 border-b border-gray-200">
                {new Date(viagem.data).toLocaleDateString('pt-BR')}
              </td>
              <td className="px-2 py-1.5 border-b border-gray-200">{viagem.origem}</td>
              <td className="px-2 py-1.5 border-b border-gray-200">{viagem.destino}</td>
              <td className="px-2 py-1.5 border-b border-gray-200 text-right">
                {viagem.adiantamento.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </td>
              <td className="px-2 py-1.5 border-b border-gray-200 text-right">
                {viagem.valorFrete.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </td>
              <td className="px-2 py-1.5 border-b border-gray-200 text-right">
                {viagem.valorMotorista.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-gray-200 font-semibold">
            <td colSpan={3} className="px-2 py-1.5 text-right">Totais</td>
            <td className="px-2 py-1.5 text-right">
              {totais.totalAdiantamento.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </td>
            <td className="px-2 py-1.5 text-right">
              {totais.totalFaturamento.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </td>
            <td className="px-2 py-1.5 text-right">
              {totais.totalMotorista.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </td>
          </tr>
        </tfoot>
      </table>

      {/* Despesas e Resumo lado a lado */}
      <div className="flex gap-4 mb-6">
        {/* Despesas */}
        <div className="flex-1 border border-gray-300 rounded overflow-hidden">
          <div className="bg-gray-800 text-white px-3 py-1.5 text-[10px] font-medium">Despesas</div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 p-3 text-[10px]">
            <div className="flex justify-between">
              <span className="text-gray-600">Combustível:</span>
              <span>{malote.despesas.combustivel.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Qtd. Litros:</span>
              <span>{malote.despesas.quantLitros}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Notas:</span>
              <span>{malote.despesas.notas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Qtd. ARLA:</span>
              <span>{malote.despesas.quantArla}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Extra:</span>
              <span>{malote.despesas.extra.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Pedágio:</span>
              <span>{malote.despesas.pedagio.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Motorista:</span>
              <span>{totais.totalMotorista.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
            </div>
          </div>
        </div>

        {/* Resumo Financeiro */}
        <div className="w-48 border border-gray-300 rounded overflow-hidden">
          <div className="bg-gray-800 text-white px-3 py-1.5 text-[10px] font-medium">Resumo</div>
          {(() => {
            const soma = (malote.despesas.combustivel || 0) + (malote.despesas.notas || 0) + (malote.despesas.extra || 0) + totais.totalMotorista;
            const isNegativo = soma > malote.valeViagem;
            const valeExibir = isNegativo ? -malote.valeViagem : malote.valeViagem;
            return (
              <div className="p-3 space-y-1.5 text-[10px]">
                <div className="flex justify-between border-b border-gray-200 pb-1">
                  <span className="text-gray-600">Soma:</span>
                  <span className="font-medium">{soma.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                </div>
                <div className={`flex justify-between border-b border-gray-200 pb-1 ${isNegativo ? 'text-red-700' : ''}`}>
                  <span className="text-gray-600">Vale:</span>
                  <span className="font-medium">{valeExibir.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                </div>
                <div className={`flex justify-between pt-1 font-bold text-xs ${(malote.valeViagem - soma) >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                  <span>Saldo:</span>
                  <span>{(malote.valeViagem - soma).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Rodapé com Assinatura */}
      <div className="border-t border-gray-300 pt-4">
        <div className="flex items-end justify-between">
          <div className="text-[9px] text-gray-400">
            <p>Documento gerado em {new Date().toLocaleString('pt-BR')}</p>
          </div>
          
          {malote.assinado && malote.assinaturaImagem ? (
            <div className="text-center">
              <img 
                src={malote.assinaturaImagem} 
                alt="Assinatura" 
                className="h-12 mx-auto mb-1"
              />
              <div className="w-56 border-t border-gray-400 pt-1">
                <p className="text-[10px] font-medium">{malote.motorista}</p>
                <p className="text-[9px] text-gray-500">
                  Assinado em {new Date(malote.assinaturaData!).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <div className="w-56 border-t border-gray-400 pt-1 mt-10">
                <p className="text-[10px] text-gray-600">Assinatura do Motorista</p>
              </div>
            </div>
          )}

          <div className="text-[9px] text-gray-400 text-right">
            <p>FP Transcargas</p>
            <p>(75) 3199-2515</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MalotePrint;
