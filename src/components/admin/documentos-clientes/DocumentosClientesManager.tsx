import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  FolderOpen,
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Download,
  FileText,
  Eye,
} from 'lucide-react';
import { useDocumentosRepositorio } from '@/hooks/useDocumentosRepositorio';
import { documentoStorageService } from '@/services/documentoStorageService';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import DocumentoFormDialog from './DocumentoFormDialog';
import AuditoriaDialog from './AuditoriaDialog';
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

const DocumentosClientesManager = () => {
  const [search, setSearch] = useState('');
  const [ativoFilter, setAtivoFilter] = useState<'all' | 'true' | 'false'>('all');

  // Dialogs state
  const [formOpen, setFormOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<any>(null);
  const [auditoriaDoc, setAuditoriaDoc] = useState<any>(null);
  const [deleteDoc, setDeleteDoc] = useState<any>(null);

  const { 
    documentos, 
    isLoading, 
    deleteDocumento, 
    toggleAtivo,
    isDeleting 
  } = useDocumentosRepositorio({
    ativo: ativoFilter !== 'all' ? ativoFilter === 'true' : undefined,
    search: search || undefined
  });

  // Stats
  const totalDocs = documentos.length;
  const docsAtivos = documentos.filter(d => d.ativo).length;
  const totalDownloads = documentos.reduce((acc, d) => acc + (d.downloads_count || 0), 0);

  const handleCreate = () => {
    setEditingDoc(null);
    setFormOpen(true);
  };

  const handleEdit = (doc: any) => {
    setEditingDoc(doc);
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (deleteDoc) {
      await deleteDocumento(deleteDoc.id);
      setDeleteDoc(null);
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
            <FolderOpen className="w-7 h-7 text-primary" />
            Repositório de Documentos
          </h2>
          <p className="text-muted-foreground mt-1">
            Gerencie documentos disponíveis para todos os clientes
          </p>
        </div>
        <Button onClick={handleCreate} size="lg" className="w-full sm:w-auto">
          <Plus className="w-5 h-5 mr-2" />
          Novo Documento
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Total de Documentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">{totalDocs}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Eye className="w-4 h-4 text-green-600" />
              Documentos Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{docsAtivos}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Download className="w-4 h-4 text-blue-600" />
              Downloads Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600">{totalDownloads}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por título ou descrição..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : documentos.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <FolderOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">Nenhum documento encontrado</p>
              <p className="text-sm">Clique em "Novo Documento" para começar</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Documento</TableHead>
                  <TableHead>Arquivo</TableHead>
                  <TableHead className="text-center">Downloads</TableHead>
                  <TableHead className="text-center">Ativo</TableHead>
                  <TableHead className="text-center">Criado em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documentos.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{doc.titulo}</span>
                        {doc.descricao && (
                          <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {doc.descricao}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm truncate max-w-[150px]">{doc.nome_arquivo}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">{doc.downloads_count || 0}</TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={doc.ativo}
                        onCheckedChange={(checked) => toggleAtivo({ id: doc.id, ativo: checked })}
                      />
                    </TableCell>
                    <TableCell className="text-center text-sm text-muted-foreground">
                      {format(new Date(doc.criado_em), 'dd/MM/yyyy', { locale: ptBR })}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(doc)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setAuditoriaDoc(doc)}>
                            <Download className="w-4 h-4 mr-2" />
                            Histórico Downloads
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setDeleteDoc(doc)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <DocumentoFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        documento={editingDoc}
      />

      <AuditoriaDialog
        documento={auditoriaDoc}
        open={!!auditoriaDoc}
        onOpenChange={(open) => !open && setAuditoriaDoc(null)}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteDoc} onOpenChange={(open) => !open && setDeleteDoc(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir documento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O documento "{deleteDoc?.titulo}" será permanentemente excluído.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DocumentosClientesManager;
