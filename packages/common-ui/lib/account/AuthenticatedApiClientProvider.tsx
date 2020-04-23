import { ReactNode, useEffect, useRef } from "react";
import {
  ApiClientContext,
  ApiClientContextI
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
  const authTokenRef = useRef<string>();

  // All pages require authentication.
  // Redirect to the login page if not logged in:
  useEffect(() => {
    if (initialized && !authenticated) {
      login();
    }
  }, [authenticated, initialized]);

  // Include the bearer token with every API request:
  useEffect(() => {
    // 'Interceptors' is nullable here to support the old tests written before authentication was added,
    // but in the running app it should always be available.
    apiContext.apiClient.axios.interceptors?.request.use(config => {
      // Get the token from a Ref so the up-to-date one is always used:
      config.headers.Authorization = `Bearer ${authTokenRef.current}`;
      return config;
    });
  }, [apiContext.apiClient.axios]);

  // Update the token ref when useAccount's token changes:
  useEffect(() => {
    authTokenRef.current = token;
  }, [token]);

  return (
    <ApiClientContext.Provider value={apiContext}>
      {authenticated && initialized ? children : null}
    </ApiClientContext.Provider>
  );
}
