import * as ApiClientContext from "common-ui/lib/api-client/ApiClientContext";
import { mount } from "enzyme";
import {
  FieldMappingConfigType,
  LinkOrCreateSetting,
  WorkbookDataTypeEnum
} from "../..";
import { useWorkbookConverter } from "../useWorkbookConverter";

const mockConfig: FieldMappingConfigType = {
  mockEntity: {
    relationshipConfig: {
      type: "mock-entity",
      hasGroup: true,
      baseApiPath: "fake-api"
    },
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
      relationshipConfig: {
        linkOrCreateSetting: LinkOrCreateSetting.LINK_OR_CREATE,
        type: "object-field",
        baseApiPath: "fake-api",
        queryFields: ["name"],
        hasGroup: true
      },
      attributes: {
        name: { dataType: WorkbookDataTypeEnum.STRING },
        age: { dataType: WorkbookDataTypeEnum.NUMBER },
        address: {
          dataType: WorkbookDataTypeEnum.OBJECT,
          relationshipConfig: {
            linkOrCreateSetting: LinkOrCreateSetting.CREATE,
            type: "address",
            baseApiPath: "fake-api",
            hasGroup: true
          },
          attributes: {
            addressLine1: { dataType: WorkbookDataTypeEnum.STRING },
            city: { dataType: WorkbookDataTypeEnum.STRING },
            province: { dataType: WorkbookDataTypeEnum.STRING },
            postalCode: { dataType: WorkbookDataTypeEnum.STRING }
          }
        },
        contact: {
          dataType: WorkbookDataTypeEnum.OBJECT,
          attributes: {
            name: { dataType: WorkbookDataTypeEnum.STRING },
            telephone: { dataType: WorkbookDataTypeEnum.STRING },
            email: { dataType: WorkbookDataTypeEnum.STRING }
          }
        }
      }
    },
    objectArrayField: {
      dataType: WorkbookDataTypeEnum.OBJECT_ARRAY,
      relationshipConfig: {
        linkOrCreateSetting: LinkOrCreateSetting.LINK_OR_CREATE,
        type: "object-array",
        baseApiPath: "fake-api",
        queryFields: ["name"],
        hasGroup: true
      },
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
    "objectField.contact.name": "John",
    "objectField.contact.telephone": "11111111",
    "objectField.contact.email": "sss@sss.com",
    "objectArrayField.name": "name1",
    "objectArrayField.age": "11",
    "objectArrayField.collector.name": "Tom",
    "objectArrayField.collector.age": "61"
  }
];

function getWorkbookConverter(
  mappingConfig: FieldMappingConfigType,
  entityName: string
) {
  const returnVal: ReturnType<typeof useWorkbookConverter> = {} as any;
  function TestComponent() {
    Object.assign(returnVal, useWorkbookConverter(mappingConfig, entityName));
    return <></>;
  }
  mount(<TestComponent />);
  return returnVal;
}

describe("useWorkbookConverters", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.restoreAllMocks();
  });

  it("getPathOfField should find filedName", () => {
    jest.spyOn(ApiClientContext, "useApiClient").mockReturnValue({
      apiClient: {
        get: jest.fn()
      } as any,
      save: jest.fn()
    } as any);
    const { getPathOfField } = getWorkbookConverter(mockConfig, "mockEntity");
    expect(getPathOfField("stringField")).toEqual("stringField");
    expect(getPathOfField("objectField")).toEqual("objectField");
    expect(getPathOfField("objectArrayField")).toEqual("objectArrayField");
    expect(getPathOfField("objectField.address.city")).toEqual(
      "objectField.address.city"
    );
    expect(getPathOfField("city")).toEqual("objectField.address.city");
  });

  it("findFieldDataType should not find filedName", () => {
    jest.spyOn(ApiClientContext, "useApiClient").mockReturnValue({
      apiClient: {
        get: jest.fn()
      } as any,
      save: jest.fn()
    } as any);
    const { getPathOfField } = getWorkbookConverter(mockConfig, "mockEntity");
    expect(getPathOfField("stringFields")).toBeUndefined();
  });

  it("findFieldDataType should return the first field path if fieldName is not unique", () => {
    jest.spyOn(ApiClientContext, "useApiClient").mockReturnValue({
      apiClient: {
        get: jest.fn()
      } as any,
      save: jest.fn()
    } as any);
    const { getPathOfField: getPathOfField2 } = getWorkbookConverter(
      {
        mockEntity: {
          relationshipConfig: {
            type: "mock-entity",
            hasGroup: true,
            baseApiPath: "fake-api"
          },
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
    expect(getPathOfField2("name")).toEqual("dog.name");
  });

  it("flattenedConfig", () => {
    jest.spyOn(ApiClientContext, "useApiClient").mockReturnValue({
      apiClient: {
        get: jest.fn()
      } as any,
      save: jest.fn()
    } as any);
    const { flattenedConfig } = getWorkbookConverter(mockConfig, "mockEntity");
    expect(flattenedConfig).toEqual({
      relationshipConfig: {
        baseApiPath: "fake-api",
        hasGroup: true,
        type: "mock-entity"
      },
      booleanField: {
        dataType: "boolean"
      },
      mapField: {
        dataType: "managedAttributes"
      },
      numberArrayField: {
        dataType: "number[]"
      },
      numberField: {
        dataType: "number"
      },
      objectArrayField: {
        dataType: "object[]",
        relationshipConfig: {
          linkOrCreateSetting: LinkOrCreateSetting.LINK_OR_CREATE,
          type: "object-array",
          baseApiPath: "fake-api",
          hasGroup: true,
          queryFields: ["name"]
        },
        attributes: {
          age: {
            dataType: "number"
          },
          collector: {
            attributes: {
              age: {
                dataType: "number"
              },
              name: {
                dataType: "string"
              }
            },
            dataType: "object"
          },
          name: {
            dataType: "string"
          }
        }
      },
      "objectArrayField.age": {
        dataType: "number"
      },
      "objectArrayField.collector": {
        attributes: {
          age: {
            dataType: "number"
          },
          name: {
            dataType: "string"
          }
        },
        dataType: "object"
      },
      "objectArrayField.collector.age": {
        dataType: "number"
      },
      "objectArrayField.collector.name": {
        dataType: "string"
      },
      "objectArrayField.name": {
        dataType: "string"
      },
      objectField: {
        attributes: {
          address: {
            dataType: "object",
            relationshipConfig: {
              linkOrCreateSetting: LinkOrCreateSetting.CREATE,
              type: "address",
              baseApiPath: "fake-api",
              hasGroup: true
            },
            attributes: {
              addressLine1: {
                dataType: "string"
              },
              city: {
                dataType: "string"
              },
              postalCode: {
                dataType: "string"
              },
              province: {
                dataType: "string"
              }
            }
          },
          age: {
            dataType: "number"
          },
          name: {
            dataType: "string"
          },
          contact: {
            attributes: {
              email: {
                dataType: "string"
              },
              name: {
                dataType: "string"
              },
              telephone: {
                dataType: "string"
              }
            },
            dataType: "object"
          }
        },
        dataType: "object",
        relationshipConfig: {
          baseApiPath: "fake-api",
          hasGroup: true,
          linkOrCreateSetting: LinkOrCreateSetting.LINK_OR_CREATE,
          type: "object-field",
          queryFields: ["name"]
        }
      },
      "objectField.address": {
        attributes: {
          addressLine1: {
            dataType: "string"
          },
          city: {
            dataType: "string"
          },
          postalCode: {
            dataType: "string"
          },
          province: {
            dataType: "string"
          }
        },
        dataType: "object",
        relationshipConfig: {
          linkOrCreateSetting: LinkOrCreateSetting.CREATE,
          type: "address",
          baseApiPath: "fake-api",
          hasGroup: true
        }
      },
      "objectField.address.addressLine1": {
        dataType: "string"
      },
      "objectField.address.city": {
        dataType: "string"
      },
      "objectField.address.postalCode": {
        dataType: "string"
      },
      "objectField.address.province": {
        dataType: "string"
      },
      "objectField.age": {
        dataType: "number"
      },
      "objectField.name": {
        dataType: "string"
      },
      "objectField.contact": {
        attributes: {
          email: {
            dataType: "string"
          },
          name: {
            dataType: "string"
          },
          telephone: {
            dataType: "string"
          }
        },
        dataType: "object"
      },
      "objectField.contact.email": {
        dataType: "string"
      },
      "objectField.contact.name": {
        dataType: "string"
      },
      "objectField.contact.telephone": {
        dataType: "string"
      },
      stringArrayField: {
        dataType: "string[]"
      },
      stringField: {
        dataType: "string"
      },
      vocabularyField: {
        dataType: "vocabulary",
        vocabularyEndpoint: "vocabulary endpoint"
      }
    });
  });

  it("getFieldRelationshipConfig", () => {
    jest.spyOn(ApiClientContext, "useApiClient").mockReturnValue({
      apiClient: {
        get: jest.fn()
      } as any,
      save: jest.fn()
    } as any);
    const { getFieldRelationshipConfig } = getWorkbookConverter(
      mockConfig,
      "mockEntity"
    );
    expect(getFieldRelationshipConfig()).toEqual({
      type: "mock-entity",
      hasGroup: true,
      baseApiPath: "fake-api"
    });
    expect(getFieldRelationshipConfig("objectField")).toEqual({
      type: "object-field",
      hasGroup: true,
      linkOrCreateSetting: LinkOrCreateSetting.LINK_OR_CREATE,
      baseApiPath: "fake-api",
      queryFields: ["name"]
    });
    expect(getFieldRelationshipConfig("unknownField")).toEqual(undefined);
  });

  it("linkRelationshipAttribute 1", async () => {
    const mockGet = jest
      .fn()
      .mockResolvedValue({ data: { id: "id", type: "object-field" } });
    const mockSave = jest
      .fn()
      .mockResolvedValue([
        { id: "newId", type: "object-field", name: "name1" }
      ]);
    jest.spyOn(ApiClientContext, "useApiClient").mockReturnValue({
      apiClient: {
        get: mockGet
      } as any,
      save: mockSave
    } as any);
    const { linkRelationshipAttribute } = getWorkbookConverter(
      mockConfig,
      "mockEntity"
    );
    const mockResource: any = {
      attr1: 123,
      attr2: "abc",
      attr3: [123, 345],
      attr4: { name: "ddd", age: 12 },
      relationshipConfig: {
        baseApiPath: "fake-api",
        hasGroup: true,
        linkOrCreateSetting: LinkOrCreateSetting.LINK_OR_CREATE,
        type: "mock-resource"
      },
      objectAttr1: {
        name: "name1",
        relationshipConfig: {
          baseApiPath: "fake-api",
          hasGroup: true,
          linkOrCreateSetting: LinkOrCreateSetting.LINK_OR_CREATE,
          type: "object-field",
          queryFields: ["name"]
        }
      },
      objectArray1: [
        {
          name: "name1",
          relationshipConfig: {
            baseApiPath: "fake-api",
            hasGroup: true,
            linkOrCreateSetting: LinkOrCreateSetting.LINK_OR_CREATE,
            type: "object-field",
            queryFields: ["name"]
          }
        }
      ]
    };

    for (const key of Object.keys(mockResource)) {
      await linkRelationshipAttribute(mockResource, key, "group1");
    }
    expect(mockGet).toHaveBeenCalledTimes(1);
    expect(mockResource).toEqual({
      attr1: 123,
      attr2: "abc",
      attr3: [123, 345],
      attr4: {
        age: 12,
        name: "ddd"
      },
      group: "group1",
      relationships: {
        objectArray1: {
          data: [
            {
              id: "id",
              type: "object-field"
            }
          ]
        },
        objectAttr1: {
          data: {
            id: "id",
            type: "object-field"
          }
        }
      },
      type: "mock-resource"
    });
  });

  it("linkRelationshipAttribute 2", async () => {
    const mockGet = jest.fn().mockResolvedValue(null);
    const mockSave = jest
      .fn()
      .mockResolvedValue([
        { id: "newId", type: "object-field", name: "name1" }
      ]);
    jest.spyOn(ApiClientContext, "useApiClient").mockReturnValue({
      apiClient: {
        get: mockGet
      } as any,
      save: mockSave
    } as any);
    const { linkRelationshipAttribute } = getWorkbookConverter(
      mockConfig,
      "mockEntity"
    );
    const mockResource: any = {
      attr1: 123,
      attr2: "abc",
      attr3: [123, 345],
      attr4: { name: "ddd", age: 12 },
      relationshipConfig: {
        baseApiPath: "fake-api",
        hasGroup: true,
        linkOrCreateSetting: LinkOrCreateSetting.LINK_OR_CREATE,
        type: "mock-resource"
      },
      objectAttr1: {
        name: "name1",
        relationshipConfig: {
          baseApiPath: "fake-api",
          hasGroup: true,
          linkOrCreateSetting: LinkOrCreateSetting.LINK_OR_CREATE,
          type: "object-field",
          queryFields: ["name"]
        }
      },
      objectArray1: [
        {
          name: "name1",
          relationshipConfig: {
            baseApiPath: "fake-api",
            hasGroup: true,
            linkOrCreateSetting: LinkOrCreateSetting.LINK_OR_CREATE,
            type: "object-field",
            queryFields: ["name"]
          }
        }
      ]
    };

    for (const key of Object.keys(mockResource)) {
      await linkRelationshipAttribute(mockResource, key, "group1");
    }
    expect(mockGet).toHaveBeenCalledTimes(1);
    expect(mockSave).toHaveBeenCalledTimes(1);
    expect(mockResource).toEqual({
      attr1: 123,
      attr2: "abc",
      attr3: [123, 345],
      attr4: {
        age: 12,
        name: "ddd"
      },
      group: "group1",
      relationships: {
        objectAttr1: {
          data: {
            id: "newId",
            type: "object-field"
          }
        },
        objectArray1: {
          data: [
            {
              id: "newId",
              type: "object-field"
            }
          ]
        }
      },
      type: "mock-resource"
    });
  });

  it("convertWorkbook", () => {
    jest.spyOn(ApiClientContext, "useApiClient").mockReturnValue({
      apiClient: {
        get: jest.fn()
      } as any,
      save: jest.fn()
    } as any);
    const { convertWorkbook } = getWorkbookConverter(mockConfig, "mockEntity");
    expect(convertWorkbook(mockWorkbookData, "cnc")).toEqual([
      {
        group: "cnc",
        relationships: {},
        stringField: "string value1",
        booleanField: true,
        numberField: 123,
        objectField: {
          name: "object name 1",
          age: 12,
          address: {
            addressLine1: "object 1 address line 1",
            city: "object 1 address city",
            relationshipConfig: {
              linkOrCreateSetting: LinkOrCreateSetting.CREATE,
              type: "address",
              baseApiPath: "fake-api",
              hasGroup: true
            }
          },
          contact: {
            email: "sss@sss.com",
            name: "John",
            telephone: "11111111"
          },
          relationshipConfig: {
            baseApiPath: "fake-api",
            hasGroup: true,
            linkOrCreateSetting: LinkOrCreateSetting.LINK_OR_CREATE,
            type: "object-field",
            queryFields: ["name"]
          }
        },
        objectArrayField: [
          {
            relationshipConfig: {
              linkOrCreateSetting: LinkOrCreateSetting.LINK_OR_CREATE,
              type: "object-array",
              baseApiPath: "fake-api",
              queryFields: ["name"],
              hasGroup: true
            },
            name: "name1",
            age: 11,
            collector: {
              name: "Tom",
              age: 61
            }
          }
        ]
      }
    ]);
  });

  it("saveData", async () => {
    const mockData = {
      type: "mock-entity",
      group: "cnc",
      stringField: "string value1",
      booleanField: true,
      numberField: 123,
      objectField: {
        name: "object name 1",
        age: 12,
        address: {
          addressLine1: "object 1 address line 1",
          city: "object 1 address city",
          relationshipConfig: {
            linkOrCreateSetting: LinkOrCreateSetting.LINK_OR_CREATE,
            type: "address",
            baseApiPath: "fake-api",
            hasGroup: true
          }
        },
        relationshipConfig: {
          baseApiPath: "fake-api",
          hasGroup: true,
          linkOrCreateSetting: LinkOrCreateSetting.LINK_OR_CREATE,
          type: "object-field"
        }
      },
      objectArrayField: [
        {
          name: "name1",
          age: 11,
          collector: {
            name: "Tom",
            age: 61
          }
        }
      ]
    };
  });
});
