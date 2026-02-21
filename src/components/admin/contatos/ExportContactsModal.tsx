import React, { useState } from 'react';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { toast } from '@/lib/toast';
import { requireAuthenticatedClient } from '@/config/supabaseAuth';
import { formatDateTime, formatCustomDate } from '@/utils/dateFormatters';

// XLSX carregado on-demand para reduzir bundle inicial
const getXLSX = async () => {
  const xlsx = await import('xlsx');
  return xlsx;
};

interface ExportContactsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ContactExportData {
  nome: string;
  telefone: string;
  email: string | null;
  informacoes_adicionais: Array<{ key: string; value: string }> | null;
  criadoem: string;
}

const ExportContactsModal: React.FC<ExportContactsModalProps> = ({
  isOpen,
  onClose
}) => {
  const [exportFormat, setExportFormat] = useState<'csv' | 'xlsx'>('csv');
  const [isLoading, setIsLoading] = useState(false);

  const formatAdditionalInfo = (info: Array<{ key: string; value: string }> | null): string => {
    if (!info || info.length === 0) return '';
    return info.map(item => `${item.key}: ${item.value}`).join('; ');
  };

  const formatDate = (date: string): string => formatDateTime(date);

  const handleExport = async () => {
    setIsLoading(true);
    try {
      const supabase = requireAuthenticatedClient();
      const { data, error } = await supabase
        .from('contatos_whatsapp')
        .select('nome, telefone, email, informacoes_adicionais, criadoem')
        .order('nome', { ascending: true });

      if (error) throw error;

      if (!data || data.length === 0) {
        toast.error('Não há contatos para exportar');
        return;
      }

      const exportData = (data as ContactExportData[]).map(contact => ({
        'Nome': contact.nome,
        'Telefone': contact.telefone,
        'Email': contact.email || '',
        'Informações Adicionais': formatAdditionalInfo(contact.informacoes_adicionais),
        'Data de Criação': formatDate(contact.criadoem)
      }));

      const filename = `contatos_whatsapp_${formatCustomDate(new Date(), 'yyyyMMdd_HHmmss')}`;

      if (exportFormat === 'xlsx') {
        // Carrega XLSX on-demand
        const XLSX = await getXLSX();
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Contatos');
        
        // Ajustar largura das colunas
        const colWidths = [
          { wch: 30 }, // Nome
          { wch: 20 }, // Telefone
          { wch: 30 }, // Email
          { wch: 50 }, // Informações Adicionais
          { wch: 20 }, // Data de Criação
        ];
        worksheet['!cols'] = colWidths;

        XLSX.writeFile(workbook, `${filename}.xlsx`);
      } else {
        // CSV export
        const headers = ['Nome', 'Telefone', 'Email', 'Informações Adicionais', 'Data de Criação'];
        const csvRows = [
          headers.join(';'),
          ...exportData.map(row => 
            Object.values(row).map(value => {
              const stringValue = String(value);
              if (stringValue.includes(';') || stringValue.includes('"') || stringValue.includes('\n')) {
                return `"${stringValue.replace(/"/g, '""')}"`;
              }
              return stringValue;
            }).join(';')
          )
        ];
        
        const csvContent = csvRows.join('\n');
        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${filename}.csv`;
        link.click();
        URL.revokeObjectURL(link.href);
      }

      toast.success(`${data.length} contatos exportados com sucesso!`);
      onClose();
    } catch (error) {
      console.error('Erro ao exportar contatos:', error);
      toast.error('Erro ao exportar contatos');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Exportar Contatos
          </DialogTitle>
          <DialogDescription>
            Escolha o formato para exportar seus contatos
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <RadioGroup
            value={exportFormat}
            onValueChange={(value) => setExportFormat(value as 'csv' | 'xlsx')}
            className="grid grid-cols-2 gap-4"
          >
            <div>
              <RadioGroupItem
                value="csv"
                id="csv"
                className="peer sr-only"
              />
              <Label
                htmlFor="csv"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
              >
                <FileText className="mb-3 h-6 w-6" />
                <span className="text-sm font-medium">CSV</span>
                <span className="text-xs text-muted-foreground">Compatível com Excel</span>
              </Label>
            </div>
            <div>
              <RadioGroupItem
                value="xlsx"
                id="xlsx"
                className="peer sr-only"
              />
              <Label
                htmlFor="xlsx"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
              >
                <FileSpreadsheet className="mb-3 h-6 w-6" />
                <span className="text-sm font-medium">Excel</span>
                <span className="text-xs text-muted-foreground">Formato nativo .xlsx</span>
              </Label>
            </div>
          </RadioGroup>

          <div className="text-xs text-muted-foreground p-3 bg-muted/50 rounded-lg">
            <p className="font-medium mb-1">Campos exportados:</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>Nome</li>
              <li>Telefone</li>
              <li>Email</li>
              <li>Informações Adicionais</li>
              <li>Data de Criação</li>
            </ul>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              Cancelar
            </Button>
            <Button onClick={handleExport} disabled={isLoading}>
              {isLoading ? 'Exportando...' : 'Exportar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExportContactsModal;
