import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, ArrowLeft, Loader2, MapPin, Building2, FileText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import AdminTrackingDisplay from '@/components/tracking/AdminTrackingDisplay';
import { backendService } from '@/services/api/backendService';
import { formatCPFCNPJ, validateCPF, validateCNPJ } from '@/lib/formatters';
import PageHeader from '@/components/admin/PageHeader';
import PermissionGuard from '@/components/admin/permissions/PermissionGuard';

const AdminRastreamento: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [documento, setDocumento] = useState(searchParams.get('cnpj') || '');
  const [numeroNF, setNumeroNF] = useState(searchParams.get('nfe') || '');
  const [isLoading, setIsLoading] = useState(false);
  const [trackingData, setTrackingData] = useState<any>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [errors, setErrors] = useState<{ documento?: string; numeroNF?: string }>({});
  const resultRef = useRef<HTMLDivElement>(null);
  const autoSearchExecuted = useRef(false);

  // Auto-buscar se houver parâmetros na URL
  useEffect(() => {
    const cnpjParam = searchParams.get('cnpj');
    const nfeParam = searchParams.get('nfe');
    
    if (cnpjParam && nfeParam && !autoSearchExecuted.current) {
      autoSearchExecuted.current = true;
      const formattedCnpj = formatCPFCNPJ(cnpjParam);
      setDocumento(formattedCnpj);
      setNumeroNF(nfeParam);
      handleSearch(formattedCnpj, nfeParam);
    }
  }, [searchParams]);

  const validateForm = () => {
    const newErrors: { documento?: string; numeroNF?: string } = {};
    
    if (!documento.trim()) {
      newErrors.documento = 'CPF ou CNPJ é obrigatório';
    } else {
      const cleanDoc = documento.replace(/\D/g, '');
      if (cleanDoc.length === 11 && !validateCPF(documento)) {
        newErrors.documento = 'CPF inválido';
      } else if (cleanDoc.length === 14 && !validateCNPJ(documento)) {
        newErrors.documento = 'CNPJ inválido';
      } else if (cleanDoc.length !== 11 && cleanDoc.length !== 14) {
        newErrors.documento = 'Digite um CPF (11 dígitos) ou CNPJ (14 dígitos) válido';
      }
    }
    
    if (!numeroNF.trim()) {
      newErrors.numeroNF = 'Número da Nota Fiscal é obrigatório';
    } else if (numeroNF.trim().length < 3) {
      newErrors.numeroNF = 'Número da NF deve ter pelo menos 3 dígitos';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleDocumentoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const formatted = formatCPFCNPJ(value);
    setDocumento(formatted);
    
    if (errors.documento) {
      setErrors(prev => ({ ...prev, documento: undefined }));
    }
  };

  const handleNFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNumeroNF(e.target.value);
    
    if (errors.numeroNF) {
      setErrors(prev => ({ ...prev, numeroNF: undefined }));
    }
  };

  const handleSearch = async (doc?: string, nf?: string) => {
    const docValue = doc || documento;
    const nfValue = nf || numeroNF;
    
    if (!doc && !nf && !validateForm()) {
      return;
    }

    setIsLoading(true);
    setHasSearched(true);
    
    try {
      // Atualiza URL com os parâmetros de busca
      setSearchParams({ 
        cnpj: docValue.replace(/\D/g, ''), 
        nfe: nfValue.trim() 
      });
      
      const result = await backendService.rastrearMercadoria(docValue, nfValue.trim());
      
      if (result.success && result.data) {
        // Verifica se retornou code = 500 (mercadoria não encontrada)
        if (result.data?.code === 500) {
          setTrackingData(null);
          toast.warning('Mercadoria não encontrada. Verifique se o CPF/CNPJ e número da NF estão corretos.');
          return;
        }

        let extractedData = null;
        const data = result.data;
        
        if (Array.isArray(data) && data.length > 0) {
          extractedData = data[0].json || data[0];
        } else if (data && typeof data === 'object') {
          extractedData = data;
        }
        
        if (extractedData && (extractedData.nroNf || extractedData.origem === 'coleta')) {
          setTrackingData(result);
          toast.success('Dados de rastreamento encontrados');
          
          // Scroll para o resultado
          setTimeout(() => {
            resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 100);
        } else {
          setTrackingData(null);
          toast.warning('Nenhum dado encontrado para os parâmetros informados');
        }
      } else {
        setTrackingData(null);
        toast.error('Nenhum resultado encontrado para esta busca');
      }
    } catch (error) {
      console.error('Erro ao rastrear:', error);
      setTrackingData(null);
      toast.error('Erro ao realizar a busca. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewSearch = () => {
    setTrackingData(null);
    setHasSearched(false);
    setDocumento('');
    setNumeroNF('');
    setErrors({});
    setSearchParams({});
    autoSearchExecuted.current = false;
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch();
  };

  return (
    <PermissionGuard 
      permissions="admin.rastreamento.visualizar"
      showMessage={true}
    >
      <div className="flex flex-col h-full overflow-hidden">
        <PageHeader
          title="Rastreamento"
          subtitle="Rastreie mercadorias por CPF/CNPJ do destinatário e número da NF"
          icon={MapPin}
          breadcrumbs={[
            { label: 'Dashboard', href: '/' },
            { label: 'Rastreamento' }
          ]}
        />

        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <div className="space-y-6">
            {/* Formulário de Busca */}
            <Card className="border-border/50 shadow-sm">
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label htmlFor="documento" className="flex items-center gap-2 text-sm font-medium">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        CPF/CNPJ do Destinatário
                      </Label>
                      <Input
                        id="documento"
                        placeholder="Digite o CPF ou CNPJ..."
                        value={documento}
                        onChange={handleDocumentoChange}
                        onKeyPress={handleKeyPress}
                        disabled={isLoading}
                        className={`h-11 ${errors.documento ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                        maxLength={18}
                      />
                      {errors.documento && (
                        <p className="text-sm text-destructive">{errors.documento}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="numeroNF" className="flex items-center gap-2 text-sm font-medium">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        Número da Nota Fiscal
                      </Label>
                      <Input
                        id="numeroNF"
                        placeholder="Digite o número da NF..."
                        value={numeroNF}
                        onChange={handleNFChange}
                        onKeyPress={handleKeyPress}
                        disabled={isLoading}
                        className={`h-11 ${errors.numeroNF ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                      />
                      {errors.numeroNF && (
                        <p className="text-sm text-destructive">{errors.numeroNF}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <Button 
                      type="submit" 
                      disabled={isLoading} 
                      className="h-11 px-6"
                      size="lg"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Buscando...
                        </>
                      ) : (
                        <>
                          <Search className="h-4 w-4 mr-2" />
                          Rastrear Mercadoria
                        </>
                      )}
                    </Button>
                    
                    {(documento || numeroNF) && (
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={handleNewSearch}
                        disabled={isLoading}
                        className="h-11"
                      >
                        Limpar Campos
                      </Button>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Resultado */}
            {trackingData && (
              <div ref={resultRef} className="space-y-4">
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="sm" onClick={handleNewSearch} className="text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Nova Consulta
                  </Button>
                </div>
                
                <AdminTrackingDisplay data={trackingData} />
              </div>
            )}

            {/* Estado vazio após busca sem resultados */}
            {hasSearched && !isLoading && !trackingData && (
              <Card className="border-dashed">
                <CardContent className="py-16 text-center">
                  <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Search className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    Nenhum resultado encontrado
                  </h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Não foram encontrados dados de rastreamento para os parâmetros informados. Verifique se o CPF/CNPJ e número da NF estão corretos.
                  </p>
                  <Button variant="outline" onClick={handleNewSearch}>
                    Tentar novamente
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </PermissionGuard>
  );
};

export default AdminRastreamento;
