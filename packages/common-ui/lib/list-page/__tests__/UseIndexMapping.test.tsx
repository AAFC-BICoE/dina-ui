import { useEffect } from "react";
import { mountWithAppContext } from "../../test-util/mock-app-context";
import { ESIndexMapping } from "../types";
import { useIndexMapping } from "../useIndexMapping";

const INDEX_NAME = "dina-material-sample-index";

interface UseIndexMappingWrapperProps {
  // Callback when the index mapping is retrieved.
  indexMapRetrieved: (indexMap: ESIndexMapping[]) => void;
}

/**
 * Since we are testing a react hook, we will need to create a component that we can use
 * to retrieve the data from the hook.
 *
 * @param indexMapRetrieved Callback when the index mapping is retrieved.
 * @returns Blank component.
 */
function UseIndexMappingWrapper({
  indexMapRetrieved
}: UseIndexMappingWrapperProps) {
  const { indexMap } = useIndexMapping(INDEX_NAME);

  useEffect(() => {
    if (indexMap) {
      indexMapRetrieved(indexMap);
    }
  }, [indexMap]);

  return <></>;
}

const mockIndexMapRetrieved = jest.fn();

const mockSearchApiGet = jest.fn<any, any>((path) => {
  if (path === "search-api/search-ws/mapping") {
    return {
      data: {
        attributes: [
          {
            name: "materialSampleType",
            type: "text",
            path: "data.attributes",
            distinct_term_agg: true
          },
          { name: "createdOn", type: "date", path: "data.attributes" },
          { name: "materialSampleName", type: "text", path: "data.attributes" },
          { name: "preparationDate", type: "date", path: "data.attributes" },
          { name: "tags", type: "text", path: "data.attributes" },
          { name: "createdBy", type: "text", path: "data.attributes" }
        ],
        relationships: [
          {
            referencedBy: "collectingEvent",
            name: "type",
            path: "included",
            value: "collecting-event",
            attributes: [
              { name: "createdBy", type: "text", path: "attributes" },
              { name: "createdOn", type: "date", path: "attributes" },
              { name: "tags", type: "text", path: "attributes" },
              { name: "habitat", type: "text", path: "attributes" },
              { name: "substrate", type: "text", path: "attributes" },
              {
                name: "dwcOtherRecordNumbers",
                type: "text",
                path: "attributes"
              },
              { name: "dwcRecordNumber", type: "text", path: "attributes" },
              { name: "startEventDateTime", type: "date", path: "attributes" },
              { name: "endEventDateTime", type: "date", path: "attributes" }
            ]
          },
          {
            referencedBy: "preparationMethod",
            name: "type",
            path: "included",
            value: "preparation-method",
            attributes: [
              {
                name: "name",
                type: "text",
                path: "attributes",
                distinct_term_agg: true
              }
            ]
          },
          {
            referencedBy: "storageUnit",
            name: "type",
            path: "included",
            value: "storage-unit",
            attributes: [{ name: "name", type: "text", path: "attributes" }]
          },
          {
            referencedBy: "organism",
            name: "type",
            path: "included",
            value: "organism",
            attributes: [
              {
                name: "verbatimScientificName",
                type: "text",
                path: "attributes.determination"
              },
              {
                name: "scientificName",
                type: "text",
                path: "attributes.determination"
              },
              {
                name: "typeStatus",
                type: "text",
                path: "attributes.determination"
              }
            ]
          },
          {
            referencedBy: "collection",
            name: "type",
            path: "included",
            value: "collection",
            attributes: [
              {
                name: "name",
                type: "text",
                path: "attributes",
                distinct_term_agg: true
              },
              {
                name: "code",
                type: "text",
                path: "attributes",
                distinct_term_agg: true
              }
            ]
          },
          {
            referencedBy: "assemblages",
            name: "type",
            path: "included",
            value: "assemblage",
            attributes: [{ name: "name", type: "text", path: "attributes" }]
          },
          {
            referencedBy: "preparationType",
            name: "type",
            path: "included",
            value: "preparation-type",
            attributes: [
              {
                name: "name",
                type: "text",
                path: "attributes",
                distinct_term_agg: true
              }
            ]
          }
        ],
        index_name: "dina_material_sample_index"
      }
    };
  }
});

describe("Use Index Mapping Hook", () => {
  it("Retrieve index and transform the structure.", async () => {
    const wrapper = mountWithAppContext(
      <UseIndexMappingWrapper
        indexMapRetrieved={(newIndexMap: any) => {
          mockIndexMapRetrieved(newIndexMap);
        }}
      />,
      {
        apiContext: {
          apiClient: {
            axios: { get: mockSearchApiGet } as any
          }
        }
      }
    );

    await new Promise(setImmediate);
    wrapper.update();

    expect(mockIndexMapRetrieved).toBeCalledWith([
      {
        distinctTerm: true,
        label: "materialSampleType",
        path: "data.attributes",
        type: "text",
        value: "data.attributes.materialSampleType"
      },
      {
        distinctTerm: undefined,
        label: "createdOn",
        path: "data.attributes",
        type: "date",
        value: "data.attributes.createdOn"
      },
      {
        distinctTerm: undefined,
        label: "materialSampleName",
        path: "data.attributes",
        type: "text",
        value: "data.attributes.materialSampleName"
      },
      {
        distinctTerm: undefined,
        label: "preparationDate",
        path: "data.attributes",
        type: "date",
        value: "data.attributes.preparationDate"
      },
      {
        distinctTerm: undefined,
        label: "tags",
        path: "data.attributes",
        type: "text",
        value: "data.attributes.tags"
      },
      {
        distinctTerm: undefined,
        label: "createdBy",
        path: "data.attributes",
        type: "text",
        value: "data.attributes.createdBy"
      },
      {
        distinctTerm: undefined,
        label: "createdBy",
        parentName: "collectingEvent",
        parentPath: "included",
        parentType: "collecting-event",
        path: "attributes",
        type: "text",
        value: "collecting-event.createdBy"
      },
      {
        distinctTerm: undefined,
        label: "createdOn",
        parentName: "collectingEvent",
        parentPath: "included",
        parentType: "collecting-event",
        path: "attributes",
        type: "date",
        value: "collecting-event.createdOn"
      },
      {
        distinctTerm: undefined,
        label: "tags",
        parentName: "collectingEvent",
        parentPath: "included",
        parentType: "collecting-event",
        path: "attributes",
        type: "text",
        value: "collecting-event.tags"
      },
      {
        distinctTerm: undefined,
        label: "habitat",
        parentName: "collectingEvent",
        parentPath: "included",
        parentType: "collecting-event",
        path: "attributes",
        type: "text",
        value: "collecting-event.habitat"
      },
      {
        distinctTerm: undefined,
        label: "substrate",
        parentName: "collectingEvent",
        parentPath: "included",
        parentType: "collecting-event",
        path: "attributes",
        type: "text",
        value: "collecting-event.substrate"
      },
      {
        distinctTerm: undefined,
        label: "dwcOtherRecordNumbers",
        parentName: "collectingEvent",
        parentPath: "included",
        parentType: "collecting-event",
        path: "attributes",
        type: "text",
        value: "collecting-event.dwcOtherRecordNumbers"
      },
      {
        distinctTerm: undefined,
        label: "dwcRecordNumber",
        parentName: "collectingEvent",
        parentPath: "included",
        parentType: "collecting-event",
        path: "attributes",
        type: "text",
        value: "collecting-event.dwcRecordNumber"
      },
      {
        distinctTerm: undefined,
        label: "startEventDateTime",
        parentName: "collectingEvent",
        parentPath: "included",
        parentType: "collecting-event",
        path: "attributes",
        type: "date",
        value: "collecting-event.startEventDateTime"
      },
      {
        distinctTerm: undefined,
        label: "endEventDateTime",
        parentName: "collectingEvent",
        parentPath: "included",
        parentType: "collecting-event",
        path: "attributes",
        type: "date",
        value: "collecting-event.endEventDateTime"
      },
      {
        distinctTerm: true,
        label: "name",
        parentName: "preparationMethod",
        parentPath: "included",
        parentType: "preparation-method",
        path: "attributes",
        type: "text",
        value: "preparation-method.name"
      },
      {
        distinctTerm: undefined,
        label: "name",
        parentName: "storageUnit",
        parentPath: "included",
        parentType: "storage-unit",
        path: "attributes",
        type: "text",
        value: "storage-unit.name"
      },
      {
        distinctTerm: undefined,
        label: "determination.verbatimScientificName",
        parentName: "organism",
        parentPath: "included",
        parentType: "organism",
        path: "attributes.determination",
        type: "text",
        value: "organism.determination.verbatimScientificName"
      },
      {
        distinctTerm: undefined,
        label: "determination.scientificName",
        parentName: "organism",
        parentPath: "included",
        parentType: "organism",
        path: "attributes.determination",
        type: "text",
        value: "organism.determination.scientificName"
      },
      {
        distinctTerm: undefined,
        label: "determination.typeStatus",
        parentName: "organism",
        parentPath: "included",
        parentType: "organism",
        path: "attributes.determination",
        type: "text",
        value: "organism.determination.typeStatus"
      },
      {
        distinctTerm: true,
        label: "name",
        parentName: "collection",
        parentPath: "included",
        parentType: "collection",
        path: "attributes",
        type: "text",
        value: "collection.name"
      },
      {
        distinctTerm: true,
        label: "code",
        parentName: "collection",
        parentPath: "included",
        parentType: "collection",
        path: "attributes",
        type: "text",
        value: "collection.code"
      },
      {
        distinctTerm: undefined,
        label: "name",
        parentName: "assemblages",
        parentPath: "included",
        parentType: "assemblage",
        path: "attributes",
        type: "text",
        value: "assemblage.name"
      },
      {
        distinctTerm: true,
        label: "name",
        parentName: "preparationType",
        parentPath: "included",
        parentType: "preparation-type",
        path: "attributes",
        type: "text",
        value: "preparation-type.name"
      }
    ]);
  });
});
