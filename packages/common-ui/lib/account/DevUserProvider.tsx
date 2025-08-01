import { ReactNode, useEffect, useState } from "react";
import axios from "axios";
import { AccountProvider } from "./AccountProvider";
import _ from "lodash";
import { DINA_ADMIN } from "common-ui/types/DinaRoles";
import { LoadingSpinner } from "../loading-spinner/LoadingSpinner";
import { useInstanceContext } from "../instance/useInstanceContext";

export function DevUserAccountProvider({
  children
}: {
  children: ReactNode;
}): JSX.Element {
  const instanceContext = useInstanceContext();

  const [devModeEnabled, setDevModeEnabled] = useState<boolean | null>(null);
  const [keycloakEnabled, setKeycloakEnabled] = useState<boolean | null>(null);
  const [groupRole, setGroupRole] = useState<string | null>(null);

  // Retrieve the dev-user configuration to see if keycloak login is required.
  useEffect(() => {
    // Check the dev-user.json endpoint generated by Caddyfile:
    const getDevUserConfig = async () => {
      try {
        const response = await axios.get(`/dev-user.json`);
        setDevModeEnabled(response.data["devUserEnabled"]);
        setKeycloakEnabled(response.data["keycloakEnabled"]);
        setGroupRole(response.data["groupRole"]);
      } catch {
        setDevModeEnabled(false);
        setKeycloakEnabled(true);
      }
    };

    if (instanceContext !== undefined && keycloakEnabled === null) {
      // Dev-user should only be enabled if using "developer" instance mode.
      if (instanceContext.instanceMode === "developer") {
        getDevUserConfig();
      } else {
        // Use keycloak in this case.
        setDevModeEnabled(false);
        setKeycloakEnabled(true);
      }
    }
  }, [instanceContext]);

  // Check if in dev environment first.
  if (process.env.NODE_ENV !== "development" || devModeEnabled === false) {
    // Skip this component and continue down the _app chain.
    return <>{children}</>;
  }

  // If dev user is enabled at this point then we can mock the account provider with the dev user.
  if (devModeEnabled) {
    // Check for configuration issue, report it to the developer.
    if (keycloakEnabled) {
      return (
        <p>
          Invalid DINA-UI environment variables provided. In order for the
          dev-user option to be enabled, keycloak needs to be disabled.
        </p>
      );
    }

    const username = "dev";
    const agentId = "c628fc6f-c9ad-4bb6-a187-81eb7884bdd7";
    const token = "dev-user-token";

    const { groupNames, rolesPerGroup } = parseGroupRoleDevUser(groupRole);

    return (
      <AccountProvider
        value={{
          agentId,
          authenticated: true,
          groupNames,
          initialized: true,
          login: _.noop,
          logout: _.noop,
          roles: [],
          username,
          subject: agentId,
          isAdmin: rolesPerGroup?.aafc?.includes(DINA_ADMIN) ?? false,
          rolesPerGroup,
          getCurrentToken: () => Promise.resolve(token)
        }}
      >
        {children}
      </AccountProvider>
    );
  }

  // Display a loading indicator since we are waiting for the API request if at this point.
  return (
    <div
      className="d-flex align-items-center justify-content-center"
      style={{ marginTop: "calc(50vh - 10px)" }}
    >
      <LoadingSpinner loading={true} />
    </div>
  );
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
export function parseGroupRoleDevUser(
  groupRole: string | null
): ParseGroupRoleDevUserOutput {
  if (!groupRole || groupRole === "") {
    return {
      groupNames: [],
      rolesPerGroup: {}
    };
  }

  const groups = groupRole.split(",").map((group) => group.trim().substring(1));
  const groupNames = [...new Set(groups.map((group) => group.split("/")[0]))];
  const rolesPerGroup = {};

  groups.forEach((group) => {
    const [groupName, role] = group.split("/");

    if (!rolesPerGroup[groupName]) {
      rolesPerGroup[groupName] = new Set(); // Use a Set to store roles
    }

    rolesPerGroup[groupName].add(role); // Add role to the Set
  });

  // Convert Sets back to arrays
  for (const groupName in rolesPerGroup) {
    if (groupName) {
      rolesPerGroup[groupName] = [...rolesPerGroup[groupName]];
    }
  }

  return { groupNames, rolesPerGroup };
}
