import {
  DataTypeEnum,
  FieldMappingConfigType,
  useWorkbookConverter
} from "../useWorkbookConverter";

const mockConfig: FieldMappingConfigType = {
  mockEntity: {
    stringField: { dataType: DataTypeEnum.STRING },
    numberField: { dataType: DataTypeEnum.NUMBER },
    booleanField: { dataType: DataTypeEnum.BOOLEAN },
    stringArrayField: { dataType: DataTypeEnum.STRING_ARRAY },
    numberArrayField: { dataType: DataTypeEnum.NUMBER_ARRAY },
    mapField: { dataType: DataTypeEnum.MANAGED_ATTRIBUTES },
    vocabularyField: {
      dataType: DataTypeEnum.VOCABULARY,
      vocabularyEndpoint: "vocabulary endpoint"
    },
    objectField: {
      dataType: DataTypeEnum.OBJECT,
      attributes: {
        name: { dataType: DataTypeEnum.STRING },
        age: { dataType: DataTypeEnum.NUMBER },
        address: {
          dataType: DataTypeEnum.OBJECT,
          attributes: {
            addressLine1: { dataType: DataTypeEnum.STRING },
            city: { dataType: DataTypeEnum.STRING },
            province: { dataType: DataTypeEnum.STRING },
            postalCode: { dataType: DataTypeEnum.STRING }
          }
        }
      }
    },
    objectArrayField: {
      dataType: DataTypeEnum.OBJECT_ARRAY,
      attributes: {
        name: { dataType: DataTypeEnum.STRING },
        age: { dataType: DataTypeEnum.NUMBER }
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
    "objectArrayField.name": "object array name",
    "objectArrayField.age": "222"
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
              dataType: DataTypeEnum.OBJECT,
              attributes: {
                name: {
                  dataType: DataTypeEnum.STRING
                }
              }
            },
            cat: {
              dataType: DataTypeEnum.OBJECT,
              attributes: {
                name: {
                  dataType: DataTypeEnum.STRING
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

  describe("convertWorkbook", () => {
    const { convertWorkbook } = useWorkbookConverter(mockConfig, "mockEntity");
    expect(convertWorkbook(mockWorkbookData, "cnc")).toEqual([
      {
        type: "mockEntity",
        group: "cnc",
        stringField: "string value1",
        booleanField: true,
        numberField: 123,
        objectField: [
          {
            type: "objectField",
            group: "cnc",
            name: "object name 1",
            age: 12,
            address: [
              {
                type: "address",
                group: "cnc",
                addressLine1: "object 1 address line 1",
                city: "object 1 address city"
              }
            ]
          }
        ],
        objectArrayField: [
          {
            type: "objectArrayField",
            group: "cnc",
            name: "object array name",
            age: 222
          }
        ]
      }
    ]);
  });
});
