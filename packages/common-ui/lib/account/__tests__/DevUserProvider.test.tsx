import { parseGroupRoleDevUser } from "../DevUserProvider";

describe("DevUserProvider", () => {
  describe("parseGroupRoleDevUser function", () => {
    it("should correctly parse groupRole string and return group names and roles", () => {
      const groupRoleString = "/aafc/user, /bicoe/read-only, /aafc/admin";
      const expectedResult = {
        groupNames: ["aafc", "bicoe"],
        rolesPerGroup: {
          aafc: ["user", "admin"],
          bicoe: ["read-only"],
        },
      };

      const result = parseGroupRoleDevUser(groupRoleString);
      expect(result).toEqual(expectedResult);
    });

    it("should remove duplicates from groupNames array", () => {
      const groupRoleString = "/aafc/user, /bicoe/read-only, /aafc/user";
      const expectedResult = {
        groupNames: ["aafc", "bicoe"],
        rolesPerGroup: {
          aafc: ["user"],
          bicoe: ["read-only"],
        },
      };

      const result = parseGroupRoleDevUser(groupRoleString);
      expect(result).toEqual(expectedResult);
    });

    it("if only one group and role is provided it should correctly parse it", () => {
      const groupRoleString = "/aafc/user";
      const expectedResult = {
        groupNames: ["aafc"],
        rolesPerGroup: {
          aafc: ["user"]
        },
      };

      const result = parseGroupRoleDevUser(groupRoleString);
      expect(result).toEqual(expectedResult);
    });

    it("should handle an empty groupRole string and return empty group names and roles", () => {
      const groupRoleString = "";
      const expectedResult = {
        groupNames: [],
        rolesPerGroup: {},
      };

      const result1 = parseGroupRoleDevUser(groupRoleString);
      const result2 = parseGroupRoleDevUser(null);
      expect(result1).toEqual(expectedResult);
      expect(result2).toEqual(expectedResult);
    });
  });
});