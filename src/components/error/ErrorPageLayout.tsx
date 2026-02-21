import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Home, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ErrorPageLayoutProps {
  children: React.ReactNode;
  showHomeButton?: boolean;
  showBackButton?: boolean;
}

const ErrorPageLayout = ({ 
  children, 
  showHomeButton = true,
  showBackButton = true 
}: ErrorPageLayoutProps) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-corporate-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-2xl"
      >
        <div className="bg-white rounded-3xl shadow-xl border-2 border-corporate-200 overflow-hidden">
          <div className="p-8 md:p-12">
            {children}
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 justify-center mt-8"
            >
              {showBackButton && (
                <Button
                  variant="outline"
                  onClick={() => navigate(-1)}
                  className="border-corporate-300 text-corporate-600 hover:bg-corporate-50 rounded-xl px-6 py-3"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar
                </Button>
              )}
              {showHomeButton && (
                <Button
                  onClick={() => navigate('/')}
                  className="bg-corporate-600 hover:bg-corporate-700 text-white rounded-xl px-8 py-3 shadow-lg hover:shadow-xl transition-all"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Voltar ao Início
                </Button>
              )}
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ErrorPageLayout;
