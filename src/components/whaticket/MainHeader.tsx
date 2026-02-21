import React from "react";

interface MainHeaderProps {
  children: React.ReactNode;
}

const MainHeader: React.FC<MainHeaderProps> = ({ children }) => {
  return (
    <div className="flex items-center p-2 pb-3">
      {children}
    </div>
  );
};

export default MainHeader;
