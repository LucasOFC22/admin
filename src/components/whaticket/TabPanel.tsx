import React from "react";

interface TabPanelProps {
  children: React.ReactNode;
  value: string;
  name: string;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, name }) => {
  if (value === name) {
    return (
      <div
        role="tabpanel"
        id={`simple-tabpanel-${name}`}
        aria-labelledby={`simple-tab-${name}`}
      >
        {children}
      </div>
    );
  }
  return null;
};

export default TabPanel;
