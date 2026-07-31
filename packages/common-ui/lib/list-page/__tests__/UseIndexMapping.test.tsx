import { useEffect } from "react";
import { mountWithAppContext } from "common-ui";
import { ESIndexMapping } from "../types";
import { useIndexMapping } from "../useIndexMapping";
import { waitFor } from "@testing-library/react";
import { MATERIAL_SAMPLE_MAPPING } from "../__mocks__/IndexMappingMocks";

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
    return MATERIAL_SAMPLE_MAPPING;
  }
});

describe("Use Index Mapping Hook", () => {
  it("Retrieve index and transform the structure.", async () => {
    mountWithAppContext(
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

    await waitFor(() => {
      expect(mockIndexMapRetrieved).toHaveBeenCalledTimes(1);
    });
    expect(mockIndexMapRetrieved).toMatchSnapshot();
  });
});
