import { render } from "@testing-library/react";
import {
  buildRelationshipAccessorPath,
  collectPathValues,
  generateColumnPath,
  getNestedColumn,
  parseRelationshipNameFromType
} from "../ColumnSelectorUtils";

describe("ColumnSelectorUtils", () => {
  describe("generateColumnPath", () => {
    it("Generate managed attribute path", () => {
      // Attribute Level:
      expect(
        generateColumnPath({
          indexMapping: {
            dynamicField: {
              type: "managedAttribute",
              label: "managedAttributes",
              component: "MATERIAL_SAMPLE",
              path: "data.attributes.managedAttributes",
              apiEndpoint: "collection-api/controlled-vocabulary-item"
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

      // Included Level
      expect(
        generateColumnPath({
          indexMapping: {
            dynamicField: {
              type: "managedAttribute",
              label: "managedAttributes",
              component: "COLLECTING_EVENT",
              path: "included.attributes.managedAttributes",
              apiEndpoint: "collection-api/controlled-vocabulary-item"
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

      // Included level 2 levels
      expect(
        generateColumnPath({
          indexMapping: {
            dynamicField: {
              type: "managedAttribute",
              label: "managedAttributes",
              component: "DETERMINATION",
              path: "included.attributes.determination.managedAttributes",
              referencedBy: "organism.determination",
              referencedType: "organism",
              apiEndpoint: "collection-api/controlled-vocabulary-item"
            },
            parentName: "organism.determination",
            parentPath: "included",
            parentType: "organism",
            value:
              "included.attributes.determination.managedAttributes_organism.determination",
            distinctTerm: false,
            label: "managedAttributes",
            path: "included.attributes.determination.managedAttributes",
            type: "managedAttribute",
            keywordMultiFieldSupport: false,
            keywordNumericSupport: false,
            optimizedPrefix: false,
            containsSupport: false,
            endsWithSupport: false,
            hideField: false,
            isReverseRelationship: false
          },
          dynamicFieldValue: `{"searchValue":"","selectedOperator":"exactMatch","selectedManagedAttribute":{"id":"019eefa7-c6d5-7723-8bf2-c9ab822f1f0d","type":"controlled-vocabulary-item","name":"Test","key":"test","group":"cnc","term":"Test","multilingualTitle":null,"multilingualDescription":null,"vocabularyElementType":"STRING","acceptedValues":null,"unit":null,"uriTemplate":null,"dinaComponent":"DETERMINATION","createdBy":"dina-admin","createdOn":"2026-06-22T14:06:50.538384Z","lastUpdatedOn":"2026-06-22T14:06:50.613953Z"},"selectedType":"STRING"}`
        })
      ).toEqual("managedAttribute~organism.determination/DETERMINATION/test");
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
              label: "otherIdentifiers",
              component: "MATERIAL_SAMPLE",
              path: "data.attributes.identifiers",
              apiEndpoint: `collection-api/controlled-vocabulary-item`
            },
            value: "data.attributes.identifiers",
            distinctTerm: false,
            label: "otherIdentifiers",
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
              label: "otherIdentifiers",
              component: "MATERIAL_SAMPLE",
              path: "included.attributes.identifiers",
              apiEndpoint: `collection-api/controlled-vocabulary-item`
            },
            parentName: "parentMaterialSample",
            parentPath: "included",
            parentType: "collecting-event",
            value: "included.attributes.identifiers_parentMaterialSample",
            distinctTerm: false,
            label: "otherIdentifiers",
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
            '{"function1":{"functionDef":"CONCAT","params":{"items": ["barcode","createdBy"]}}}'
        })
      ).toEqual(
        'columnFunction/function1/CONCAT/{"items":["barcode","createdBy"]}'
      );

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
            '{"function2":{"functionDef":"CONVERT_COORDINATES_DD"}}'
        })
      ).toEqual("columnFunction/function2/CONVERT_COORDINATES_DD");
    });

    it("Generate classification path", () => {
      expect(
        generateColumnPath({
          indexMapping: {
            dynamicField: {
              type: "classification",
              label:
                "targetIdentifiableEntitySummary.primaryDetermination.classification",
              component: "MATERIAL_SAMPLE",
              path: "data.attributes.targetIdentifiableEntitySummary.primaryDetermination.classification",
              apiEndpoint: "collection-api/vocabulary2/taxonomicRank"
            },
            value:
              "data.attributes.targetIdentifiableEntitySummary.primaryDetermination.classification",
            distinctTerm: false,
            label:
              "targetIdentifiableEntitySummary.primaryDetermination.classification",
            path: "data.attributes.targetIdentifiableEntitySummary.primaryDetermination.classification",
            type: "classification",
            keywordMultiFieldSupport: false,
            keywordNumericSupport: false,
            optimizedPrefix: false,
            containsSupport: false,
            endsWithSupport: false,
            hideField: false
          },
          dynamicFieldValue: `{"searchValue":"test","selectedOperator":"exactMatch","selectedClassificationRank":"kingdom"}`
        })
      ).toEqual("classification/kingdom");

      expect(
        generateColumnPath({
          indexMapping: {
            dynamicField: {
              type: "classification",
              label:
                "targetIdentifiableEntitySummary.primaryDetermination.classification",
              component: "MATERIAL_SAMPLE",
              path: "included.attributes.targetIdentifiableEntitySummary.primaryDetermination.classification",
              apiEndpoint: "collection-api/vocabulary2/taxonomicRank"
            },
            parentName: "parentMaterialSample",
            parentPath: "included",
            parentType: "collecting-event",
            value:
              "included.attributes.targetIdentifiableEntitySummary.primaryDetermination.classification_parentMaterialSample",
            distinctTerm: false,
            label:
              "targetIdentifiableEntitySummary.primaryDetermination.classification",
            path: "included.attributes.targetIdentifiableEntitySummary.primaryDetermination.classification",
            type: "classification",
            keywordMultiFieldSupport: false,
            keywordNumericSupport: false,
            optimizedPrefix: false,
            containsSupport: false,
            endsWithSupport: false,
            hideField: false
          },
          dynamicFieldValue: `{"searchValue":"test","selectedOperator":"exactMatch","selectedClassificationRank":"kingdom"}`
        })
      ).toEqual("classification~parentMaterialSample/kingdom");
    });

    it("Generate imageLink path", () => {
      expect(
        generateColumnPath({
          indexMapping: {
            dynamicField: {
              apiEndpoint: "_imageLink",
              label: "_imageLink",
              path: "_imageLink",
              type: "imageLink"
            },
            value: "_imageLink",
            distinctTerm: false,
            label: "_imageLink",
            path: "_imageLink",
            type: "imageLink",
            keywordMultiFieldSupport: false,
            keywordNumericSupport: false,
            optimizedPrefix: false,
            containsSupport: false,
            endsWithSupport: false,
            hideField: false
          },
          dynamicFieldValue: `{ "selectedImageType": "LARGE_IMAGE" }`
        })
      ).toEqual("imageLink/LARGE_IMAGE");
    });
  });

  describe("parseRelationshipNameFromType", () => {
    it("Successfully parse the relationship name from the type", () => {
      expect(
        parseRelationshipNameFromType("identifier~parentMaterialSample")
      ).toEqual("parentMaterialSample");

      expect(
        parseRelationshipNameFromType("fieldExtension~collectingEvent")
      ).toEqual("collectingEvent");
    });

    it("Returns undefined if no relationshipName is provided", () => {
      expect(parseRelationshipNameFromType("identifier")).toBeUndefined();
    });
  });

  describe("collectPathValues", () => {
    // Test basic object property access
    test("gets a value from a simple object", () => {
      const obj = { a: { b: { c: "value" } } };
      expect(collectPathValues(obj, "a.b.c")).toBe("value");
    });

    // Test array handling - single level
    test("joins values from multiple array elements", () => {
      const obj = { a: { b: [{ c: "value1" }, { c: "value2" }] } };
      expect(collectPathValues(obj, "a.b.c")).toBe("value1; value2");
    });

    test("returns a semi-colon separated string when the path ends at an array", () => {
      const obj = { a: { b: ["first", "second", "third"] } };
      expect(collectPathValues(obj, "a.b")).toBe("first; second; third");
    });

    // Test array handling - multiple levels
    test("gets values through multiple arrays", () => {
      const obj = {
        a: [{ b: [{ c: "value1" }] }, { b: [{ c: "value2" }, { c: "value3" }] }]
      };
      expect(collectPathValues(obj, "a.b.c")).toBe("value1; value2; value3");
    });

    // Test handling of missing values
    test("ignores undefined values when joining results", () => {
      const obj = {
        a: [
          { b: "value1" },
          { c: "value2" }, // b is missing
          { b: "value3" }
        ]
      };
      expect(collectPathValues(obj, "a.b")).toBe("value1; value3");
    });

    // Test empty arrays
    test("returns undefined for empty arrays", () => {
      const obj = { a: { b: [] } };
      expect(collectPathValues(obj, "a.b.c")).toBeUndefined();
    });

    // Test null/undefined values
    test("returns undefined when encountering null", () => {
      const obj = { a: { b: null } };
      expect(collectPathValues(obj, "a.b.c")).toBeUndefined();
    });

    test("returns undefined when encountering undefined", () => {
      const obj = { a: { b: undefined } };
      expect(collectPathValues(obj, "a.b.c")).toBeUndefined();
    });

    // Test non-existent properties
    test("returns undefined for non-existent properties", () => {
      const obj = { a: { b: "value" } };
      expect(collectPathValues(obj, "a.c")).toBeUndefined();
    });

    // Test empty inputs
    test("returns undefined for empty object", () => {
      expect(collectPathValues({}, "a.b.c")).toBeUndefined();
    });

    test("returns the object itself for empty path", () => {
      const obj = { a: "value" };
      expect(collectPathValues(obj, "")).toBe(obj);
    });

    // Organism Determination test (complex)
    test("organism determination managed attribute path test", () => {
      const obj = {
        id: "019ee020-fc5d-7661-8a70-2453796ca2ce",
        type: "material-sample",
        data: {
          attributes: {
            group: "cnc",
            createdOn: "2026-06-19T13:45:18.718853Z",
            createdBy: "dina-admin",
            dwcOtherCatalogNumbers: null,
            materialSampleName: null,
            materialSampleType: null,
            materialSampleState: null
          },
          relationships: {
            projects: {
              data: []
            },
            organism: {
              data: [
                {
                  id: "019eefa8-789e-7716-8737-a79cf53151be",
                  type: "organism"
                }
              ]
            },
            assemblages: {
              data: []
            }
          }
        },
        included: {
          organism: [
            {
              id: "019eefa8-789e-7716-8737-a79cf53151be",
              type: "organism",
              attributes: {
                determination: [
                  {
                    managedAttributes: {
                      test: "Test123"
                    }
                  }
                ]
              }
            }
          ]
        }
      };

      expect(
        collectPathValues(
          obj,
          "included.organism.attributes.determination.managedAttributes.test"
        )
      ).toBe("Test123");
    });
  });

  describe("getNestedColumn", () => {
    it("One level column definition", async () => {
      const nestedColumn = getNestedColumn("attachment.acCaption", {
        label: "acCaption",
        value: "attachment.acCaption",
        hideField: false,
        type: "text",
        path: "attributes",
        parentName: "attachment",
        parentType: "metadata",
        parentPath: "included",
        keywordMultiFieldSupport: true,
        keywordNumericSupport: false,
        optimizedPrefix: false,
        containsSupport: false,
        endsWithSupport: false,
        isReverseRelationship: false
      } as any);

      // Verify the column definition
      expect(nestedColumn).toEqual({
        id: "attachment.acCaption",
        accessorKey: "included.attributes.acCaption",
        columnSelectorString: "attachment.acCaption",
        relationshipType: "metadata",
        cell: expect.anything(),
        header: expect.anything(),
        isKeyword: true,
        isColumnVisible: true
      });

      const CellComponent = nestedColumn.cell as Function;

      // Test the cell function with a sample row data
      const mockSingleRow = {
        original: {
          included: {
            attachment: {
              attributes: {
                acCaption: "Sample Caption"
              }
            }
          }
        }
      };

      const { container: singleContainer } = render(
        CellComponent({ row: mockSingleRow } as any)
      );
      expect(singleContainer.textContent).toBe("Sample Caption");

      // Test array handling in cell function
      const mockArrayRow = {
        original: {
          included: {
            attachment: [
              { attributes: { acCaption: "Caption 1" } },
              { attributes: { acCaption: "Caption 2" } }
            ]
          }
        }
      };

      const { container: arrayContainer } = render(
        CellComponent({ row: mockArrayRow } as any)
      );
      expect(arrayContainer.textContent).toBe("Caption 1, Caption 2");
    });

    it("Two level column definition", async () => {
      const nestedColumn = getNestedColumn(
        "organism.determination.typeStatus",
        {
          label: "determination.typeStatus",
          value: "organism.determination.typeStatus",
          hideField: false,
          type: "text",
          path: "attributes.determination",
          parentName: "organism",
          parentType: "organism",
          parentPath: "included",
          keywordMultiFieldSupport: false,
          keywordNumericSupport: false,
          optimizedPrefix: false,
          containsSupport: false,
          endsWithSupport: false,
          isReverseRelationship: false
        } as any
      );

      expect(nestedColumn).toEqual({
        id: "organism.determination.typeStatus",
        accessorKey: "included.attributes.determination.typeStatus",
        columnSelectorString: "organism.determination.typeStatus",
        relationshipType: "organism",
        cell: expect.anything(),
        header: expect.anything(),
        isKeyword: false,
        isColumnVisible: true
      });

      const CellComponent = nestedColumn.cell as Function;

      // Test the cell function with a sample row data
      const mockSingleRow = {
        original: {
          included: {
            organism: [
              {
                attributes: {
                  determination: [
                    {
                      scientificName: "Hexapoda",
                      typeStatus: "Holotype"
                    }
                  ]
                },
                id: "019ce8e3-08e8-724e-8f32-520695db4c6f",
                type: "organism"
              }
            ],
            collection: {
              attributes: {
                name: "Test"
              },
              id: "019cdce6-9a89-74d5-bdcf-a4dc92334e1a",
              type: "collection"
            }
          }
        }
      };

      const { container: singleContainer } = render(
        CellComponent({ row: mockSingleRow } as any)
      );
      expect(singleContainer.textContent).toBe("Holotype");

      // Test array handling in cell function
      // Test the cell function with a sample row data
      const mockArrayRow = {
        original: {
          included: {
            organism: {
              attributes: {
                determination: [
                  {
                    typeStatus: "Holotype"
                  },
                  {
                    typeStatus: "Paratype"
                  }
                ]
              }
            }
          }
        }
      };

      const { container: arrayContainer } = render(
        CellComponent({ row: mockArrayRow } as any)
      );
      expect(arrayContainer.textContent).toBe("Holotype, Paratype");
    });
  });

  describe("buildRelationshipAccessorPath", () => {
    it("inserts a simple referencedBy at index 1", () => {
      expect(
        buildRelationshipAccessorPath(
          "included.managedAttributes.myKey",
          "organism"
        )
      ).toBe("included.organism.managedAttributes.myKey");
    });

    it("uses only the first segment when referencedBy contains a dot", () => {
      expect(
        buildRelationshipAccessorPath(
          "included.attributes.determination.managedAttributes.test",
          "organism.determination"
        )
      ).toBe(
        "included.organism.attributes.determination.managedAttributes.test"
      );
    });

    it("handles undefined referencedBy by inserting an empty string", () => {
      expect(
        buildRelationshipAccessorPath(
          "included.managedAttributes.myKey",
          undefined
        )
      ).toBe("included.managedAttributes.myKey");
    });

    it("handles a deeply nested accessorKey", () => {
      expect(
        buildRelationshipAccessorPath(
          "included.attributes.extensionValues.ext1.fieldKey",
          "collectingEvent"
        )
      ).toBe(
        "included.collectingEvent.attributes.extensionValues.ext1.fieldKey"
      );
    });
  });
});
