import React, { useState } from 'react';
import { Users, FileText, Mail, Phone, MapPin, Calendar, X, ExternalLink, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCandidaturas } from '@/hooks/useCandidaturas';
import { Candidatura, CandidaturaMensagem } from '@/types/candidaturas';

interface CandidaturasViewerProps {
  vagaId: number;
  vagaTitulo: string;
  open: boolean;
  onClose: () => void;
}

const CandidaturasViewer: React.FC<CandidaturasViewerProps> = ({ vagaId, vagaTitulo, open, onClose }) => {
  const { data: candidaturas, isLoading } = useCandidaturas(open ? vagaId : undefined);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const parseMensagem = (mensagem: string | null): CandidaturaMensagem | null => {
    if (!mensagem) return null;
    try {
      return JSON.parse(mensagem);
    } catch {
      return null;
    }
  };

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <>
      {/* Lista de candidaturas */}
      <Dialog open={open && !pdfUrl} onOpenChange={(v) => !v && onClose()}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4 border-b flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Candidaturas — {vagaTitulo}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1 px-6 py-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : !candidaturas || candidaturas.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                Nenhuma candidatura recebida para esta vaga.
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground mb-4">
                  {candidaturas.length} candidatura{candidaturas.length !== 1 ? 's' : ''} recebida{candidaturas.length !== 1 ? 's' : ''}
                </p>
                {candidaturas.map((c) => {
                  const msg = parseMensagem(c.mensagem);
                  const isExpanded = expandedId === c.id;

                  return (
                    <Card key={c.id} className="border border-border">
                      <CardContent className="p-4 space-y-2">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-foreground truncate">{c.nome}</h4>
                            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mt-1">
                              <span className="flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {c.email}
                              </span>
                              {c.telefone && (
                                <span className="flex items-center gap-1">
                                  <Phone className="w-3 h-3" />
                                  {c.telefone}
                                </span>
                              )}
                              {c.cidade && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {c.cidade}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(c.created_at).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                        </div>

                        {/* Actions row */}
                        <div className="flex items-center gap-2 pt-1">
                          {c.curriculo && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setPdfUrl(c.curriculo)}
                              className="text-primary"
                            >
                              <FileText className="w-4 h-4 mr-1" />
                              Ver Currículo
                            </Button>
                          )}
                          {msg && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleExpand(c.id)}
                            >
                              {isExpanded ? <ChevronUp className="w-4 h-4 mr-1" /> : <ChevronDown className="w-4 h-4 mr-1" />}
                              Detalhes
                            </Button>
                          )}
                        </div>

                        {/* Expanded details */}
                        {isExpanded && msg && (
                          <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1 border border-border/50">
                            {msg.cpf && <p><span className="font-medium">CPF:</span> {msg.cpf}</p>}
                            {msg.data_nascimento && <p><span className="font-medium">Nascimento:</span> {msg.data_nascimento}</p>}
                            {msg.nome_pai && <p><span className="font-medium">Pai:</span> {msg.nome_pai}</p>}
                            {msg.nome_mae && <p><span className="font-medium">Mãe:</span> {msg.nome_mae}</p>}
                            {msg.colaborador && <p><span className="font-medium">Colaborador:</span> {msg.colaborador}</p>}
                            {msg.consentimento_whatsapp !== undefined && (
                              <p>
                                <span className="font-medium">WhatsApp:</span>{' '}
                                <Badge variant={msg.consentimento_whatsapp ? 'default' : 'secondary'} className="text-xs">
                                  {msg.consentimento_whatsapp ? 'Autorizou' : 'Não autorizou'}
                                </Badge>
                              </p>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* PDF Viewer */}
      <Dialog open={!!pdfUrl} onOpenChange={(v) => !v && setPdfUrl(null)}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-4 pb-3 border-b flex-shrink-0">
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Currículo
              </DialogTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => pdfUrl && window.open(pdfUrl, '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-1" />
                  Abrir em nova aba
                </Button>
              </div>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            {pdfUrl && (
              <iframe
                src={pdfUrl}
                className="w-full h-full border-0"
                title="Currículo PDF"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CandidaturasViewer;
