import {
  generateColumnPath,
  parseRelationshipNameFromType
} from "../ColumnSelectorUtils";

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
        "managedAttribute~collectingEvent/COLLECTING_EVENT/collecting_event_managed_attribute_key"
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
      ).toEqual(
        "fieldExtension~collectingEvent/COLLECTING_EVENT/mixs_water_v4/alkalinity"
      );
    });

    it("Generate identifier path", () => {
      expect(
        generateColumnPath({
          indexMapping: {
            dynamicField: {
              type: "identifier",
              label: "identifiers",
              component: "MATERIAL_SAMPLE",
              path: "data.attributes.identifiers",
              apiEndpoint: "collection-api/identifier-type"
            },
            value: "data.attributes.identifiers",
            distinctTerm: false,
            label: "identifiers",
            path: "data.attributes.identifiers",
            type: "identifier",
            keywordMultiFieldSupport: false,
            keywordNumericSupport: false,
            optimizedPrefix: false,
            containsSupport: false,
            endsWithSupport: false,
            hideField: false
          },
          dynamicFieldValue: `{"searchValue":"","selectedOperator":"exactMatch","selectedIdentifier":{"id": "seqdb_id"}}`
        })
      ).toEqual("identifier/seqdb_id");

      expect(
        generateColumnPath({
          indexMapping: {
            dynamicField: {
              type: "identifier",
              label: "identifiers",
              component: "MATERIAL_SAMPLE",
              path: "included.attributes.identifiers",
              apiEndpoint: "collection-api/identifier-type"
            },
            parentName: "parentMaterialSample",
            parentPath: "included",
            parentType: "collecting-event",
            value: "included.attributes.identifiers_parentMaterialSample",
            distinctTerm: false,
            label: "identifiers",
            path: "included.attributes.identifiers",
            type: "identifier",
            keywordMultiFieldSupport: false,
            keywordNumericSupport: false,
            optimizedPrefix: false,
            containsSupport: false,
            endsWithSupport: false,
            hideField: false
          },
          dynamicFieldValue: `{"searchValue":"","selectedOperator":"exactMatch","selectedIdentifier":{"id": "seqdb_id"}}`
        })
      ).toEqual("identifier~parentMaterialSample/seqdb_id");
    });

    it("Generate relationship presence path", () => {
      expect(
        generateColumnPath({
          indexMapping: {
            dynamicField: {
              apiEndpoint: "_relationshipPresence",
              label: "_relationshipPresence",
              path: "_relationshipPresence",
              type: "relationshipPresence"
            },
            value: "_relationshipPresence",
            distinctTerm: false,
            label: "_relationshipPresence",
            path: "_relationshipPresence",
            type: "relationshipPresence",
            keywordMultiFieldSupport: false,
            keywordNumericSupport: false,
            optimizedPrefix: false,
            containsSupport: false,
            endsWithSupport: false,
            hideField: false
          },
          dynamicFieldValue: `{"selectedRelationship":"organism","selectedOperator":"presence","selectedValue":0}`
        })
      ).toEqual("relationshipPresence/organism/presence");
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
      ).toEqual("materialSampleState");
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

    it("Generate column functions path", () => {
      expect(
        generateColumnPath({
          indexMapping: {
            label: "columnFunction",
            value: "columnFunction",
            path: "columnFunction",
            hideField: false,
            type: "columnFunction",
            dynamicField: {
              type: "columnFunction",
              label: "columnFunction",
              path: ""
            },
            containsSupport: false,
            distinctTerm: false,
            keywordMultiFieldSupport: false,
            keywordNumericSupport: false,
            optimizedPrefix: false,
            endsWithSupport: false
          }
        })
      ).toEqual("columnFunction");

      expect(
        generateColumnPath({
          indexMapping: {
            label: "columnFunction",
            value: "columnFunction",
            path: "columnFunction",
            hideField: false,
            type: "columnFunction",
            dynamicField: {
              type: "columnFunction",
              label: "columnFunction",
              path: ""
            },
            containsSupport: false,
            distinctTerm: false,
            keywordMultiFieldSupport: false,
            keywordNumericSupport: false,
            optimizedPrefix: false,
            endsWithSupport: false
          },
          dynamicFieldValue:
            '{"function1":{"functionName":"CONCAT","params":[{"label":"barcode","value":"data.attributes.barcode","hideField":false,"type":"text","path":"data.attributes","keywordMultiFieldSupport":true,"keywordNumericSupport":false,"optimizedPrefix":false,"containsSupport":false,"endsWithSupport":false},{"label":"createdBy","value":"data.attributes.createdBy","hideField":false,"type":"text","path":"data.attributes","keywordMultiFieldSupport":true,"keywordNumericSupport":false,"optimizedPrefix":false,"containsSupport":false,"endsWithSupport":false}]}}'
        })
      ).toEqual("columnFunction/function1/CONCAT/barcode+createdBy");

      expect(
        generateColumnPath({
          indexMapping: {
            label: "columnFunction",
            value: "columnFunction",
            path: "columnFunction",
            hideField: false,
            type: "columnFunction",
            dynamicField: {
              type: "columnFunction",
              label: "columnFunction",
              path: ""
            },
            containsSupport: false,
            distinctTerm: false,
            keywordMultiFieldSupport: false,
            keywordNumericSupport: false,
            optimizedPrefix: false,
            endsWithSupport: false
          },
          dynamicFieldValue:
            '{"function2":{"functionName":"CONVERT_COORDINATES_DD"}}'
        })
      ).toEqual("columnFunction/function2/CONVERT_COORDINATES_DD");
    });
  });

  describe("parseRelationshipNameFromType", () => {
    it("Successfully parse the relationship name from the type", () => {
      expect(
        parseRelationshipNameFromType("identifier~parentMaterialSample")
      ).toEqual("parentMaterialSample");
    });

    it("Returns undefined if no relationshipName is provided", () => {
      expect(parseRelationshipNameFromType("identifier")).toBeUndefined();
    });
  });
});
