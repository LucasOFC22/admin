import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { motion } from 'framer-motion';
import ErrorPageLayout from '@/components/error/ErrorPageLayout';
import { ShieldX, Lock, AlertTriangle } from 'lucide-react';

const FlipNumber = ({ number, delay }: { number: string; delay: number }) => (
  <motion.div
    initial={{ rotateX: -90, opacity: 0 }}
    animate={{ rotateX: 0, opacity: 1 }}
    transition={{ duration: 0.6, delay, ease: "easeOut" }}
    className="perspective-1000"
  >
    <div className="w-20 h-28 md:w-24 md:h-32 bg-white rounded-xl shadow-lg border-2 border-corporate-200 flex items-center justify-center relative overflow-hidden">
      {/* Linha divisória no meio */}
      <div className="absolute w-full h-0.5 bg-corporate-100 top-1/2 -translate-y-1/2 z-10" />
      
      {/* Número */}
      <span className="text-5xl md:text-6xl font-heading font-bold text-corporate-600">
        {number}
      </span>
      
      {/* Efeito de sombra interna */}
      <div className="absolute inset-0 bg-gradient-to-b from-corporate-50/50 to-transparent pointer-events-none" />
    </div>
  </motion.div>
);

const Forbidden = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "403 Error: User attempted to access forbidden route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <ErrorPageLayout>
      <div className="text-center">
        {/* Badge de erro */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="mb-6"
        >
          <div className="inline-flex items-center gap-2 bg-red-100 text-red-600 px-4 py-2 rounded-full text-sm font-medium">
            <AlertTriangle className="w-4 h-4" />
            <span>Erro, tente novamente</span>
          </div>
        </motion.div>

        {/* Ícones decorativos */}
        <div className="relative h-16 mb-4">
          <motion.div
            className="absolute left-1/4 top-0"
            animate={{ y: [0, -5, 0], rotate: [0, 5, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <Lock className="w-8 h-8 text-corporate-300" />
          </motion.div>
          
          <motion.div
            className="absolute right-1/4 top-2"
            animate={{ y: [0, -8, 0], rotate: [0, -5, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
          >
            <ShieldX className="w-10 h-10 text-corporate-400" />
          </motion.div>
        </div>

        {/* Números 403 estilo flip */}
        <div className="flex justify-center items-center gap-3 md:gap-4 mb-8">
          <FlipNumber number="4" delay={0.1} />
          <FlipNumber number="0" delay={0.3} />
          <FlipNumber number="3" delay={0.5} />
        </div>

        {/* Mensagem */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <h1 className="text-2xl md:text-3xl font-heading font-bold text-gray-800 mb-3">
            Ah! Que pena...
          </h1>
          <p className="text-gray-600 text-lg max-w-md mx-auto">
            A página que você tentou acessar não está disponível para o seu usuário. 
            Entre em contato com o administrador se precisar de acesso.
          </p>
        </motion.div>

        {/* Ilustração do escudo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-8 flex justify-center"
        >
          <div className="relative">
            <div className="w-24 h-28 bg-gradient-to-b from-corporate-100 to-corporate-200 rounded-b-full rounded-t-lg flex items-center justify-center">
              <Lock className="w-10 h-10 text-corporate-500" />
            </div>
            {/* Brilho */}
            <motion.div
              className="absolute -inset-2 bg-corporate-300/20 rounded-full blur-xl"
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
        </motion.div>
      </div>
    </ErrorPageLayout>
  );
};

export default Forbidden;
