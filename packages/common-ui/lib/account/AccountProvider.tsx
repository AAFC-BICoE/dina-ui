import { keycloakClient } from "../keycloak/KeycloakClient";
import { uniq } from "lodash";
import { createContext, ReactNode, useContext, useState } from "react";
import { useQuery } from "..";
import { DinaUser } from "../../../dina-ui/types/user-api/resources/DinaUser";

export interface AccountContextI {
  agentId?: string;
  authenticated: boolean;
  groupNames?: string[];
  login?: () => void;
  logout?: () => void;
  initialized: boolean;
  token?: string;
  roles: string[];
  username?: string;
  subject?: string;
  isAdmin?: boolean;
  rolesPerGroup?: Record<string, string[] | undefined>;
}

const AccountContext = createContext<AccountContextI | null>(null);

export const AccountProvider = AccountContext.Provider;

export function KeycloakAccountProvider({ children }: { children: ReactNode }) {
  return (
    <KeycloakAccountProviderInternal>
      {children}
    </KeycloakAccountProviderInternal>
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
  const [initialized, setInitialized] = useState(false);

  keycloakClient
    ?.init({
      onLoad: "check-sso",
      silentCheckSsoRedirectUri:
        typeof window !== "undefined"
          ? `${window.location.origin}/static/silent-check-sso.xhtml`
          : undefined
    })
    .then(() => {
      setInitialized(true);
    });

  const token = keycloakClient?.token;

  const tokenParsed = keycloakClient?.tokenParsed;

  const subject = keycloakClient?.subject;

  const roles = keycloakClient?.realmAccess?.roles ?? [];

  const isLoggedIn: boolean = !!keycloakClient?.token;

  const {
    preferred_username: username,
    groups: keycloakGroups,
    "agent-identifier": agentId
  } = (tokenParsed as any) ?? {};

  const groupNames =
    keycloakGroups &&
    keycloakGroupNamesToBareGroupNames(keycloakGroups as string[]);

  const userQuery = useQuery<DinaUser>(
    { path: `user-api/user/${subject}` },
    { disabled: !subject }
  );

  const rolesPerGroup = userQuery.response?.data?.rolesPerGroup;

  // User is admin if they are a member of Keycloak's /aafc/dina-admin group:
  const isAdmin = rolesPerGroup?.aafc?.includes?.("dina-admin");

  return (
    <AccountProvider
      value={{
        agentId,
        authenticated: isLoggedIn,
        groupNames,
        initialized,
        login: keycloakClient?.login,
        logout: keycloakClient?.logout,
        roles,
        token,
        username,
        subject,
        isAdmin,
        rolesPerGroup
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
