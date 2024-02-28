import { transformGlobalSearchToDSL } from "../QueryBuilderGlobalSearch";

describe("QueryBuilderGlobalSearch", () => {
  describe("transformGlobalSearchToDSL function", () => {
    test("Global search provided", async () => {
      expect(
        transformGlobalSearchToDSL({
          value: "test value",
          operation: "",
          fieldPath: "_globalSearch",
          queryType: ""
        })
      ).toMatchSnapshot();
    });

    test("Empty global search provided", async () => {
      expect(
        transformGlobalSearchToDSL({
          value: "",
          operation: "",
          fieldPath: "_globalSearch",
          queryType: ""
        })
      ).toMatchSnapshot();
    });
  });
});
