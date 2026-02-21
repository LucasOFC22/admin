import { Printer, CircleCheckBig, X, MoreHorizontal } from 'lucide-react';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import { formatTimestamp } from '@/utils/dateFormatters';
import { formatCurrency } from '@/lib/formatters';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Manifesto } from '@/types/manifesto';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { downloadFromApi } from '@/lib/download-utils';
import { motion } from 'framer-motion';
import { useState } from 'react';

interface ManifestoTableProps {
  manifestos: Manifesto[];
  onPrint?: (manifesto: Manifesto) => void;
  onEncerrar?: (manifesto: Manifesto) => void;
  onCancelar?: (manifesto: Manifesto) => void;
}

export const ManifestoTable = ({ 
  manifestos, 
  onPrint, 
  onEncerrar, 
  onCancelar 
}: ManifestoTableProps) => {
  const [encerrarDialog, setEncerrarDialog] = useState<Manifesto | null>(null);
  const [cancelarDialog, setCancelarDialog] = useState<Manifesto | null>(null);
  const { canAccess } = usePermissionGuard();
  const canDownloadPdf = canAccess('admin.manifestos.pdf');

  const handleDownloadMdfe = (manifesto: Manifesto) => {
    downloadFromApi(
      `https://kong.fptranscargas.com.br/functions/v1/imprimir-mdfe/${manifesto.chaveMdfe}`,
      `MDF-e_${manifesto.chaveMdfe}.pdf`
    );
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('pt-BR', { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    }).format(num);
  };

  // formatCurrency imported from @/lib/formatters

  const formatDate = (dateString: string) => formatTimestamp(dateString);

  return (
    <>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="rounded-lg border border-border/60 overflow-hidden"
      >
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="font-medium">Manifesto</TableHead>
                <TableHead className="font-medium">Emitente</TableHead>
                <TableHead className="font-medium">Rota</TableHead>
                <TableHead className="font-medium">Veículo</TableHead>
                <TableHead className="font-medium">Condutor</TableHead>
                <TableHead className="font-medium">Peso</TableHead>
                <TableHead className="font-medium">Valor</TableHead>
                <TableHead className="font-medium">Emissão</TableHead>
                <TableHead className="font-medium">Status</TableHead>
                <TableHead className="font-medium text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {manifestos.map((manifesto, index) => (
                <motion.tr
                  key={manifesto.nroManifesto}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.02 }}
                  className="group hover:bg-muted/30 transition-colors"
                >
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">#{manifesto.nroManifesto}</span>
                      <span className="text-xs text-muted-foreground">MDFe {manifesto.nroMdfe}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-[150px]">
                      <p className="truncate text-sm" title={manifesto.emitente}>
                        {manifesto.emitente}
                      </p>
                      <p className="text-xs text-muted-foreground">{manifesto.tipoAquisicao}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{manifesto.ufOrigem} → {manifesto.ufDestino}</span>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-sm">{manifesto.veictracaoPlaca}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{manifesto.condutor}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{formatNumber(manifesto.tPeso)} kg</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-medium">{formatCurrency(manifesto.tVlrMerc)}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm">{manifesto.emissao}</span>
                      <span className="text-xs text-muted-foreground">{formatDate(manifesto.dataStatus)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {manifesto.menos24h === 'S' ? (
                      <Badge variant="destructive" className="text-xs">
                        &lt; 24h
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        Normal
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        {canDownloadPdf && (
                          <DropdownMenuItem onClick={() => handleDownloadMdfe(manifesto)}>
                            <Printer className="h-4 w-4 mr-2" />
                            Download MDFe
                          </DropdownMenuItem>
                        )}
                        {canDownloadPdf && <DropdownMenuSeparator />}
                        <DropdownMenuItem onClick={() => setEncerrarDialog(manifesto)}>
                          <CircleCheckBig className="h-4 w-4 mr-2" />
                          Encerrar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => setCancelarDialog(manifesto)}
                          className="text-destructive focus:text-destructive"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Cancelar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        </div>
      </motion.div>

      {/* Dialog Encerrar */}
      <AlertDialog open={!!encerrarDialog} onOpenChange={(open) => !open && setEncerrarDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Encerramento</AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-2">
                <p>Tem certeza que deseja encerrar o manifesto #{encerrarDialog?.nroManifesto}?</p>
                <p className="text-sm font-medium text-destructive">Esta ação é irreversível e pode ser passível de autuação.</p>
                {encerrarDialog?.menos24h === 'S' && (
                  <p className="text-sm font-medium text-destructive">Se fizer o encerramento perderá o cancelamento (menos de 24h).</p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Não</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if (encerrarDialog) onEncerrar?.(encerrarDialog);
                setEncerrarDialog(null);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Sim, Encerrar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog Cancelar */}
      <AlertDialog open={!!cancelarDialog} onOpenChange={(open) => !open && setCancelarDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Cancelamento</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja realmente cancelar o manifesto #{cancelarDialog?.nroManifesto}?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Não cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if (cancelarDialog) onCancelar?.(cancelarDialog);
                setCancelarDialog(null);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Sim, cancelar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
