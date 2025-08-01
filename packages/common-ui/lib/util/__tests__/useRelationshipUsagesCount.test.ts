import { renderHook, waitFor } from "@testing-library/react";
import Kitsu from "kitsu";
import { useRelationshipUsagesCount } from "../useRelationshipUsagesCount";

const mockGet = jest.fn();
const mockApiClient = {
  get: mockGet
} as unknown as Kitsu;

describe("useRelationshipUsagesCount hook", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("Should return the total resource count when the API provides it", async () => {
    mockGet.mockResolvedValueOnce({
      meta: {
        totalResourceCount: 5
      }
    });

    const testUUID = "29b0f94e-dbe5-41cc-b9e9-4d64f16740ee";
    const relationshipName = "collectingEvent";
    const resourcePath = "collection-api/material-sample";

    // Render the hook
    const { result } = renderHook(() =>
      useRelationshipUsagesCount({
        apiClient: mockApiClient,
        resourcePath,
        relationshipName,
        relationshipId: testUUID
      })
    );

    // Initial state: loading is true, count is undefined
    expect(result.current.isLoading).toBe(true);
    expect(result.current.usageCount).toBeUndefined();
    expect(result.current.error).toBeUndefined();

    // Wait for the hook's async effect to complete and state to update
    await waitFor(() => {
      // Final state: loading is false, count is 5
      expect(result.current.isLoading).toBe(false);
      expect(result.current.usageCount).toBe(5);
      expect(result.current.error).toBeUndefined();
    });

    // Verify that the apiClient.get was called with the correct parameters.
    expect(mockGet).toHaveBeenCalledWith(resourcePath, {
      filter: {
        [`${relationshipName}.id`]: {
          EQ: testUUID
        }
      },
      page: {
        limit: 0
      }
    });
    expect(mockGet).toHaveBeenCalledTimes(1);
  });

  it("Should return 0 when the API response does not include a totalResourceCount", async () => {
    mockGet.mockResolvedValueOnce({
      meta: {} // No totalResourceCount
    });

    // Render the hook
    const { result } = renderHook(() =>
      useRelationshipUsagesCount({
        apiClient: mockApiClient,
        relationshipId: "7ae96218-184d-418f-a3dc-32373d10dc0a",
        relationshipName: "collectingEvent",
        resourcePath: "collection-api/material-sample"
      })
    );

    // Wait for the async effect to resolve
    await waitFor(() => {
      // The hook should safely default the count to 0
      expect(result.current.usageCount).toBe(0);
      expect(result.current.isLoading).toBe(false);
    });
  });

  it("Should return 0 when the API response does not include a meta object", async () => {
    // Mock an API response completely missing the meta object.
    mockGet.mockResolvedValueOnce({
      data: [] // No meta object at all
    });

    // Render the hook
    const { result } = renderHook(() =>
      useRelationshipUsagesCount({
        apiClient: mockApiClient,
        relationshipId: "45767348-d46c-4834-aac0-8aef5db428c0",
        relationshipName: "parentStorageUnit",
        resourcePath: "collection-api/storage-unit"
      })
    );

    // Wait for the hook to finish loading
    await waitFor(() => {
      expect(result.current.usageCount).toBe(0);
      expect(result.current.isLoading).toBe(false);
    });
  });

  it("Should handle API errors and update the error state", async () => {
    const errorMessage = "Network error";
    mockGet.mockRejectedValueOnce(new Error(errorMessage));

    // Render the hook
    const { result } = renderHook(() =>
      useRelationshipUsagesCount({
        apiClient: mockApiClient,
        relationshipId: "44f71c2f-418f-4e3f-ab6f-c4e0acdd4fc4",
        relationshipName: "collectingEvent",
        resourcePath: "collection-api/material-sample"
      })
    );

    // Initial state is loading
    expect(result.current.isLoading).toBe(true);

    // Wait for the hook to handle the rejection
    await waitFor(() => {
      // Final state: error is set, loading is false, count is undefined
      expect(result.current.isLoading).toBe(false);
      expect(result.current.usageCount).toBeUndefined();
      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe(errorMessage);
    });

    expect(mockGet).toHaveBeenCalledTimes(1);
  });

  it("Should not fetch if required parameters are missing", () => {
    const { result } = renderHook(() =>
      useRelationshipUsagesCount({
        apiClient: mockApiClient,
        resourcePath: "collection-api/material-sample",
        relationshipName: "collectingEvent",
        relationshipId: undefined // Missing param
      })
    );

    // Hook should immediately return its initial, non-loading state
    expect(result.current.isLoading).toBe(false);
    expect(result.current.usageCount).toBeUndefined();
    expect(result.current.error).toBeUndefined();

    // Crucially, the API should not have been called
    expect(mockGet).not.toHaveBeenCalled();
  });
});
