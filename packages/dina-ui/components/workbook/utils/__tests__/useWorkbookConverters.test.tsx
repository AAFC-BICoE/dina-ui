import * as ApiClientContext from "common-ui/lib/api-client/ApiClientContext";
import { render } from "@testing-library/react";
import {
  FieldMappingConfigType,
  LinkOrCreateSetting,
  WorkbookColumnMap,
  WorkbookDataTypeEnum
} from "../..";
import { useWorkbookConverter } from "../useWorkbookConverter";
import { DinaIntlProvider } from "../../../../intl/dina-ui-intl";

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
    mapField: {
      dataType: WorkbookDataTypeEnum.MANAGED_ATTRIBUTES,
      endpoint: "managed attribute endpoint",
      managedAttributeComponent: "component"
    },
    vocabularyField: {
      dataType: WorkbookDataTypeEnum.VOCABULARY,
      endpoint: "vocabulary endpoint"
    },
    objectField: {
      dataType: WorkbookDataTypeEnum.OBJECT,
      relationshipConfig: {
        linkOrCreateSetting: LinkOrCreateSetting.LINK_OR_CREATE,
        type: "object-field",
        baseApiPath: "fake-api",
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
  render(
    <DinaIntlProvider>
      <TestComponent />
    </DinaIntlProvider>
  );
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
        get: jest.fn().mockResolvedValue({})
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
        get: jest.fn().mockResolvedValue({})
      } as any,
      save: jest.fn()
    } as any);
    const { getPathOfField } = getWorkbookConverter(mockConfig, "mockEntity");
    expect(getPathOfField("stringFields")).toBeUndefined();
  });

  it("findFieldDataType should return the first field path if fieldName is not unique", () => {
    jest.spyOn(ApiClientContext, "useApiClient").mockReturnValue({
      apiClient: {
        get: jest.fn().mockResolvedValue({})
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
        get: jest.fn().mockResolvedValue({})
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
        dataType: "managedAttributes",
        endpoint: "managed attribute endpoint",
        managedAttributeComponent: "component"
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
          hasGroup: true
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
          type: "object-field"
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
        endpoint: "vocabulary endpoint"
      }
    });
  });

  it("getFieldRelationshipConfig", () => {
    jest.spyOn(ApiClientContext, "useApiClient").mockReturnValue({
      apiClient: {
        get: jest.fn().mockResolvedValue({})
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
      baseApiPath: "fake-api"
    });
    expect(getFieldRelationshipConfig("unknownField")).toEqual(undefined);
  });

  it("linkRelationshipAttribute 1", async () => {
    const mockSave = jest
      .fn()
      .mockResolvedValue([
        { id: "newId", type: "object-field", name: "name1" }
      ]);
    jest.spyOn(ApiClientContext, "useApiClient").mockReturnValue({
      apiClient: {
        get: jest.fn().mockResolvedValue({})
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
          type: "object-field"
        }
      },
      objectArray1: [
        {
          name: "name1",
          relationshipConfig: {
            baseApiPath: "fake-api",
            hasGroup: true,
            linkOrCreateSetting: LinkOrCreateSetting.LINK_OR_CREATE,
            type: "object-field"
          }
        }
      ]
    };
    const mockWorkbookColumnMap: WorkbookColumnMap = {
      attr1: {
        fieldPath: "attr1",
        showOnUI: true,
        mapRelationship: false,
        valueMapping: {},
        numOfUniqueValues: 100,
        originalColumnName: "",
        multipleValueMappings: {}
      },
      attr2: {
        fieldPath: "attr2",
        showOnUI: true,
        mapRelationship: false,
        valueMapping: {},
        numOfUniqueValues: 100,
        originalColumnName: "",
        multipleValueMappings: {}
      },
      attr3: {
        fieldPath: "attr3",
        showOnUI: true,
        mapRelationship: false,
        valueMapping: {},
        numOfUniqueValues: 100,
        originalColumnName: "",
        multipleValueMappings: {}
      },
      attr4: {
        fieldPath: "attr4",
        showOnUI: true,
        mapRelationship: false,
        valueMapping: {},
        numOfUniqueValues: 100,
        originalColumnName: "",
        multipleValueMappings: {}
      },
      "objectAttr1.name1": {
        fieldPath: "objectAttr1.name1",
        showOnUI: true,
        mapRelationship: true,
        valueMapping: {
          name1: { id: "id-name1", type: "object-field" }
        },
        numOfUniqueValues: 1,
        originalColumnName: "",
        multipleValueMappings: {}
      },
      "objectArray1.name1": {
        fieldPath: "objectAttr1.name1",
        showOnUI: true,
        mapRelationship: true,
        valueMapping: {
          name1: { id: "id-name1", type: "object-field" }
        },
        numOfUniqueValues: 1,
        originalColumnName: "",
        multipleValueMappings: {}
      }
    };

    for (const key of Object.keys(mockResource)) {
      await linkRelationshipAttribute(
        mockResource,
        mockWorkbookColumnMap,
        key,
        "group1"
      );
    }
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
              id: "newId",
              type: "object-field"
            }
          ]
        },
        objectAttr1: {
          data: {
            id: "newId",
            type: "object-field"
          }
        }
      },
      type: "mock-resource"
    });
  });

  it("linkRelationshipAttribute 2", async () => {
    const mockSave = jest
      .fn()
      .mockResolvedValue([
        { id: "newId", type: "object-field", name: "name1" }
      ]);
    jest.spyOn(ApiClientContext, "useApiClient").mockReturnValue({
      apiClient: {
        get: jest.fn().mockResolvedValue({})
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
          type: "object-field"
        }
      },
      objectArray1: [
        {
          name: "name1",
          relationshipConfig: {
            baseApiPath: "fake-api",
            hasGroup: true,
            linkOrCreateSetting: LinkOrCreateSetting.LINK_OR_CREATE,
            type: "object-field"
          }
        }
      ]
    };

    const mockWorkbookColumnMap: WorkbookColumnMap = {
      attr1: {
        fieldPath: "attr1",
        showOnUI: true,
        mapRelationship: false,
        valueMapping: {},
        numOfUniqueValues: 100,
        originalColumnName: "",
        multipleValueMappings: {}
      },
      attr2: {
        fieldPath: "attr2",
        showOnUI: true,
        mapRelationship: false,
        valueMapping: {},
        numOfUniqueValues: 100,
        originalColumnName: "",
        multipleValueMappings: {}
      },
      attr3: {
        fieldPath: "attr3",
        showOnUI: true,
        mapRelationship: false,
        valueMapping: {},
        numOfUniqueValues: 100,
        originalColumnName: "",
        multipleValueMappings: {}
      },
      attr4: {
        fieldPath: "attr4",
        showOnUI: true,
        mapRelationship: false,
        valueMapping: {},
        numOfUniqueValues: 100,
        originalColumnName: "",
        multipleValueMappings: {}
      },
      "objectAttr1.name1": {
        fieldPath: "objectAttr1.name1",
        showOnUI: true,
        mapRelationship: true,
        valueMapping: {
          name1: { id: "id-name1", type: "object-field" }
        },
        numOfUniqueValues: 1,
        originalColumnName: "",
        multipleValueMappings: {}
      },
      "objectArray1.name1": {
        fieldPath: "objectAttr1.name1",
        showOnUI: true,
        mapRelationship: true,
        valueMapping: {
          name1: { id: "id-name1", type: "object-field" }
        },
        numOfUniqueValues: 1,
        originalColumnName: "",
        multipleValueMappings: {}
      }
    };

    for (const key of Object.keys(mockResource)) {
      await linkRelationshipAttribute(
        mockResource,
        mockWorkbookColumnMap,
        key,
        "group1"
      );
    }
    expect(mockSave).toHaveBeenCalledTimes(2);
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
        get: jest.fn().mockResolvedValue({})
      } as any,
      save: jest.fn()
    } as any);
    const { convertWorkbook } = getWorkbookConverter(mockConfig, "mockEntity");
    expect(convertWorkbook(mockWorkbookData, "cnc")).toEqual([
      {
        group: "cnc",
        relationships: {},
        type: "mock-entity",
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
            type: "object-field"
          }
        },
        objectArrayField: [
          {
            relationshipConfig: {
              linkOrCreateSetting: LinkOrCreateSetting.LINK_OR_CREATE,
              type: "object-array",
              baseApiPath: "fake-api",
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

  it("searchColumnMap", () => {
    const mockSave = jest
      .fn()
      .mockResolvedValue([
        { id: "newId", type: "object-field", name: "name1" }
      ]);
    jest.spyOn(ApiClientContext, "useApiClient").mockReturnValue({
      apiClient: {
        get: jest.fn().mockResolvedValue({})
      } as any,
      save: mockSave
    } as any);
    const { searchColumnMap } = getWorkbookConverter(mockConfig, "mockEntity");

    const mockWorkbookColumnMap: WorkbookColumnMap = {
      displayName: {
        fieldPath: "collectingEvent.collectors.displayName",
        showOnUI: true,
        mapRelationship: true,
        numOfUniqueValues: 3,
        valueMapping: {
          "collector 3": {
            id: "70875e43-c5e1-4381-bd20-f41aa88a0052",
            type: "person"
          },
          "collector 2": {
            id: "70875e43-c5e1-4381-bd20-f41aa88a0052",
            type: "person"
          },
          "collector 1": {
            id: "86c65bc9-ff2d-440d-8c63-3b6f928b2b69",
            type: "person"
          }
        },
        originalColumnName: "",
        multipleValueMappings: {}
      },
      name: {
        fieldPath: "collection.collectors.name",
        showOnUI: true,
        mapRelationship: true,
        numOfUniqueValues: 3,
        valueMapping: {
          coll1: {
            id: "06a0cf94-9c77-4ec3-a8c1-f7a8ea3ce304",
            type: "collection"
          },
          coll2: {
            id: "633dcb70-81c0-4c36-821b-4f5d8740615d",
            type: "collection"
          },
          coll3: {
            id: "633dcb70-81c0-4c36-821b-4f5d8740615d",
            type: "collection"
          }
        },
        originalColumnName: "",
        multipleValueMappings: {}
      }
    };

    expect(searchColumnMap("unkown property", mockWorkbookColumnMap)).toEqual(
      undefined
    );

    expect(
      searchColumnMap("collectingEvent.collectors", mockWorkbookColumnMap)
    ).toEqual({
      "collectingEvent.collectors.displayName": {
        "collector 3": {
          id: "70875e43-c5e1-4381-bd20-f41aa88a0052",
          type: "person"
        },
        "collector 2": {
          id: "70875e43-c5e1-4381-bd20-f41aa88a0052",
          type: "person"
        },
        "collector 1": {
          id: "86c65bc9-ff2d-440d-8c63-3b6f928b2b69",
          type: "person"
        }
      }
    });

    expect(
      searchColumnMap("collection.collectors", mockWorkbookColumnMap)
    ).toEqual({
      "collection.collectors.name": {
        coll1: {
          id: "06a0cf94-9c77-4ec3-a8c1-f7a8ea3ce304",
          type: "collection"
        },
        coll2: {
          id: "633dcb70-81c0-4c36-821b-4f5d8740615d",
          type: "collection"
        },
        coll3: {
          id: "633dcb70-81c0-4c36-821b-4f5d8740615d",
          type: "collection"
        }
      }
    });

    expect(searchColumnMap("collectors", mockWorkbookColumnMap)).toEqual({
      "collection.collectors.name": {
        coll1: {
          id: "06a0cf94-9c77-4ec3-a8c1-f7a8ea3ce304",
          type: "collection"
        },
        coll2: {
          id: "633dcb70-81c0-4c36-821b-4f5d8740615d",
          type: "collection"
        },
        coll3: {
          id: "633dcb70-81c0-4c36-821b-4f5d8740615d",
          type: "collection"
        }
      },
      "collectingEvent.collectors.displayName": {
        "collector 3": {
          id: "70875e43-c5e1-4381-bd20-f41aa88a0052",
          type: "person"
        },
        "collector 2": {
          id: "70875e43-c5e1-4381-bd20-f41aa88a0052",
          type: "person"
        },
        "collector 1": {
          id: "86c65bc9-ff2d-440d-8c63-3b6f928b2b69",
          type: "person"
        }
      }
    });
  });
});
