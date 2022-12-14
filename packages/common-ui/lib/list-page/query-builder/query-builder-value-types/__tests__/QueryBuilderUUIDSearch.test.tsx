import { transformUUIDSearchToDSL } from "../QueryBuilderUUIDSearch";

describe("QueryBuilderUUIDSearch", () => {
  describe("transformUUIDSearchToDSL function", () => {
    test("Field path and value provided", async () => {
      expect(
        transformUUIDSearchToDSL({
          fieldPath: "field_path_test",
          value: "value_test"
        })
      ).toMatchSnapshot();
    });
  });
});
