import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  type ReactNode,
} from "react";

type LoadingContextType = {
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
};

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

interface LoadingProviderProps {
  children: ReactNode;
  loading?: boolean;
}

export function LoadingProvider({
  children,
  loading: externalLoading,
}: LoadingProviderProps) {
  const [internalLoading, setInternalLoading] = useState<boolean>(
    externalLoading ?? false
  );

  // Keep internal state in sync if external prop changes
  useEffect(() => {
    if (externalLoading !== undefined) {
      setInternalLoading(externalLoading);
    }
  }, [externalLoading]);

  return (
    <LoadingContext.Provider
      value={{ loading: internalLoading, setLoading: setInternalLoading }}
    >
      {children}
    </LoadingContext.Provider>
  );
}

export function useLoadingContext(): LoadingContextType {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error("useLoading must be used within a LoadingProvider");
  }
  return context;
}
