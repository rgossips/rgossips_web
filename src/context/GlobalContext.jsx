"use client";

import { createContext, useContext, useState } from "react";

const GlobalContext = createContext(null);

export const GlobalProvider = ({ children }) => {
  const [scrollTo, setScrollTo] = useState(null);
  const [type, setType] = useState("brands");

  return (
    <GlobalContext.Provider value={{ scrollTo, type, setScrollTo, setType }}>
      {children}
    </GlobalContext.Provider>
  );
};

export const useGlobal = () => useContext(GlobalContext);
