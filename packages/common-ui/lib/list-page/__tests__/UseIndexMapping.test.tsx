import { useEffect } from "react";
import { mountWithAppContext } from "common-ui";
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
  const { indexMap } = useIndexMapping({
    indexName: INDEX_NAME
  });

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
          {
            name: "materialSampleName",
            type: "text",
            path: "data.attributes",
            fields: ["prefix", "infix", "prefix_reverse", "keyword_numeric"]
          },
          {
            name: "materialSampleRemarks",
            type: "text",
            path: "data.attributes",
            fields: ["keyword"]
          },
          {
            name: "bucket",
            type: "keyword",
            path: "data.attributes"
          },
          {
            name: "preparationDate",
            type: "date",
            path: "data.attributes",
            subtype: "local_date"
          },
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
                path: "attributes",
                fields: ["keyword_numeric"]
              },
              {
                name: "dwcRecordNumber",
                type: "text",
                path: "attributes",
                fields: ["keyword"]
              },
              {
                name: "startEventDateTime",
                type: "date",
                path: "attributes",
                subtype: "local_date"
              },
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

    await wrapper.waitForRequests();

    expect(mockIndexMapRetrieved).toHaveBeenCalledTimes(1);
    expect(mockIndexMapRetrieved).toMatchSnapshot();
  });
});
