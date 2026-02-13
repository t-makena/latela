import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { useLocation } from "react-router-dom";

interface FloatingChatContextType {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

const FloatingChatContext = createContext<FloatingChatContextType | undefined>(undefined);

export const FloatingChatProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  return (
    <FloatingChatContext.Provider value={{ isOpen, open, close, toggle }}>
      {children}
    </FloatingChatContext.Provider>
  );
};

export const useFloatingChat = () => {
  const ctx = useContext(FloatingChatContext);
  if (!ctx) throw new Error("useFloatingChat must be used within FloatingChatProvider");
  return ctx;
};
