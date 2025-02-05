import { DINA_ADMIN, USER } from "../../../types/DinaRoles";
import {
  keycloakGroupNamesToBareGroupNames,
  generateKeycloakRolesPerGroup,
  checkIsAdmin
} from "../AccountProvider";

describe("AccountProvider component", () => {
  describe("keycloakGroupNamesToBareGroupNames function", () => {
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

  describe("checkIsAdmin function", () => {
    it("Contains the dina-admin group, return true", () => {
      // Keycloak test data
      const testGroupRoles = [
        "/cnc/" + USER,
        "/aafc/" + USER,
        "/othergroup",
        DINA_ADMIN
      ];

      expect(checkIsAdmin(testGroupRoles)).toEqual(true);
    });

    it("Does not contain the dina-admin group at root, return false", () => {
      // Keycloak test data
      const testGroupRoles = [
        "/cnc/" + DINA_ADMIN,
        "/aafc/" + USER,
        "/othergroup"
      ];

      expect(checkIsAdmin(testGroupRoles)).toEqual(false);
    });
  });
});
