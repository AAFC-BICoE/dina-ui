import { DINA_ADMIN, USER } from "../../../types/DinaRoles";
import {
  keycloakGroupNamesToBareGroupNames,
  generateKeycloakRolesPerGroup
} from "../AccountProvider";

describe("AccountProvider", () => {
  // Keycloak test data
  const keycloakGroups = [
    "/cnc/" + DINA_ADMIN,
    "/cnc/" + USER,
    "/aafc/" + USER,
    "/othergroup",
    "no-leading-slash"
  ];

  it("Converts Keycloak's group names to bare group names.", () => {
    const bareGroupNames = keycloakGroupNamesToBareGroupNames(keycloakGroups);

    expect(bareGroupNames).toEqual([
      "cnc",
      "aafc",
      "othergroup",
      "no-leading-slash"
    ]);
  });

  it("Converts keycloak group + role name string into a unique key and values.", () => {
    const rolesPerGroup = generateKeycloakRolesPerGroup(keycloakGroups);

    expect(rolesPerGroup).toEqual({
      aafc: [USER],
      cnc: [DINA_ADMIN, USER]
    });
  });
});
