import React, { useState, useRef, useCallback } from 'react';
import { ImagePlus, Upload, Sparkles, Search, Calendar, X, Loader2, FileDown } from 'lucide-react';
import PageHeader from '@/components/admin/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

const MAX_IMAGES = 30;

const BaixaRapidaCte = () => {
  const [images, setImages] = useState<File[]>([]);
  const [codigoOcorrencia, setCodigoOcorrencia] = useState('');
  const [dataOcorrencia, setDataOcorrencia] = useState<Date | undefined>();
  const [horaOcorrencia, setHoraOcorrencia] = useState('');
  const [observacao, setObservacao] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter(f => f.type.startsWith('image/'));
    
    if (images.length + imageFiles.length > MAX_IMAGES) {
      toast.error(`Máximo de ${MAX_IMAGES} imagens permitidas`);
      return;
    }
    
    setImages(prev => [...prev, ...imageFiles]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [images.length]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    
    if (images.length + files.length > MAX_IMAGES) {
      toast.error(`Máximo de ${MAX_IMAGES} imagens permitidas`);
      return;
    }
    
    setImages(prev => [...prev, ...files]);
  }, [images.length]);

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const canSubmit = codigoOcorrencia && dataOcorrencia && horaOcorrencia && images.length > 0;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    try {
      // TODO: Integrar com edge function de baixa rápida
      toast.success(`Baixa registrada com sucesso para ${images.length} CT-e(s)`);
      setImages([]);
      setCodigoOcorrencia('');
      setDataOcorrencia(undefined);
      setHoraOcorrencia('');
      setObservacao('');
    } catch (error) {
      toast.error('Erro ao registrar baixa');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30">
      <PageHeader
        title="Baixa Rápida de CT-e"
        subtitle="Registre ocorrências em lote através de imagens dos CT-es"
        icon={FileDown}
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Operacional' },
          { label: 'Baixa Rápida CT-e' }
        ]}
      />

      <main className="flex-1 p-4 lg:p-6">
        <div className="space-y-6">
          {/* Card de Upload de Imagens */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <ImagePlus className="h-5 w-5" />
                  Imagens dos CT-es ({images.length}/{MAX_IMAGES})
                </CardTitle>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    size="sm"
                    disabled={images.length === 0}
                    className="gap-1"
                  >
                    <Sparkles className="h-4 w-4" />
                    Validar Chaves com IA
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Drop zone */}
              <div
                className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors mb-4"
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
              >
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Arraste imagens aqui ou clique para selecionar
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Máximo {MAX_IMAGES} imagens por vez
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </div>

              {/* Preview das imagens */}
              {images.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {images.map((img, idx) => (
                    <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden border border-border">
                      <img
                        src={URL.createObjectURL(img)}
                        alt={`CT-e ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => removeImage(idx)}
                        className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                      <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] text-center py-0.5">
                        {idx + 1}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card de Dados da Baixa */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Dados da Baixa Rápida</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Código da Ocorrência */}
              <div className="space-y-2">
                <Label>Código da Ocorrência *</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Digite o código ou clique na lupa para listar"
                    value={codigoOcorrencia}
                    onChange={(e) => setCodigoOcorrencia(e.target.value)}
                  />
                  <Button variant="outline">
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Data e Hora */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data da Ocorrência *</Label>
                  <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                    <PopoverTrigger asChild>
                      <div className="relative flex items-center">
                        <Input
                          placeholder="Selecionar data"
                          value={dataOcorrencia ? format(dataOcorrencia, 'dd/MM/yyyy', { locale: ptBR }) : ''}
                          readOnly
                          className="pr-10 cursor-pointer"
                        />
                        <button
                          type="button"
                          className="absolute right-0 h-full px-3 hover:bg-transparent"
                        >
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                        </button>
                      </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={dataOcorrencia}
                        onSelect={(date) => {
                          setDataOcorrencia(date);
                          setCalendarOpen(false);
                        }}
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Hora da Ocorrência *</Label>
                  <Input
                    type="time"
                    value={horaOcorrencia}
                    onChange={(e) => setHoraOcorrencia(e.target.value)}
                  />
                </div>
              </div>

              {/* Observação */}
              <div className="space-y-2">
                <Label>Observação Interna</Label>
                <Textarea
                  placeholder="Observação interna (opcional)"
                  rows={3}
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                />
              </div>

              {/* Botão de Submit */}
              <Button
                className="w-full"
                disabled={!canSubmit || isSubmitting}
                onClick={handleSubmit}
              >
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Registrar Baixa ({images.length} CTEs)
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default BaixaRapidaCte;
