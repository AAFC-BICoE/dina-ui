import { uniq, noop } from "lodash";
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
import axios from "axios";

export interface DevUserConfig {
  // True to skip keycloak and use dev-user config.
  enabled: boolean;

  // String separated list of keycloak formatted groups like: "/aafc/user, /bicoe/read-only"
  groupRole: string;
}

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
  const [devUserConfig, setDevUserConfig] = useState<DevUserConfig | null>(null);

  // Retrieve the dev-user configuration to see if keycloak login is required.
  useEffect(() => {
    // Check the dev-user.json endpoint generated by Caddyfile:
    const getDevUserConfig = async () => {
      try {
        const response = await axios.get(`/dev-user.json`);
        setDevUserConfig({
          enabled: response.data["enabled"],
          groupRole: response.data["groupRole"]
        });
      } catch (error) {
        // Could not retrieve the dev-user.json, setting the default to off.
        console.error(error);
        setDevUserConfig({
          enabled: false,
          groupRole: ""
        });
      }
    }
    getDevUserConfig();
  }, []);

  useEffect(() => {
    // Only run this initialization if the dev-user config has been loaded in.
    if (!devUserConfig) {
      return;
    }

    // If dev-user is enabled, skip the keycloak init:
    if (devUserConfig.enabled) {
      // Skip keycloak login.
      setAuthenticated(true);
      setInitialized(true);
      setKeycloak(null);
      return;
    }

    // Continue the normal keycloak setup and login screen.
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
  }, [devUserConfig]);

  if (devUserConfig?.enabled) {

    const username = "dev";
    const agentId = "c628fc6f-c9ad-4bb6-a187-81eb7884bdd7";
    const token = "dev-user-token";

    const { groupNames, rolesPerGroup } = parseGroupRoleDevUser(devUserConfig?.groupRole);

    return (
      <AccountProvider
        value={{
          agentId,
          authenticated,
          groupNames,
          initialized,
          login: noop,
          logout: noop,
          roles: [],
          username,
          subject: agentId,
          isAdmin: rolesPerGroup?.aafc?.includes(DINA_ADMIN) ?? false,
          rolesPerGroup,
          getCurrentToken: () => Promise.resolve(token),
        }}
      >
        {children}
      </AccountProvider>
    );
  } else if (initialized && authenticated && keycloak !== null) {
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

  // Non-authenticated users should never see the the full website. Display a loading indicator.
  return (
    <div
      className="d-flex align-items-center justify-content-center"
      style={{ marginTop: "calc(50vh - 10px)" }}
    >
      <LoadingSpinner loading={true} />
    </div>
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

interface ParseGroupRoleDevUserOutput {
  groupNames: string[];
  rolesPerGroup: any;
}

/**
 * Parses the "groupRole" string to extract group names and roles.
 * 
 * Example: "/aafc/user, /bicoe/read-only, /aafc/super-user" will return:
 * groupNames: ["aafc", "bicoe"]
 * rolesPerGroup: {
 *    aafc: ["user", "super-user"],
 *    bicoe: ["read-only"]
 * }
 * 
 * @param groupRole - The input string containing group and role information.
 * @returns Object An object containing group names and roles per group.
 */
export function parseGroupRoleDevUser(groupRole: string | null): ParseGroupRoleDevUserOutput {
  if (!groupRole || groupRole === "") {
    return {
      groupNames: [],
      rolesPerGroup: {}
    };
  }

  const groups = groupRole.split(',').map(group => group.trim().substring(1));
  const groupNames = [...new Set(groups.map(group => group.split('/')[0]))];
  const rolesPerGroup = {};

  groups.forEach(group => {
    const [groupName, role] = group.split('/');

    if (!rolesPerGroup[groupName]) {
      rolesPerGroup[groupName] = new Set(); // Use a Set to store roles
    }

    rolesPerGroup[groupName].add(role); // Add role to the Set
  });

  // Convert Sets back to arrays
  for (const groupName in rolesPerGroup) {
    rolesPerGroup[groupName] = [...rolesPerGroup[groupName]];
  }

  return { groupNames, rolesPerGroup };
}