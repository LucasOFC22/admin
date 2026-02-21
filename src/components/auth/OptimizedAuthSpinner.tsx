
import { motion } from "framer-motion";

interface OptimizedAuthSpinnerProps {
  message?: string;
  minimal?: boolean;
}

const OptimizedAuthSpinner = ({ message = "Carregando...", minimal = false }: OptimizedAuthSpinnerProps) => {
  if (minimal) {
    return (
      <div className="flex items-center justify-center min-h-[60px]">
        <div className="w-5 h-5 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="flex items-center justify-center min-h-[200px]"
    >
      <div className="text-center space-y-4">
        <div className="relative">
          <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto" />
          <div className="absolute inset-0 w-8 h-8 border-3 border-transparent border-r-blue-400 rounded-full animate-spin mx-auto" style={{ animationDelay: '0.3s', animationDuration: '1.2s' }} />
        </div>
        <p className="text-sm text-slate-600 font-medium">{message}</p>
      </div>
    </motion.div>
  );
};

export default OptimizedAuthSpinner;
