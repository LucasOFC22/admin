import React from "react";

interface MainContainerProps {
  children: React.ReactNode;
}

const MainContainer: React.FC<MainContainerProps> = ({ children }) => {
  return (
    <div className="flex-1 p-4 h-full">
      <div className="h-full overflow-y-hidden flex flex-col">
        {children}
      </div>
    </div>
  );
};

export default MainContainer;
