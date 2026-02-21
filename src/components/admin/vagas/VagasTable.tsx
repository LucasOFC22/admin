import React from 'react';
import { Edit, Trash2, Eye, EyeOff, MapPin, Calendar, MoreVertical, Users, ChevronLeft, ChevronRight } from 'lucide-react';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { VagaEmprego } from '@/types/vagas';

interface VagasTableProps {
  vagas: VagaEmprego[];
  onEdit: (vaga: VagaEmprego) => void;
  onDelete: (vaga: VagaEmprego) => void;
  onToggleAtivo: (vaga: VagaEmprego) => void;
  onViewCandidaturas: (vaga: VagaEmprego) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const VagasTable: React.FC<VagasTableProps> = ({ vagas, onEdit, onDelete, onToggleAtivo, onViewCandidaturas, currentPage, totalPages, onPageChange }) => {
  // Componente de Paginação
  const Pagination = () => (
    totalPages > 1 ? (
      <div className="flex items-center justify-between px-4 py-3 border-t border-border">
        <p className="text-sm text-muted-foreground">
          Página {currentPage} de {totalPages}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
          >
            Próxima
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    ) : null
  );

  // Versão Mobile - Cards
  const MobileView = () => (
    <div className="md:hidden space-y-3 p-4">
      {vagas.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          Nenhuma vaga cadastrada
        </div>
      ) : (
        <>
        {vagas.map((vaga) => (
          <div 
            key={vaga.id} 
            className="bg-card border border-border rounded-lg p-4 space-y-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground truncate">{vaga.titulo}</h3>
                <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                  <MapPin className="w-3 h-3" />
                  <span>{vaga.cidade}</span>
                </div>
              </div>
              <Badge 
                variant={vaga.ativo ? 'default' : 'secondary'}
                className={vaga.ativo ? 'bg-green-600 hover:bg-green-700' : ''}
              >
                {vaga.ativo ? 'Ativa' : 'Inativa'}
              </Badge>
            </div>
            
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>
                  {vaga.created_at 
                    ? new Date(vaga.created_at).toLocaleDateString('pt-BR')
                    : '-'}
                </span>
              </div>
              {vaga.vagas && vaga.vagas > 0 && (
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  <span>{vaga.vagas} {vaga.vagas === 1 ? 'vaga' : 'vagas'}</span>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewCandidaturas(vaga)}
                className="flex-1"
              >
                <Users className="w-4 h-4 mr-1" />
                Candidaturas
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onToggleAtivo(vaga)}
              >
                {vaga.ativo ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(vaga)}
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(vaga)}
              >
                <Edit className="w-4 h-4" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Excluir Vaga</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tem certeza que deseja excluir a vaga "{vaga.titulo}"? 
                      Esta ação não pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => onDelete(vaga)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Excluir
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        ))}
        <Pagination />
        </>
      )}
    </div>
  );

  // Versão Desktop - Tabela
  const DesktopView = () => (
    <div className="hidden md:block overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="font-semibold">Título</TableHead>
            <TableHead className="font-semibold">Cidade</TableHead>
            <TableHead className="font-semibold text-center">Qtd</TableHead>
            <TableHead className="font-semibold">Status</TableHead>
            <TableHead className="font-semibold">Criado em</TableHead>
            <TableHead className="text-right font-semibold">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {vagas.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                Nenhuma vaga cadastrada
              </TableCell>
            </TableRow>
          ) : (
            vagas.map((vaga) => (
              <TableRow key={vaga.id} className="group">
                <TableCell className="font-medium max-w-[200px]">
                  <span className="truncate block">{vaga.titulo}</span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <MapPin className="w-3 h-3" />
                    {vaga.cidade}
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Users className="w-3 h-3 text-muted-foreground" />
                    <span>{vaga.vagas || 1}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={vaga.ativo ? 'default' : 'secondary'}
                    className={vaga.ativo ? 'bg-green-600 hover:bg-green-700' : ''}
                  >
                    {vaga.ativo ? 'Ativa' : 'Inativa'}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {vaga.created_at 
                    ? new Date(vaga.created_at).toLocaleDateString('pt-BR')
                    : '-'}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onViewCandidaturas(vaga)}>
                        <Users className="w-4 h-4 mr-2" />
                        Candidaturas
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onToggleAtivo(vaga)}>
                        {vaga.ativo ? (
                          <>
                            <EyeOff className="w-4 h-4 mr-2" />
                            Desativar
                          </>
                        ) : (
                          <>
                            <Eye className="w-4 h-4 mr-2" />
                            Ativar
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit(vaga)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem 
                            className="text-destructive focus:text-destructive"
                            onSelect={(e) => e.preventDefault()}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir Vaga</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir a vaga "{vaga.titulo}"? 
                              Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => onDelete(vaga)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      <Pagination />
    </div>
  );

  return (
    <>
      <MobileView />
      <DesktopView />
    </>
  );
};

export default VagasTable;
