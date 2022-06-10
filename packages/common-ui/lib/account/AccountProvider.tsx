import { uniq } from "lodash";
import {
  createContext,
  ReactNode,
  useContext,
  useState,
  useEffect
} from "react";
import { useQuery } from "..";
import { DinaUser } from "../../../dina-ui/types/user-api/resources/DinaUser";
import Keycloak from "keycloak-js";
import { LoadingSpinner } from "../loading-spinner/LoadingSpinner";

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
  const [keycloak, setKeycloak] = useState<Keycloak | null>(null);
  const [authenticated, setAuthenticated] = useState<boolean>(false);

  // Setup keycloak when this is first mounted.
  useEffect(() => {
    const keycloakInstance = new Keycloak("/keycloak.json");
    keycloakInstance
      .init({
        onLoad: "check-sso",
        silentCheckSsoRedirectUri:
          typeof window !== undefined
            ? `${window.location.origin}/static/silent-check-sso.xhtml`
            : undefined,
        checkLoginIframe: false
      })
      .then(keycloakAuthenticated => {
        setKeycloak(keycloakInstance);
        setAuthenticated(keycloakAuthenticated);

        // The user is not authenticated... Try again.
        if (keycloakAuthenticated === false) {
          keycloakInstance.login();
        }
      });
  }, []);

  const token = keycloak?.token;

  const tokenParsed = keycloak?.tokenParsed;

  const subject = keycloak?.subject;

  const roles = keycloak?.realmAccess?.roles ?? [];

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

  // Non-authenticated users should never see the the full website. Display a loading indicator.
  if (!authenticated) {
    return <LoadingSpinner loading={true} />;
  }

  return (
    <AccountProvider
      value={{
        agentId,
        authenticated,
        groupNames,
        initialized: keycloak !== null,
        login: keycloak?.login,
        logout: keycloak?.logout,
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
