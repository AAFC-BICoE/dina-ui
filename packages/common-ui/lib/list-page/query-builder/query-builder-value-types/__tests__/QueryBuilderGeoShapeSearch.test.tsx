import { transformGeoShapeToDSL } from "../QueryBuilderGeoShapeSearch";

describe("QueryBuilderGeoShapeSearch", () => {
  describe("transformGeoShapeToDSL function", () => {
    const operators = ["intersects", "within", "contains", "disjoint"] as const;

    const sampleShape = [
      [
        [100.0, 0.0],
        [101.0, 0.0],
        [101.0, 1.0],
        [100.0, 1.0],
        [100.0, 0.0]
      ]
    ];

    test("All operators non-nested", () => {
      const results = Object.fromEntries(
        operators.map((op) => [
          op,
          transformGeoShapeToDSL({
            value: JSON.stringify({
              selectedOperator: op,
              searchShape: sampleShape
            }),
            fieldPath: "geometry",
            fieldInfo: {} as any,
            operation: "",
            queryType: ""
          })
        ])
      );

      expect(results).toMatchSnapshot();
    });

    test("All operators nested", () => {
      const results = Object.fromEntries(
        operators.map((op) => [
          op,
          transformGeoShapeToDSL({
            value: JSON.stringify({
              selectedOperator: op,
              searchShape: sampleShape
            }),
            fieldPath: "geometry",
            fieldInfo: { parentType: "some-parent" } as any,
            operation: "",
            queryType: ""
          })
        ])
      );

      expect(results).toMatchSnapshot();
    });

    test("Empty shape returns empty query", () => {
      const result = transformGeoShapeToDSL({
        value: JSON.stringify({
          selectedOperator: "intersects",
          searchShape: []
        }),
        fieldPath: "geometry",
        fieldInfo: {} as any,
        operation: "",
        queryType: ""
      });

      expect(result).toEqual({});
    });
  });
});
