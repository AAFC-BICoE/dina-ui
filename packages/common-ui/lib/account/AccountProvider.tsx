import { uniq } from "lodash";
import {
  createContext,
  ReactNode,
  useContext,
  useState,
  useEffect
} from "react";
import Keycloak from "keycloak-js";
import { LoadingSpinner } from "../loading-spinner/LoadingSpinner";
import { DINA_ADMIN } from "../../types/DinaRoles";

export interface AccountContextI {
  agentId?: string;
  authenticated: boolean;
  groupNames?: string[];
  login: () => void;
  logout: () => void;
  initialized: boolean;
  roles: string[];
  username?: string;
  subject?: string;
  isAdmin?: boolean;
  rolesPerGroup?: Record<string, string[] | undefined>;
  getCurrentToken: () => Promise<string | undefined>;
}

const AccountContext = createContext<AccountContextI | null>(null);

export const AccountProvider = AccountContext.Provider;

/** Exposes the needed features from the identity provider. */
export function useAccount(): AccountContextI {
  const ctx = useContext(AccountContext);
  if (!ctx) {
    throw new Error("No AccountContext available.");
  }
  return ctx;
}

/** Converts the Keycloak context to the generic AccountContextI. */
export function KeycloakAccountProvider({ children }: { children: ReactNode }) {
  const [keycloak, setKeycloak] = useState<Keycloak | null>(null);
  const [authenticated, setAuthenticated] = useState<boolean>(false);
  const [initialized, setInitialized] = useState<boolean>(false);

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
      .then((keycloakAuthenticated) => {
        setKeycloak(keycloakInstance);
        setAuthenticated(keycloakAuthenticated);

        // The user is not authenticated... Try again.
        if (keycloakAuthenticated === false) {
          keycloakInstance.login();
        } else {
          setInitialized(true);
        }
      });
  }, []);

  // Non-authenticated users should never see the the full website. Display a loading indicator.
  if (!authenticated || !initialized || !keycloak) {
    return (
      <div
        className="d-flex align-items-center justify-content-center"
        style={{ marginTop: "calc(50vh - 10px)" }}
      >
        <LoadingSpinner loading={true} />
      </div>
    );
  }

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

  const rolesPerGroup = generateKeycloakRolesPerGroup(
    keycloakGroups as string[]
  );

  const login = keycloak.login;

  const logout = keycloak.logout;

  const getCurrentToken = async () => {
    // If it expires in the next 30 seconds, generate a new one.
    await keycloak.updateToken(30).catch(login);
    return keycloak.token;
  };

  return (
    <AccountProvider
      value={{
        agentId,
        authenticated,
        groupNames,
        initialized,
        login,
        logout,
        roles,
        username,
        subject,
        isAdmin: rolesPerGroup?.aafc?.includes(DINA_ADMIN) ?? false,
        rolesPerGroup,
        getCurrentToken
      }}
    >
      {children}
    </AccountProvider>
  );
}

/**
 * Convert from Keycloak's format ( ["/cnc", "/cnc/user"] to just the group name ["cnc"] )
 */
export function keycloakGroupNamesToBareGroupNames(keycloakGroups: string[]) {
  return uniq(
    keycloakGroups
      // Add leading slash if absent:
      .map((groupName) =>
        groupName.startsWith("/") ? groupName : `/${groupName}`
      )
      // Get only the group name immediately after the first slash:
      .map((groupName) => groupName.split("/")[1])
  );
}

/**
 * Takes an array of role group paths and combines it into a unique records.
 *
 * If only the role is provided, then it will be ignored.
 *
 * Example:
 * From:
 * Example ["/group1/role1", "/group1/role2/", "/group2/role1", "role3"]
 *
 * To:
 * ["group1": ["role1", "role2"], "group2": ["role1"]]
 *
 * @param keycloakGroups string keycloak paths of the group and role.
 * @returns unique keys of the group, with the roles for each value.
 */
export function generateKeycloakRolesPerGroup(
  keycloakGroups: string[]
): Record<string, string[] | undefined> | undefined {
  if (!keycloakGroups) {
    return;
  }

  return keycloakGroups.reduce((previousValue, currentPath) => {
    const splitPaths = currentPath.split("/").filter((path) => path);

    // If only the role was provided, ignore it.
    if (splitPaths.length !== 2) {
      return previousValue;
    }

    // The group (example: "aafc")
    const group = splitPaths[0];

    // The role (example: "dina-admin")
    const role = splitPaths[1];

    previousValue[group] = [...(previousValue[group] ?? []), role];
    return previousValue;
  }, {} as Record<string, string[] | undefined>);
}
