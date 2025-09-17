import {
  createContext,
  useRef,
  useCallback,
  useContext,
  type ReactNode,
} from "react";

type SkeletonContextType = {
  getAspectRatio(): { width: number; height: number; ratio: string };
};

const SkeletonContext = createContext<SkeletonContextType | undefined>(
  undefined
);

interface SkeletonProviderProps {
  children: ReactNode;
}

const aspectRatios = [
  { width: 800, height: 1066.6667, ratio: "3/4" },
  { width: 800, height: 1422.2223, ratio: "9/16" },
  { width: 800, height: 800, ratio: "1/1" },
  { width: 800, height: 600, ratio: "4/3" },
  { width: 800, height: 450, ratio: "16/9" },
  { width: 800, height: 800, ratio: "1/1" },
];

export function SkeletonProvider({ children }: SkeletonProviderProps) {
  const index = useRef(0);
  const seed = useRef(Math.floor(Math.random() * aspectRatios.length));

  const getAspectRatio = useCallback(() => {
    const i = (seed.current + index.current) % aspectRatios.length;
    const ar = aspectRatios[i];
    index.current = index.current + 1;
    return ar;
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
