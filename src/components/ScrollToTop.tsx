import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Força o scroll para o topo imediatamente quando a rota muda
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    // Fallback para garantir que funciona em todos os navegadores
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [pathname]);

  return null;
};

export default ScrollToTop;