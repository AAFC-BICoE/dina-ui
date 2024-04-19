import { mountWithAppContext2 } from "common-ui/lib/test-util/mock-app-context";
import QueryBuilderBooleanSearch, {
  transformBooleanSearchToDSL
} from "../QueryBuilderBooleanSearch";
import { DinaForm } from "common-ui/lib/formik-connected/DinaForm";

describe("QueryBuilderBooleanSearch", () => {
  describe("QueryBuilderBooleanSearch Component", () => {
    it("Display field if match type is equals", async () => {
      // This test will just ensure the layout does not change unexpectedly.
      // Any changes to the layout, the snapshots will need to be updated.
      const boolSearchEquals = mountWithAppContext2(
        <DinaForm initialValues={{}}>
          <QueryBuilderBooleanSearch
            matchType="equals"
            value="test"
            setValue={jest.fn}
          />
        </DinaForm>
      );

      // Expect a snapshot with the text field being displayed.
      expect(boolSearchEquals.asFragment()).toMatchSnapshot(
        "Expect boolean field to be displayed since match type is equals"
      );

      const boolSearchEmpty = mountWithAppContext2(
        <DinaForm initialValues={{}}>
          <QueryBuilderBooleanSearch
            matchType="empty"
            value="test"
            setValue={jest.fn}
          />
        </DinaForm>
      );

      // Expect a snapshot without the text field being displayed.
      expect(boolSearchEmpty.asFragment()).toMatchSnapshot(
        "Expect boolean field not to be displayed since the match type is not equals"
      );
    });
  });

  describe("transformBooleanSearchToDSL function", () => {
    describe("Empty operation", () => {
      test("With relationship as field", async () => {
        expect(
          transformBooleanSearchToDSL({
            operation: "empty",
            value: "",
            fieldInfo: {
              parentType: "collection",
              parentName: "collection"
            } as any,
            fieldPath: "includes.name",
            queryType: "empty"
          })
        ).toMatchSnapshot();
      });

      test("Normal field", async () => {
        expect(
          transformBooleanSearchToDSL({
            operation: "empty",
            value: "",
            fieldInfo: {} as any,
            fieldPath: "data.attributes.booleanField",
            queryType: "empty"
          })
        ).toMatchSnapshot();
      });
    });

    describe("Not empty operation", () => {
      test("With relationship as field", async () => {
        expect(
          transformBooleanSearchToDSL({
            operation: "notEmpty",
            value: "",
            fieldInfo: {
              parentType: "collection",
              parentName: "collection"
            } as any,
            fieldPath: "includes.name",
            queryType: "notEmpty"
          })
        ).toMatchSnapshot();
      });

      test("Normal field", async () => {
        expect(
          transformBooleanSearchToDSL({
            operation: "notEmpty",
            value: "",
            fieldInfo: {} as any,
            fieldPath: "data.attributes.booleanField",
            queryType: "notEmpty"
          })
        ).toMatchSnapshot();
      });
    });

    describe("Equals operation", () => {
      test("With relationship as field", async () => {
        expect(
          transformBooleanSearchToDSL({
            operation: "equals",
            value: "false",
            fieldInfo: {
              parentType: "collection",
              parentName: "collection"
            } as any,
            fieldPath: "includes.name",
            queryType: "equals"
          })
        ).toMatchSnapshot();
      });

      test("Normal field", async () => {
        expect(
          transformBooleanSearchToDSL({
            operation: "equals",
            value: "true",
            fieldInfo: {} as any,
            fieldPath: "data.attributes.booleanField",
            queryType: "equals"
          })
        ).toMatchSnapshot();
      });
    });

    describe("Edge cases", () => {
      test("If no field value is provided, nothing should be generated.", async () => {
        expect(
          transformBooleanSearchToDSL({
            operation: "exactMatch",
            value: "false",
            fieldInfo: undefined,
            fieldPath: "includes.name",
            queryType: "exactMatch"
          })
        ).toMatchSnapshot();
      });
    });
  });
});
