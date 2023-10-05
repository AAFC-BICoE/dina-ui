import { useWorkbookConverter } from "../useWorkbookConverter";

import { WorkBookDataTypeEnum, FieldMappingConfigType } from "../..";

const mockConfig: FieldMappingConfigType = {
  mockEntity: {
    stringField: { dataType: WorkBookDataTypeEnum.STRING },
    numberField: { dataType: WorkBookDataTypeEnum.NUMBER },
    booleanField: { dataType: WorkBookDataTypeEnum.BOOLEAN },
    stringArrayField: { dataType: WorkBookDataTypeEnum.STRING_ARRAY },
    numberArrayField: { dataType: WorkBookDataTypeEnum.NUMBER_ARRAY },
    mapField: { dataType: WorkBookDataTypeEnum.MANAGED_ATTRIBUTES },
    vocabularyField: {
      dataType: WorkBookDataTypeEnum.VOCABULARY,
      vocabularyEndpoint: "vocabulary endpoint"
    },
    objectField: {
      dataType: WorkBookDataTypeEnum.OBJECT,
      attributes: {
        name: { dataType: WorkBookDataTypeEnum.STRING },
        age: { dataType: WorkBookDataTypeEnum.NUMBER },
        address: {
          dataType: WorkBookDataTypeEnum.OBJECT,
          attributes: {
            addressLine1: { dataType: WorkBookDataTypeEnum.STRING },
            city: { dataType: WorkBookDataTypeEnum.STRING },
            province: { dataType: WorkBookDataTypeEnum.STRING },
            postalCode: { dataType: WorkBookDataTypeEnum.STRING }
          }
        }
      }
    },
    objectArrayField: {
      dataType: WorkBookDataTypeEnum.OBJECT_ARRAY,
      attributes: {
        name: { dataType: WorkBookDataTypeEnum.STRING },
        age: { dataType: WorkBookDataTypeEnum.NUMBER },
        collector: {
          dataType: WorkBookDataTypeEnum.OBJECT,
          attributes: {
            name: { dataType: WorkBookDataTypeEnum.STRING },
            age: { dataType: WorkBookDataTypeEnum.NUMBER }
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
            dog: {
              dataType: WorkBookDataTypeEnum.OBJECT,
              attributes: {
                name: {
                  dataType: WorkBookDataTypeEnum.STRING
                }
              }
            },
            cat: {
              dataType: WorkBookDataTypeEnum.OBJECT,
              attributes: {
                name: {
                  dataType: WorkBookDataTypeEnum.STRING
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
