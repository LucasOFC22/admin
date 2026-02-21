import { Malote, calcularTotais } from "@/types/malote";
import { Calendar, User, Eye, Printer, Trash2, Send, CheckCircle, Clock, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface MaloteCardProps {
  malote: Malote;
  onView: (id: string) => void;
  onEdit?: (id: string) => void;
  onPrint: (id: string) => void;
  onDelete?: (id: string) => void;
  onSendSignature: (id: string) => void;
}

const MaloteCard = ({ malote, onView, onEdit, onPrint, onDelete, onSendSignature }: MaloteCardProps) => {
  const totais = calcularTotais(malote);
  const dataFormatada = new Date(malote.createdAt).toLocaleDateString('pt-BR');

  const getStatusBadge = () => {
    if (malote.assinado) {
      return (
        <Badge className="bg-success/20 text-success border-success/30">
          <CheckCircle className="w-3 h-3 mr-1" />
          Assinado
        </Badge>
      );
    }
    if (malote.tokenAssinatura && malote.tokenValidoAte) {
      const isExpired = new Date(malote.tokenValidoAte) < new Date();
      if (isExpired) {
        return (
          <Badge variant="destructive" className="bg-destructive/20 text-destructive border-destructive/30">
            <Clock className="w-3 h-3 mr-1" />
            Expirado
          </Badge>
        );
      }
      return (
        <Badge className="bg-warning/20 text-warning border-warning/30">
          <Clock className="w-3 h-3 mr-1" />
          Aguardando
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="bg-muted text-muted-foreground">
        Pendente
      </Badge>
    );
  };

  return (
    <div className="bg-card border border-border rounded-lg p-5 hover:shadow-lg transition-all duration-300 animate-fade-in">
      {/* Número do Malote */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-primary text-primary-foreground text-sm font-bold rounded-md">
            #{malote.numero?.toString().padStart(4, '0') || 'S/N'}
          </span>
          {malote.tipoCaminhaoNome && (
            <Badge variant="outline" className="text-xs">
              {malote.tipoCaminhaoNome}
            </Badge>
          )}
        </div>
        {getStatusBadge()}
      </div>
      
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{malote.motorista}</h3>
            <p className="text-sm text-muted-foreground">{malote.percentual}% comissão</p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-muted-foreground text-sm">
          <Calendar className="w-4 h-4" />
          <span>{dataFormatada}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-secondary/50 rounded-md p-3">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Vale Viagem</p>
          <p className="text-lg font-semibold text-foreground">
            {malote.valeViagem.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
        </div>
        <div className="bg-secondary/50 rounded-md p-3">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Faturamento</p>
          <p className="text-lg font-semibold text-foreground">
            {totais.totalFaturamento.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-border">
        <span className="text-sm text-muted-foreground">
          {malote.viagens.length} viagem(ns)
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onView(malote.id)}
            className="text-muted-foreground hover:text-foreground"
            title="Visualizar"
          >
            <Eye className="w-4 h-4" />
          </Button>
          {!malote.assinado && onEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(malote.id)}
              className="text-muted-foreground hover:text-foreground"
              title="Editar"
            >
              <Edit className="w-4 h-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onPrint(malote.id)}
            className="text-muted-foreground hover:text-foreground"
            title="Imprimir"
          >
            <Printer className="w-4 h-4" />
          </Button>
          {!malote.assinado && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSendSignature(malote.id)}
              className="text-muted-foreground hover:text-green-600"
              title="Enviar para assinatura"
            >
              <Send className="w-4 h-4" />
            </Button>
          )}
          {!malote.assinado && onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(malote.id)}
              className="text-muted-foreground hover:text-destructive"
              title="Excluir"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MaloteCard;
