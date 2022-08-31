import { PropsWithChildren, useEffect, useRef, useState } from "react";
import { useApiClient } from "../api-client/ApiClientContext";
import { useAccount } from "./AccountProvider";

/** Applies authentication headers from the AccountProvider to the ApiClient from the ApiClientProvider. */
export function AuthenticatedApiClientProvider({
  children
}: PropsWithChildren<{}>) {
  const apiContext = useApiClient();
  const { token } = useAccount();
  const authTokenRef = useRef<string>();
  const [authSetup, setAuthSetup] = useState<boolean>(false);

  // Update the token ref on every render:
  authTokenRef.current = token;

  // Include the bearer token with every API request:
  useEffect(() => {
    // 'Interceptors' is nullable here to support the old tests written before authentication was added,
    // but in the running app it should always be available.
    apiContext.apiClient.axios.interceptors?.request.use((config) => {
      // Get the token from a Ref so the up-to-date one is always used:
      config.headers.Authorization = `Bearer ${authTokenRef.current}`;
      return config;
    });

    setAuthSetup(true);
  }, [apiContext.apiClient.axios]);

  return <>{authSetup ? children : null}</>;
}
