import { generateColumnPath } from "../ColumnSelectorUtils";

describe("ColumnSelectorUtils", () => {
  describe("generateColumnPath", () => {
    it("Generate managed attribute path", () => {
      expect(
        generateColumnPath({
          indexMapping: {
            dynamicField: {
              type: "managedAttribute",
              label: "managedAttributes",
              component: "MATERIAL_SAMPLE",
              path: "data.attributes.managedAttributes",
              apiEndpoint: "collection-api/managed-attribute"
            },
            value: "data.attributes.managedAttributes",
            distinctTerm: false,
            label: "managedAttributes",
            path: "data.attributes.managedAttributes",
            type: "managedAttribute",
            keywordMultiFieldSupport: false,
            keywordNumericSupport: false,
            optimizedPrefix: false,
            containsSupport: false,
            endsWithSupport: false,
            hideField: false
          },
          dynamicFieldValue: `{"searchValue":"","selectedOperator":"exactMatch","selectedManagedAttribute":{"id":"01905a45-eddb-7202-87d7-878dab4107d2","type":"managed-attribute","name":"MaterialSample","key":"managed_attribute_key","vocabularyElementType":"STRING","unit":null,"managedAttributeComponent":"MATERIAL_SAMPLE","acceptedValues":null,"createdOn":"2024-06-27T15:17:30.784462Z","createdBy":"dina-admin","group":"aafc","multilingualDescription":{"descriptions":[]}},"selectedType":"STRING"}`
        })
      ).toEqual("managedAttribute/MATERIAL_SAMPLE/managed_attribute_key");

      expect(
        generateColumnPath({
          indexMapping: {
            dynamicField: {
              type: "managedAttribute",
              label: "managedAttributes",
              component: "COLLECTING_EVENT",
              path: "included.attributes.managedAttributes",
              apiEndpoint: "collection-api/managed-attribute"
            },
            parentName: "collectingEvent",
            parentPath: "included",
            parentType: "collecting-event",
            value: "included.attributes.managedAttributes_collectingEvent",
            distinctTerm: false,
            label: "managedAttributes",
            path: "included.attributes.managedAttributes",
            type: "managedAttribute",
            keywordMultiFieldSupport: false,
            keywordNumericSupport: false,
            optimizedPrefix: false,
            containsSupport: false,
            endsWithSupport: false,
            hideField: false
          },
          dynamicFieldValue: `{"searchValue":"","selectedOperator":"exactMatch","selectedManagedAttribute":{"id":"01905a46-17bb-74ef-a2f5-3e801d52433d","type":"managed-attribute","name":"CollectingEvent","key":"collecting_event_managed_attribute_key","vocabularyElementType":"STRING","unit":null,"managedAttributeComponent":"COLLECTING_EVENT","acceptedValues":null,"createdOn":"2024-06-27T15:17:41.436807Z","createdBy":"dina-admin","group":"aafc","multilingualDescription":{"descriptions":[]}},"selectedType":"STRING"}`
        })
      ).toEqual(
        "managedAttribute/COLLECTING_EVENT/collecting_event_managed_attribute_key"
      );
    });

    it("Generate field extension path", () => {
      expect(
        generateColumnPath({
          indexMapping: {
            dynamicField: {
              type: "fieldExtension",
              label: "fieldExtensions",
              component: "MATERIAL_SAMPLE",
              path: "data.attributes.extensionValues",
              apiEndpoint: "collection-api/extension"
            },
            value: "data.attributes.extensionValues",
            distinctTerm: false,
            label: "fieldExtensions",
            path: "data.attributes.extensionValues",
            type: "fieldExtension",
            keywordMultiFieldSupport: false,
            keywordNumericSupport: false,
            optimizedPrefix: false,
            containsSupport: false,
            endsWithSupport: false,
            hideField: false
          },
          dynamicFieldValue: `{"selectedExtension":"agronomy_ontology_v1","selectedField":"crop","searchValue":"","selectedOperator":"exactMatch"}`
        })
      ).toEqual("fieldExtension/MATERIAL_SAMPLE/agronomy_ontology_v1/crop");

      expect(
        generateColumnPath({
          indexMapping: {
            dynamicField: {
              type: "fieldExtension",
              label: "fieldExtensions",
              component: "COLLECTING_EVENT",
              path: "included.attributes.extensionValues",
              apiEndpoint: "collection-api/extension"
            },
            parentName: "collectingEvent",
            parentPath: "included",
            parentType: "collecting-event",
            value: "included.attributes.extensionValues_collectingEvent",
            distinctTerm: false,
            label: "fieldExtensions",
            path: "included.attributes.extensionValues",
            type: "fieldExtension",
            keywordMultiFieldSupport: false,
            keywordNumericSupport: false,
            optimizedPrefix: false,
            containsSupport: false,
            endsWithSupport: false,
            hideField: false
          },
          dynamicFieldValue: `{"selectedExtension":"mixs_water_v4","selectedField":"alkalinity","searchValue":"","selectedOperator":"exactMatch"}`
        })
      ).toEqual("fieldExtension/COLLECTING_EVENT/mixs_water_v4/alkalinity");
    });

    it("Generate entity level path", () => {
      expect(
        generateColumnPath({
          indexMapping: {
            label: "materialSampleState",
            value: "data.attributes.materialSampleState",
            hideField: false,
            type: "text",
            path: "data.attributes",
            distinctTerm: true,
            keywordMultiFieldSupport: true,
            keywordNumericSupport: false,
            optimizedPrefix: false,
            containsSupport: false,
            endsWithSupport: false
          }
        })
      ).toEqual("data.attributes.materialSampleState");
    });

    it("Generate relationship level path", () => {
      expect(
        generateColumnPath({
          indexMapping: {
            label: "name",
            value: "assemblages.name",
            hideField: false,
            type: "text",
            path: "attributes",
            parentName: "assemblages",
            parentType: "assemblage",
            parentPath: "included",
            keywordMultiFieldSupport: true,
            keywordNumericSupport: false,
            optimizedPrefix: false,
            containsSupport: false,
            endsWithSupport: false,
            distinctTerm: false
          }
        })
      ).toEqual("assemblages.name");
    });
  });
});
