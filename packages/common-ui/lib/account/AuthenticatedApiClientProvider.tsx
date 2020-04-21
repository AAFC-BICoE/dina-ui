import { ReactNode, useEffect } from "react";
import {
  ApiClientContext,
  ApiClientContextConfig,
  createContextValue
} from "../api-client/ApiClientContext";
import { useAccount } from "./AccountProvider";

interface AuthenticatedApiClientProviderProps {
  apiClientContextConfig: ApiClientContextConfig;
  children: ReactNode;
}

export function AuthenticatedApiClientProvider({
  children,
  apiClientContextConfig
}: AuthenticatedApiClientProviderProps) {
  const { authenticated, initialized, login, token } = useAccount();

  // All pages require authentication.
  // Redirect to the login page if not logged in:
  useEffect(() => {
    if (initialized && !authenticated) {
      login();
    }
  }, [authenticated, initialized]);

  const apiContext = createContextValue(apiClientContextConfig);

  // Include the bearer token with every API request:
  apiContext.apiClient.axios.interceptors.request.use(config => {
    config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  return (
    <ApiClientContext.Provider value={apiContext}>
      {children}
    </ApiClientContext.Provider>
  );
}
