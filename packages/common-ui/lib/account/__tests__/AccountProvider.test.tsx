import { keycloakGroupNamesToBareGroupNames } from "../AccountProvider";

describe("AccountProvider", () => {
  it("Converts Keycloak's group names to bare group names.", () => {
    const keycloakGroups = [
      "/cnc/admin",
      "/cnc/staff",
      "/aafc/staff",
      "/othergroup",
      "no-leading-slash"
    ];
    const bareGroupNames = keycloakGroupNamesToBareGroupNames(keycloakGroups);
    expect(bareGroupNames).toEqual([
      "cnc",
      "aafc",
      "othergroup",
      "no-leading-slash"
    ]);
  });
});
