
import { useEffect, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';

export const useQuoteUrlFilter = () => {
  const [cotacaoIdFromUrl, setCotacaoIdFromUrl] = useState<string | null>(null);
  const location = useLocation();
  const params = useParams();

  useEffect(() => {
    let detectedId = null;
    
    // Check for direct path parameter (e.g., /admin/cotacoes/12)
    if (params.id) {
      detectedId = params.id;
    }
    
    // Check for query parameter (e.g., /admin/cotacoes?cotacao=12)
    if (!detectedId && location.search) {
      const urlParams = new URLSearchParams(location.search);
      const cotacaoParam = urlParams.get('cotacao');
      if (cotacaoParam) {
        detectedId = cotacaoParam;
      }
    }
    
    // Check for legacy format with equals sign (backward compatibility)
    if (!detectedId && location.pathname) {
      const legacyMatch = location.pathname.match(/\/admin\/cotacoes\/cotacao=(.+)/);
      if (legacyMatch && legacyMatch[1]) {
        detectedId = legacyMatch[1];
      }
    }
    
    setCotacaoIdFromUrl(detectedId);
    
  }, [location.pathname, location.search, params.id]);

  return cotacaoIdFromUrl;
};
