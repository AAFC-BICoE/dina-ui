import {
  Persistors,
  SSRKeycloakProvider,
  useKeycloak
} from "@react-keycloak/nextjs";
import { uniq } from "lodash";
import { createContext, ReactNode, useContext } from "react";

export interface AccountContextI {
  agentId?: string;
  authenticated?: boolean;
  groupNames?: string[];
  login: () => void;
  logout: () => void;
  initialized: boolean;
  token?: string;
  roles: string[];
  username?: string;
  subject?: string;
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
    { login, logout, authenticated, token, realmAccess, tokenParsed, subject },
    initialized
  ] = useKeycloak();

  const {
    preferred_username: username,
    groups: keycloakGroups,
    "agent-identifier": agentId
  } = (tokenParsed as any) ?? {};

  const groupNames =
    keycloakGroups &&
    keycloakGroupNamesToBareGroupNames(keycloakGroups as string[]);

  return (
    <AccountProvider
      value={{
        agentId,
        authenticated,
        groupNames,
        initialized,
        login,
        logout,
        roles: realmAccess?.roles ?? [],
        token,
        username,
        subject
      }}
    >
      {children}
    </AccountProvider>
  );
}

/**
 * Convert from Keycloak's format ( ["/cnc", "/cnc/staff"] to just the group name ["cnc"] )
 */
export function keycloakGroupNamesToBareGroupNames(keycloakGroups: string[]) {
  return uniq(
    keycloakGroups
      // Add leading slash if absent:
      .map(groupName =>
        groupName.startsWith("/") ? groupName : `/${groupName}`
      )
      // Get only the group name immediately after the first slash:
      .map(groupName => groupName.split("/")[1])
  );
}
