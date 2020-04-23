import { ReactNode, useEffect } from "react";
import {
  ApiClientContext,
  ApiClientContextConfig,
  ApiClientContextI,
  createContextValue
} from "../api-client/ApiClientContext";
import { useAccount } from "./AccountProvider";

interface AuthenticatedApiClientProviderProps {
  apiContext: ApiClientContextI;
  children: ReactNode;
}

export function AuthenticatedApiClientProvider({
  apiContext,
  children
}: AuthenticatedApiClientProviderProps) {
  const { authenticated, initialized, login, token } = useAccount();

  // All pages require authentication.
  // Redirect to the login page if not logged in:
  useEffect(() => {
    if (initialized && !authenticated) {
      login();
    }
  }, [authenticated, initialized]);

  // Include the bearer token with every API request.
  // 'Interceptors' is nullable here to support the old tests written before authentication was added,
  // but in the running app it should always be available.
  apiContext.apiClient.axios.interceptors?.request.use(config => {
    config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  return (
    <ApiClientContext.Provider value={apiContext}>
      {children}
    </ApiClientContext.Provider>
  );
}
