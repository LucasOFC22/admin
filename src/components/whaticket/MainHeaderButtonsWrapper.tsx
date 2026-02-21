import React from "react";

interface MainHeaderButtonsWrapperProps {
  children: React.ReactNode;
  className?: string;
}

const MainHeaderButtonsWrapper: React.FC<MainHeaderButtonsWrapperProps> = ({ 
  children, 
  className = "" 
}) => {
  return (
    <div className={`flex-none ml-auto space-x-2 ${className}`}>
      {children}
    </div>
  );
};

export default MainHeaderButtonsWrapper;
