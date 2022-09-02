import { PropsWithChildren, useEffect, useRef, useState } from "react";
import { useApiClient } from "../api-client/ApiClientContext";
import { useAccount } from "./AccountProvider";

/** Applies authentication headers from the AccountProvider to the ApiClient from the ApiClientProvider. */
export function AuthenticatedApiClientProvider({
  children
}: PropsWithChildren<{}>) {
  const apiContext = useApiClient();
  const { updateToken, getCurrentToken } = useAccount();
  const [authSetup, setAuthSetup] = useState<boolean>(false);

  // Include the bearer token with every API request:
  useEffect(() => {
    // 'Interceptors' is nullable here to support the old tests written before authentication was added,
    // but in the running app it should always be available.
    apiContext.apiClient.axios.interceptors?.request.use((config) => {
      const onSuccessfulTokenUpdate = () => {
        config.headers.Authorization = `Bearer ${getCurrentToken()}`;
        return Promise.resolve(config);
      };

      return updateToken(onSuccessfulTokenUpdate);
    });

    setAuthSetup(true);
  }, [apiContext.apiClient.axios]);

  return <>{authSetup ? children : null}</>;
}
