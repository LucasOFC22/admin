import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCookieStore } from '@/stores/cookieStore';

export const CookieConsentBanner: React.FC = () => {
  const { showBanner, hasConsented, acceptCookies, hideBanner } = useCookieStore();

  // Não mostrar banner se o usuário já consentiu
  if (!showBanner || hasConsented) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ 
          type: "spring",
          stiffness: 300,
          damping: 30,
          opacity: { duration: 0.2 }
        }}
        className="fixed bottom-0 left-0 right-0 z-50 p-4"
      >
        <div className="mx-auto max-w-4xl">
          <div className="bg-background/95 backdrop-blur-sm rounded-xl border border-border shadow-lg">
            <div className="p-4">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                
                {/* Icon e Conteúdo */}
                <div className="flex items-start gap-3 flex-1">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Cookie className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-foreground mb-1">
                      Cookies Necessários
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Utilizamos apenas cookies essenciais para garantir o funcionamento do site e manter você autenticado.
                    </p>
                  </div>
                </div>

                {/* Botões */}
                <div className="flex gap-2 w-full md:w-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={hideBanner}
                    className="flex items-center gap-1.5 text-xs h-9 px-3 flex-1 md:flex-none"
                  >
                    <X className="h-3.5 w-3.5" />
                    Fechar
                  </Button>
                  
                  <Button
                    size="sm"
                    onClick={acceptCookies}
                    className="flex items-center gap-1.5 text-xs h-9 px-3 flex-1 md:flex-none"
                  >
                    <Check className="h-3.5 w-3.5" />
                    Aceitar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
