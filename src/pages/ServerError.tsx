import { useEffect } from "react";
import { motion } from 'framer-motion';
import ErrorPageLayout from '@/components/error/ErrorPageLayout';
import { Server, WifiOff, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ServerError = () => {
  useEffect(() => {
    console.error("500 Error: Internal server error occurred");
  }, []);

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <ErrorPageLayout>
      <div className="text-center">
        {/* Ilustração do servidor */}
        <div className="relative h-48 mb-6 flex items-center justify-center">
          {/* Servidor principal */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative"
          >
            {/* Corpo do servidor */}
            <div className="w-32 h-40 bg-gradient-to-b from-corporate-200 to-corporate-300 rounded-lg relative overflow-hidden border-2 border-corporate-400">
              {/* Slots de disco */}
              {[...Array(4)].map((_, i) => (
                <motion.div
                  key={i}
                  className="mx-3 my-2 h-6 bg-corporate-100 rounded flex items-center px-2 gap-1"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                >
                  <motion.div 
                    className={`w-2 h-2 rounded-full ${i === 1 ? 'bg-red-500' : 'bg-green-500'}`}
                    animate={i === 1 ? { opacity: [1, 0.3, 1] } : {}}
                    transition={{ duration: 0.5, repeat: Infinity }}
                  />
                  <div className="flex-1 h-1 bg-corporate-300 rounded" />
                </motion.div>
              ))}
              
              {/* Ventilação */}
              <div className="absolute bottom-2 left-3 right-3 h-8 bg-corporate-400/50 rounded grid grid-cols-8 gap-0.5 p-1">
                {[...Array(24)].map((_, i) => (
                  <div key={i} className="bg-corporate-500/30 rounded-sm" />
                ))}
              </div>
            </div>

            {/* X vermelho de erro */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.6, type: "spring" }}
              className="absolute -top-3 -right-3 w-10 h-10 bg-red-500 rounded-full flex items-center justify-center shadow-lg"
            >
              <span className="text-white font-bold text-xl">×</span>
            </motion.div>
          </motion.div>

          {/* Linhas de conexão quebradas */}
          <motion.div
            className="absolute left-8 top-1/2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <svg width="40" height="40" viewBox="0 0 40 40">
              <motion.path
                d="M35 20 L25 20 L20 15 L15 20 L5 20"
                stroke="hsl(218 91% 58%)"
                strokeWidth="2"
                fill="none"
                strokeDasharray="4 2"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.8, delay: 0.5 }}
              />
            </svg>
            <WifiOff className="w-6 h-6 text-corporate-400 absolute -left-2 top-2" />
          </motion.div>

          <motion.div
            className="absolute right-8 top-1/2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <svg width="40" height="40" viewBox="0 0 40 40">
              <motion.path
                d="M5 20 L15 20 L20 25 L25 20 L35 20"
                stroke="hsl(218 91% 58%)"
                strokeWidth="2"
                fill="none"
                strokeDasharray="4 2"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.8, delay: 0.6 }}
              />
            </svg>
            <AlertCircle className="w-6 h-6 text-red-400 absolute -right-2 top-2" />
          </motion.div>
        </div>

        {/* Números 500 com efeito de perspectiva */}
        <motion.div 
          className="flex justify-center items-center gap-2 mb-6"
          initial={{ opacity: 0, perspective: 1000 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {['5', '0', '0'].map((num, index) => (
            <motion.span
              key={index}
              className="text-6xl md:text-7xl font-heading font-bold text-corporate-500"
              initial={{ rotateY: -30, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              transition={{ 
                duration: 0.5,
                delay: index * 0.15,
              }}
              style={{
                textShadow: '3px 3px 0 hsl(218 91% 78%)',
              }}
            >
              {num}
            </motion.span>
          ))}
        </motion.div>

        {/* Mensagem */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h1 className="text-2xl md:text-3xl font-heading font-bold text-gray-800 mb-3">
            Poxa, um erro interno...
          </h1>
          <p className="text-gray-600 text-lg max-w-md mx-auto mb-6">
            Ocorreu um erro no servidor. Mas não se preocupe, nossa equipe já foi notificada 
            e está trabalhando para resolver o problema.
          </p>
        </motion.div>

        {/* Botão de tentar novamente */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Button
            onClick={handleRefresh}
            variant="outline"
            className="border-corporate-300 text-corporate-600 hover:bg-corporate-50 rounded-xl px-6 py-3"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Tentar novamente
          </Button>
        </motion.div>
      </div>
    </ErrorPageLayout>
  );
};

export default ServerError;
