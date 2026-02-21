import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { motion } from 'framer-motion';

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center gap-6"
        >
          {/* 404 Text */}
          <div className="text-9xl font-bold text-muted-foreground/30">404</div>

          {/* Conteúdo */}
          <div className="max-w-[700px] flex flex-col items-center gap-6 px-4 md:px-16">
            <h1 
              className="text-center font-bold text-foreground"
              style={{ fontSize: 'clamp(28px, 5vw, 40px)', lineHeight: 1.1 }}
            >
              Página Não Encontrada
            </h1>
            
            <p 
              className="text-center text-muted-foreground"
              style={{ fontSize: 'clamp(14px, 2.5vw, 18px)', lineHeight: 1.2 }}
            >
              A página que você tentou acessar não existe ou foi movida.
            </p>

            <Link
              to="/"
              className="h-[50px] px-8 bg-primary text-primary-foreground font-medium rounded flex items-center justify-center hover:bg-primary/90 transition-colors"
              style={{ fontSize: 16, lineHeight: 1.4 }}
            >
              Voltar para Dashboard
            </Link>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default NotFound;
