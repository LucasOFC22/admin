import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DRELancamento } from './DRETableGrid';

interface DRECrossViewProps {
  lancamentos: DRELancamento[];
}

export const DRECrossView: React.FC<DRECrossViewProps> = ({ lancamentos }) => {
  // Obter fornecedores e contas únicos
  const fornecedores = [...new Set(lancamentos.map(l => l.nome))].sort();
  const contas = [...new Set(lancamentos.map(l => l.conta))].sort();

  // Criar matriz de cruzamento
  const matrix: Record<string, Record<string, number>> = {};
  fornecedores.forEach(f => {
    matrix[f] = {};
    contas.forEach(c => {
      matrix[f][c] = 0;
    });
  });

  // Preencher matriz
  lancamentos.forEach(l => {
    if (l.tipo === 'RECEITA') {
      matrix[l.nome][l.conta] += l.valor;
    } else {
      matrix[l.nome][l.conta] -= l.valor;
    }
  });

  // Calcular totais
  const totaisPorConta: Record<string, number> = {};
  contas.forEach(c => {
    totaisPorConta[c] = fornecedores.reduce((sum, f) => sum + matrix[f][c], 0);
  });

  const formatCurrency = (value: number) => {
    if (value === 0) return '-';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      notation: 'compact'
    }).format(value);
  };

  return (
    <Card>
      <CardHeader className="pb-2 sm:pb-6">
        <CardTitle className="text-base sm:text-lg">Fornecedor x Conta</CardTitle>
        <p className="text-xs sm:text-sm text-muted-foreground">
          {fornecedores.length} fornecedores · {contas.length} contas
        </p>
      </CardHeader>
      <CardContent className="p-0 sm:p-6">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="sticky left-0 bg-background min-w-[120px] sm:min-w-[200px] text-xs sm:text-sm">
                  Fornecedor
                </TableHead>
                {contas.slice(0, 5).map(conta => (
                  <TableHead key={conta} className="text-right min-w-[80px] sm:min-w-[100px] text-xs sm:text-sm">
                    <span className="truncate block max-w-[80px] sm:max-w-[100px]" title={conta}>
                      {conta}
                    </span>
                  </TableHead>
                ))}
                <TableHead className="text-right font-bold text-xs sm:text-sm">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fornecedores.slice(0, 20).map(fornecedor => {
                const totalFornecedor = contas.reduce((sum, c) => sum + matrix[fornecedor][c], 0);
                return (
                  <TableRow key={fornecedor}>
                    <TableCell className="sticky left-0 bg-background font-medium text-xs sm:text-sm">
                      <span className="truncate block max-w-[120px] sm:max-w-[200px]" title={fornecedor}>
                        {fornecedor}
                      </span>
                    </TableCell>
                    {contas.slice(0, 5).map(conta => (
                      <TableCell 
                        key={conta} 
                        className={`text-right text-xs sm:text-sm ${matrix[fornecedor][conta] > 0 ? 'text-green-600' : matrix[fornecedor][conta] < 0 ? 'text-red-600' : 'text-muted-foreground'}`}
                      >
                        {formatCurrency(matrix[fornecedor][conta])}
                      </TableCell>
                    ))}
                    <TableCell className={`text-right font-bold text-xs sm:text-sm ${totalFornecedor >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(totalFornecedor)}
                    </TableCell>
                  </TableRow>
                );
              })}
              {/* Linha de totais */}
              <TableRow className="bg-muted/50 font-bold">
                <TableCell className="sticky left-0 bg-muted/50 text-xs sm:text-sm">Total</TableCell>
                {contas.slice(0, 5).map(conta => (
                  <TableCell 
                    key={conta} 
                    className={`text-right text-xs sm:text-sm ${totaisPorConta[conta] >= 0 ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {formatCurrency(totaisPorConta[conta])}
                  </TableCell>
                ))}
                <TableCell className="text-right text-primary text-xs sm:text-sm">
                  {formatCurrency(Object.values(totaisPorConta).reduce((sum, v) => sum + v, 0))}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
        {fornecedores.length > 20 && (
          <p className="text-xs sm:text-sm text-muted-foreground mt-2 text-center p-2">
            Mostrando 20 de {fornecedores.length} fornecedores
          </p>
        )}
      </CardContent>
    </Card>
  );
};
