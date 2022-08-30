import {
  keycloakGroupNamesToBareGroupNames,
  generateKeycloakRolesPerGroup
} from "../AccountProvider";

describe("AccountProvider", () => {
  // Keycloak test data
  const keycloakGroups = [
    "/cnc/admin",
    "/cnc/staff",
    "/aafc/staff",
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
      aafc: ["staff"],
      cnc: ["admin", "staff"]
    });
  });
});
