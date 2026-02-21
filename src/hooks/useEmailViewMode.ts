import { useState, useEffect, useCallback } from 'react';

type ViewMode = 'normal' | 'compact';

const STORAGE_KEY = 'email-view-mode';

export function useEmailViewMode() {
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'normal' || stored === 'compact') {
        return stored;
      }
    }
    return 'normal';
  });

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, viewMode);
  }, [viewMode]);

  const toggleViewMode = useCallback(() => {
    setViewMode(prev => prev === 'normal' ? 'compact' : 'normal');
  }, []);

  return {
    viewMode,
    setViewMode,
    toggleViewMode,
    isCompact: viewMode === 'compact',
  };
}
