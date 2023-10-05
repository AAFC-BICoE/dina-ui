import { useWorkbookConverter } from "../useWorkbookConverter";

import { WorkbookDataTypeEnum, FieldMappingConfigType } from "../..";

const mockConfig: FieldMappingConfigType = {
  mockEntity: {
    type: "mock-entity",
    stringField: { dataType: WorkbookDataTypeEnum.STRING },
    numberField: { dataType: WorkbookDataTypeEnum.NUMBER },
    booleanField: { dataType: WorkbookDataTypeEnum.BOOLEAN },
    stringArrayField: { dataType: WorkbookDataTypeEnum.STRING_ARRAY },
    numberArrayField: { dataType: WorkbookDataTypeEnum.NUMBER_ARRAY },
    mapField: { dataType: WorkbookDataTypeEnum.MANAGED_ATTRIBUTES },
    vocabularyField: {
      dataType: WorkbookDataTypeEnum.VOCABULARY,
      vocabularyEndpoint: "vocabulary endpoint"
    },
    objectField: {
      dataType: WorkbookDataTypeEnum.OBJECT,
      relationships: {
        tryToLinkExisting: true,
        type: "object-field",
        baseApiPath: "fake-api"
      },
      attributes: {
        name: { dataType: WorkbookDataTypeEnum.STRING },
        age: { dataType: WorkbookDataTypeEnum.NUMBER },
        address: {
          dataType: WorkbookDataTypeEnum.OBJECT,
          attributes: {
            addressLine1: { dataType: WorkbookDataTypeEnum.STRING },
            city: { dataType: WorkbookDataTypeEnum.STRING },
            province: { dataType: WorkbookDataTypeEnum.STRING },
            postalCode: { dataType: WorkbookDataTypeEnum.STRING }
          }
        }
      }
    },
    objectArrayField: {
      dataType: WorkbookDataTypeEnum.OBJECT_ARRAY,
      attributes: {
        name: { dataType: WorkbookDataTypeEnum.STRING },
        age: { dataType: WorkbookDataTypeEnum.NUMBER },
        collector: {
          dataType: WorkbookDataTypeEnum.OBJECT,
          attributes: {
            name: { dataType: WorkbookDataTypeEnum.STRING },
            age: { dataType: WorkbookDataTypeEnum.NUMBER }
          }
        }
      }
    }
  }
};

const mockWorkbookData = [
  {
    stringField: "string value1",
    numberField: "123",
    booleanField: "true",
    "objectField.name": "object name 1",
    "objectField.age": "12",
    "objectField.address.addressLine1": "object 1 address line 1",
    "objectField.address.city": "object 1 address city",
    "objectArrayField.name": "name1",
    "objectArrayField.age": "11",
    "objectArrayField.collector.name": "Tom",
    "objectArrayField.collector.age": "61"
  }
];

describe("useWorkbookConverters", () => {
  describe("getPathOfField", () => {
    it("getPathOfField should find filedName", () => {
      const { getPathOfField } = useWorkbookConverter(mockConfig, "mockEntity");
      expect(getPathOfField("stringField")).toEqual("stringField");
      expect(getPathOfField("objectField")).toEqual("objectField");
      expect(getPathOfField("objectArrayField")).toEqual("objectArrayField");
      expect(getPathOfField("objectField.address.city")).toEqual(
        "objectField.address.city"
      );
      expect(getPathOfField("city")).toEqual("objectField.address.city");
    });

    it("findFieldDataType should not find filedName", () => {
      const { getPathOfField } = useWorkbookConverter(mockConfig, "mockEntity");
      expect(getPathOfField("stringFields")).toBeUndefined();
    });

    it("findFieldDataType should return the first field path if fieldName is not unique", () => {
      const { getPathOfField } = useWorkbookConverter(
        {
          mockEntity: {
            type: "mock-entity",
            dog: {
              dataType: WorkbookDataTypeEnum.OBJECT,
              attributes: {
                name: {
                  dataType: WorkbookDataTypeEnum.STRING
                }
              }
            },
            cat: {
              dataType: WorkbookDataTypeEnum.OBJECT,
              attributes: {
                name: {
                  dataType: WorkbookDataTypeEnum.STRING
                }
              }
            }
          }
        },
        "mockEntity"
      );
      expect(getPathOfField("name")).toEqual("dog.name");
    });
  });

  it("convertWorkbook", () => {
    const { convertWorkbook } = useWorkbookConverter(mockConfig, "mockEntity");
    expect(convertWorkbook(mockWorkbookData, "cnc")).toEqual([
      {
        type: "mockEntity",
        group: "cnc",
        stringField: "string value1",
        booleanField: true,
        numberField: 123,
        objectField: {
          type: "objectField",
          group: "cnc",
          name: "object name 1",
          age: 12,
          address: {
            type: "address",
            group: "cnc",
            addressLine1: "object 1 address line 1",
            city: "object 1 address city"
          }
        },
        objectArrayField: [
          {
            type: "objectArrayField",
            group: "cnc",
            name: "name1",
            age: 11,
            collector: {
              type: "collector",
              group: "cnc",
              name: "Tom",
              age: 61
            }
          }
        ]
      }
    ]);
  });
});
