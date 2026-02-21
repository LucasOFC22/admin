import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, FileCheck, Mail, Hash } from 'lucide-react';
import { SolicitacaoDocumento } from '@/types/database';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SolicitacoesCardsProps {
  solicitacoes: SolicitacaoDocumento[];
  onViewDetails: (solicitacao: SolicitacaoDocumento) => void;
}

const statusMap = {
  pendente: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  em_processamento: { label: 'Em Processamento', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  finalizado: { label: 'Finalizado', color: 'bg-green-100 text-green-800 border-green-300' },
  erro: { label: 'Erro', color: 'bg-red-100 text-red-800 border-red-300' },
};

const tipoMap = {
  comprovante_entrega: { label: 'Comprovante Entrega', icon: FileCheck },
  cte: { label: 'CT-e', icon: FileCheck },
  boleto: { label: 'Boleto', icon: FileCheck },
};

export const SolicitacoesCards = ({ solicitacoes, onViewDetails }: SolicitacoesCardsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {solicitacoes.map((solicitacao) => {
        const TipoIcon = tipoMap[solicitacao.tipo_documento].icon;
        
        return (
          <Card 
            key={solicitacao.id} 
            className="group hover:shadow-xl transition-all duration-300 border hover:border-primary/50 cursor-pointer"
            onClick={() => onViewDetails(solicitacao)}
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <TipoIcon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">
                      {tipoMap[solicitacao.tipo_documento].label}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {solicitacao.origem}
                    </p>
                  </div>
                </div>
                <Badge className={statusMap[solicitacao.status].color}>
                  {statusMap[solicitacao.status].label}
                </Badge>
              </div>

              <div className="space-y-2.5 mb-4 min-h-[80px]">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground truncate">{solicitacao.email_resposta}</span>
                </div>
                
                {(solicitacao.numero_cte || solicitacao.numero_nfe || solicitacao.cpf_cnpj) && (
                  <div className="flex items-start gap-2 text-sm">
                    <Hash className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="text-muted-foreground">
                      {solicitacao.numero_cte && <div>CT-e: {solicitacao.numero_cte}</div>}
                      {solicitacao.numero_nfe && <div>NF-e: {solicitacao.numero_nfe}</div>}
                      {solicitacao.cpf_cnpj && <div>CPF/CNPJ: {solicitacao.cpf_cnpj}</div>}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t">
                <div className="text-xs text-muted-foreground">
                  {format(new Date(solicitacao.criado_em), "dd/MM/yy HH:mm", { locale: ptBR })}
                </div>
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewDetails(solicitacao);
                  }}
                  variant="ghost"
                  size="sm"
                  className="group-hover:bg-primary/10"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Ver
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
