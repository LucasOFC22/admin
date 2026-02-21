import React from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { UnifiedAuthProvider } from './UnifiedAuthContext';
import { ThemeProvider } from './ThemeContext';
import { ModalProvider } from './ModalContext';
import { UIProvider } from './UIContext';
import { SoundNotificationProvider } from './SoundNotificationContext';
import { TooltipProvider } from '@/components/ui/tooltip';

interface AppProvidersProps {
  children: React.ReactNode;
}

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <HelmetProvider>
      <ThemeProvider>
        <TooltipProvider>
          <UnifiedAuthProvider>
            <SoundNotificationProvider>
              <UIProvider>
                <ModalProvider>
                  {children}
                </ModalProvider>
              </UIProvider>
            </SoundNotificationProvider>
          </UnifiedAuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </HelmetProvider>
  );
};