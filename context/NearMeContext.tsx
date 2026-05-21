// context/NearMeContext.tsx
"use client";

import { createContext, useContext, useState } from "react";

const NearMeContext = createContext<{
  nearMeTrigger: number;
  handleNearMeClick: () => void;
}>({ nearMeTrigger: 0, handleNearMeClick: () => {} });

export function NearMeProvider({ children }: { children: React.ReactNode }) {
  const [nearMeTrigger, setNearMeTrigger] = useState(0);

  const handleNearMeClick = () => {
    setNearMeTrigger((prev) => prev + 1);
  };

  return (
    <NearMeContext.Provider value={{ nearMeTrigger, handleNearMeClick }}>
      {children}
    </NearMeContext.Provider>
  );
}

export const useNearMe = () => useContext(NearMeContext);