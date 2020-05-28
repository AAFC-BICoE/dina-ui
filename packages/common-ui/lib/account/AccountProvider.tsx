import {
  Persistors,
  SSRKeycloakProvider,
  useKeycloak
} from "@react-keycloak/nextjs";
import { createContext, ReactNode, useContext } from "react";

export interface AccountContextI {
  authenticated?: boolean;
  login: () => void;
  logout: () => void;
  initialized: boolean;
  token?: string;
  username?: string;
}

const AccountContext = createContext<AccountContextI | null>(null);

export const AccountProvider = AccountContext.Provider;

export function KeycloakAccountProvider({ children }: { children: ReactNode }) {
  return (
    <SSRKeycloakProvider
      // Loading the config from /keycloak.json, which is served by Caddy.
      keycloakConfig={"/keycloak.json" as any}
      // Server-side rendering config omitted because we aren't using server-side rendering.
      persistor={Persistors.Cookies({})}
      initConfig={{
        onLoad: "check-sso",
        silentCheckSsoRedirectUri: process.browser
          ? `${window.location.origin}/static/silent-check-sso.xhtml`
          : undefined
      }}
    >
      <KeycloakAccountProviderInternal>
        {children}
      </KeycloakAccountProviderInternal>
    </SSRKeycloakProvider>
  );
}

/** Exposes the needed features from the identity provider. */
export function useAccount(): AccountContextI {
  const ctx = useContext(AccountContext);
  if (!ctx) {
    throw new Error("No AccountContext available.");
  }
  return ctx;
}

/** Converts the Keycloak context to the generic AccountContextI. */
function KeycloakAccountProviderInternal({
  children
}: {
  children: ReactNode;
}) {
  const [
    { login, logout, authenticated, token, tokenParsed },
    initialized
  ] = useKeycloak();
  const username = (tokenParsed as any)?.preferred_username;

  return (
    <AccountProvider
      value={{ initialized, login, logout, authenticated, token, username }}
    >
      {children}
    </AccountProvider>
  );
}
