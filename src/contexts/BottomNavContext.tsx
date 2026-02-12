import React, { createContext, useContext, useState } from "react";

interface BottomNavContextValue {
  isVisible: boolean;
  setIsVisible: (visible: boolean) => void;
}

const BottomNavContext = createContext<BottomNavContextValue | undefined>(undefined);

export const BottomNavProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isVisible, setIsVisible] = useState(true);

  return (
    <BottomNavContext.Provider value={{ isVisible, setIsVisible }}>
      {children}
    </BottomNavContext.Provider>
  );
};

export const useBottomNav = () => {
  const context = useContext(BottomNavContext);
  if (!context) {
    throw new Error("useBottomNav must be used within BottomNavProvider");
  }
  return context;
};
