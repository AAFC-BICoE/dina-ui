import { PropsWithChildren, useEffect, useRef } from "react";
import { useApiClient } from "../api-client/ApiClientContext";
import { COMMON_UI_MESSAGES_ENGLISH } from "../intl/common-ui-en";
import { COMMON_UI_MESSAGES_FR } from "../intl/common-ui-fr";
import { getIntlSupport } from "../intl/IntlSupport";
import { useAccount } from "./AccountProvider";

/** Applies authentication headers from the AccountProvider to the ApiClient from the ApiClientProvider. */
export function AuthenticatedApiClientProvider({
  children
}: PropsWithChildren<{}>) {
  const apiContext = useApiClient();
  const en = { ...COMMON_UI_MESSAGES_ENGLISH };
  const fr = { ...COMMON_UI_MESSAGES_FR };
  const { useIntl } = getIntlSupport({
    defaultMessages: en,
    translations: { en, fr }
  });
  const { formatMessage } = useIntl();
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

    apiContext.apiClient.axios.interceptors?.response.use(
      response => {
        return response;
      },
      error => {
        error = formatMessage("waitForAuthenticationMsg");
        return Promise.reject(error);
      }
    );
  }, [apiContext.apiClient.axios]);

  // Update the token ref when useAccount's token changes:
  useEffect(() => {
    authTokenRef.current = token;
  }, [token]);

  return <>{authenticated && initialized ? children : null}</>;
}
