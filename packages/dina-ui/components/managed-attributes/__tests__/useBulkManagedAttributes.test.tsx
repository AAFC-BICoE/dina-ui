import { mountWithAppContext } from "common-ui";
import { waitFor } from "@testing-library/react";
import { useBulkManagedAttributes } from "../useBulkManagedAttributes";
import "@testing-library/jest-dom";

const MOCK_MANAGED_ATTRIBUTES = [
  {
    id: "1",
    type: "managed-attribute",
    key: "attr_1",
    name: "Attribute 1"
  },
  {
    id: "2",
    type: "managed-attribute",
    key: "attr_2",
    name: "Attribute 2"
  }
];

const MOCK_CV_ITEMS = [
  {
    id: "cv_1",
    type: "controlled-vocabulary-item",
    key: "attr_1",
    name: "CV Item 1"
  }
];

const mockGet = jest.fn();

const testCtx = {
  apiContext: { apiClient: { get: mockGet } }
};

describe("useBulkManagedAttributes hook", () => {
  let hookResult: ReturnType<typeof useBulkManagedAttributes>;

  function TestComponent(
    props: Parameters<typeof useBulkManagedAttributes>[0]
  ) {
    hookResult = useBulkManagedAttributes(props);
    return null;
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("Does not trigger an API request when keys array is empty", () => {
    mountWithAppContext(
      <TestComponent
        baseApiPath="collection-api/managed-attribute"
        keys={[]}
      />,
      testCtx
    );

    expect(hookResult.data).toBeUndefined();
    expect(hookResult.loading).toBe(false);
    expect(mockGet).not.toHaveBeenCalled();
  });

  it("Does not trigger an API request when disabled is true", () => {
    mountWithAppContext(
      <TestComponent
        baseApiPath="collection-api/managed-attribute"
        keys={["attr_1"]}
        disabled={true}
      />,
      testCtx
    );

    expect(hookResult.data).toBeUndefined();
    expect(hookResult.loading).toBe(false);
    expect(mockGet).not.toHaveBeenCalled();
  });

  it("Fetches managed attributes successfully with default options", async () => {
    mockGet.mockResolvedValueOnce({ data: MOCK_MANAGED_ATTRIBUTES });

    mountWithAppContext(
      <TestComponent
        baseApiPath="collection-api/managed-attribute"
        keys={["attr_1", "attr_2"]}
      />,
      testCtx
    );

    await waitFor(() => {
      expect(hookResult.data).toEqual(MOCK_MANAGED_ATTRIBUTES);
    });

    expect(mockGet).toHaveBeenCalledTimes(1);
    expect(mockGet).toHaveBeenCalledWith("collection-api/managed-attribute", {
      header: {
        Accept: "application/vnd.api+json",
        "Content-Type": "application/vnd.api+json"
      },
      filter: {
        key: { IN: "attr_1,attr_2" }
      },
      page: { limit: 2 }
    });
  });

  it("Includes dinaComponent filter when dinaComponent parameter is provided", async () => {
    mockGet.mockResolvedValueOnce({ data: MOCK_MANAGED_ATTRIBUTES });

    mountWithAppContext(
      <TestComponent
        baseApiPath="collection-api/managed-attribute"
        dinaComponent="MATERIAL_SAMPLE"
        keys={["attr_1", "attr_2"]}
      />,
      testCtx
    );

    await waitFor(() => {
      expect(hookResult.data).toEqual(MOCK_MANAGED_ATTRIBUTES);
    });

    expect(mockGet).toHaveBeenCalledWith(
      "collection-api/managed-attribute",
      expect.objectContaining({
        filter: expect.objectContaining({
          managedAttributeComponent: { EQ: "MATERIAL_SAMPLE" }
        })
      })
    );
  });

  it("Constructs controlled vocabulary API path and filters correctly when isControlledVocabulary is true", async () => {
    mockGet.mockResolvedValueOnce({ data: MOCK_CV_ITEMS });

    mountWithAppContext(
      <TestComponent
        baseApiPath="collection-api"
        dinaComponent="MATERIAL_SAMPLE"
        keys={["attr_1"]}
        isControlledVocabulary={true}
        controlledVocabularyId="test-cv-uuid"
      />,
      testCtx
    );

    await waitFor(() => {
      expect(hookResult.data).toEqual(MOCK_CV_ITEMS);
    });

    expect(mockGet).toHaveBeenCalledWith(
      "collection-api/controlled-vocabulary-item",
      {
        header: {
          Accept: "application/vnd.api+json",
          "Content-Type": "application/vnd.api+json"
        },
        filter: {
          key: { IN: "attr_1" },
          dinaComponent: { EQ: "MATERIAL_SAMPLE" },
          "controlledVocabulary.uuid": { EQ: "test-cv-uuid" }
        },
        page: { limit: 1 }
      }
    );
  });

  it("Returns an empty array when API returns no data", async () => {
    mockGet.mockResolvedValueOnce({ data: null });

    mountWithAppContext(
      <TestComponent
        baseApiPath="collection-api/managed-attribute"
        keys={["non_existent_key"]}
      />,
      testCtx
    );

    await waitFor(() => {
      expect(hookResult.data).toEqual([]);
    });
  });
});
