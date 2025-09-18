import { createContext, useCallback, useContext, type ReactNode } from "react";

type SkeletonContextType = {
  getAspectRatio(seed: string): { width: number; height: number };
};

const SkeletonContext = createContext<SkeletonContextType | undefined>(
  undefined
);

interface SkeletonProviderProps {
  children: ReactNode;
}

function hashSeed(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return Math.abs(h);
}

const aspectRatios = [
  { width: 800, height: 1066.6667 },
  { width: 800, height: 1422.2223 },
  { width: 800, height: 800 },
  { width: 800, height: 600 },
  { width: 800, height: 450 },
  { width: 800, height: 800 },
];

export function SkeletonProvider({ children }: SkeletonProviderProps) {
  const getAspectRatio = useCallback((seed: string) => {
    return aspectRatios[hashSeed(seed) % aspectRatios.length];
  }, []);

  return (
    <SkeletonContext.Provider value={{ getAspectRatio }}>
      {children}
    </SkeletonContext.Provider>
  );
}

export function useSkeletonContext(): SkeletonContextType {
  const context = useContext(SkeletonContext);
  if (!context) {
    throw new Error("useLoading must be used within a SkeletonProvider");
  }
  return context;
}
