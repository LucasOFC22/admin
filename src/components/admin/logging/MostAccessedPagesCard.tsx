/**
 * Componente que exibe as páginas mais acessadas do sistema
 */

import { useQuery } from '@tanstack/react-query';
import { BarChart3, TrendingUp, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { requireAuthenticatedClient } from '@/config/supabaseAuth';

interface PageAccess {
  pagina: string;
  total_acessos: number;
}

interface MostAccessedPagesCardProps {
  startDate: string;
  endDate: string;
}

const MostAccessedPagesCard = ({ startDate, endDate }: MostAccessedPagesCardProps) => {
  const { data: pagesData, isLoading } = useQuery({
    queryKey: ['most-accessed-pages', startDate, endDate],
    queryFn: async () => {
      // Buscar logs de navegação/visualização agrupados por página
      const supabase = requireAuthenticatedClient();
      const { data, error } = await supabase
        .from('logs_atividade')
        .select('detalhes')
        .eq('tipo', 'view')
        .gte('created_at', `${startDate}T00:00:00`)
        .lte('created_at', `${endDate}T23:59:59`);

      if (error) throw error;

      // Processar os dados para contar acessos por página
      const pageCount: Record<string, number> = {};
      
      data?.forEach(log => {
        try {
          const detalhes = typeof log.detalhes === 'string' 
            ? JSON.parse(log.detalhes) 
            : log.detalhes;
          
          const pagina = detalhes?.pagina || detalhes?.rota || detalhes?.page || 'Desconhecida';
          pageCount[pagina] = (pageCount[pagina] || 0) + 1;
        } catch {
          // Ignora logs com detalhes inválidos
        }
      });

      // Converter para array e ordenar
      const pages: PageAccess[] = Object.entries(pageCount)
        .map(([pagina, total_acessos]) => ({ pagina, total_acessos }))
        .sort((a, b) => b.total_acessos - a.total_acessos)
        .slice(0, 5);

      return {
        topPage: pages[0] || null,
        topPages: pages,
        totalViews: data?.length || 0
      };
    }
  });

  const formatPageName = (page: string): string => {
    // Remove barras iniciais e formata o nome
    const formatted = page
      .replace(/^\/admin\//, '')
      .replace(/^\//, '')
      .replace(/-/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
    
    return formatted || 'Dashboard';
  };

  const getProgressWidth = (count: number, maxCount: number): string => {
    const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
    return `${Math.max(percentage, 5)}%`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-4 w-4" />
            Páginas Mais Acessadas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const maxCount = pagesData?.topPages[0]?.total_acessos || 1;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <BarChart3 className="h-4 w-4" />
          Páginas Mais Acessadas
        </CardTitle>
        <CardDescription>
          {pagesData?.totalViews || 0} visualizações no período selecionado
        </CardDescription>
      </CardHeader>
      <CardContent>
        {pagesData?.topPage ? (
          <div className="space-y-4">
            {/* Destaque da página mais acessada */}
            <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="text-xs font-medium text-primary">Página Mais Acessada</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-lg">
                  {formatPageName(pagesData.topPage.pagina)}
                </span>
                <Badge variant="default" className="text-sm">
                  <Eye className="h-3 w-3 mr-1" />
                  {pagesData.topPage.total_acessos} acessos
                </Badge>
              </div>
            </div>

            {/* Lista das top 5 páginas */}
            <div className="space-y-3">
              <span className="text-sm font-medium text-muted-foreground">Top 5 Páginas</span>
              {pagesData.topPages.map((page, index) => (
                <div key={page.pagina} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground font-mono text-xs w-5">
                        #{index + 1}
                      </span>
                      <span className="font-medium truncate max-w-[200px]">
                        {formatPageName(page.pagina)}
                      </span>
                    </div>
                    <span className="text-muted-foreground text-xs">
                      {page.total_acessos} {page.total_acessos === 1 ? 'acesso' : 'acessos'}
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary/70 rounded-full transition-all duration-500"
                      style={{ width: getProgressWidth(page.total_acessos, maxCount) }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Eye className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Nenhum dado de visualização encontrado no período</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MostAccessedPagesCard;
