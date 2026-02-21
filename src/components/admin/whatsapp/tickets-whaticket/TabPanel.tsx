import React, { ReactNode } from 'react';

interface TabPanelProps {
  children: ReactNode;
  value: string;
  currentValue: string;
}

export const TabPanel: React.FC<TabPanelProps> = ({ children, value, currentValue }) => {
  if (value !== currentValue) return null;
  return <div className="flex-1 flex flex-col min-h-0">{children}</div>;
};
