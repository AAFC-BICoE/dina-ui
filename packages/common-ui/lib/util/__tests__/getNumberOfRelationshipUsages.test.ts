import { getNumberOfRelationshipUsages } from "../getNumberOfRelationshipUsages";
import Kitsu from "kitsu";

const mockGet = jest.fn();
const mockApiClient = {
  get: mockGet
} as unknown as Kitsu;

describe("getNumberOfRelationshipUsages", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("Should return the total resource count when the API provides it", async () => {
    // Mock the API response for this test case.
    mockGet.mockResolvedValueOnce({
      meta: {
        totalResourceCount: 5
      }
    });

    const testUUID = "29b0f94e-dbe5-41cc-b9e9-4d64f16740ee";
    const relationshipName = "collectingEvent";
    const resourcePath = "collection-api/material-sample";

    const numberOfUsages = await getNumberOfRelationshipUsages({
      apiClient: mockApiClient,
      resourcePath,
      relationshipName,
      relationshipId: testUUID
    });

    // Expect the function to return the count from the meta object.
    expect(numberOfUsages).toBe(5);

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
    // Mock an API response without the totalResourceCount.
    mockGet.mockResolvedValueOnce({
      meta: {} // No totalResourceCount
    });

    const testUUID = "7ae96218-184d-418f-a3dc-32373d10dc0a";
    const relationshipName = "collectingEvent";
    const resourcePath = "collection-api/material-sample";

    const numberOfUsages = await getNumberOfRelationshipUsages({
      apiClient: mockApiClient,
      resourcePath,
      relationshipName,
      relationshipId: testUUID
    });

    // Expect the function to safely default to 0.
    expect(numberOfUsages).toBe(0);

    // Verify the call was still made correctly.
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

  it("Should return 0 when the API response does not include a meta object", async () => {
    // Mock an API response completely missing the meta object.
    mockGet.mockResolvedValueOnce({
      data: [] // No meta object at all
    });

    const testUUID = "45767348-d46c-4834-aac0-8aef5db428c0";
    const relationshipName = "parentStorageUnit";
    const resourcePath = "collection-api/storage-unit";

    const numberOfUsages = await getNumberOfRelationshipUsages({
      apiClient: mockApiClient,
      resourcePath,
      relationshipName,
      relationshipId: testUUID
    });

    // Expect the function to handle this gracefully and return 0.
    expect(numberOfUsages).toBe(0);
  });

  it("Should handle API errors, expect error to be thrown", async () => {
    // Mock an API call that rejects with an error.
    const errorMessage = "Network error";
    mockGet.mockRejectedValueOnce(new Error(errorMessage));

    const testUUID = "44f71c2f-418f-4e3f-ab6f-c4e0acdd4fc4";
    const relationshipName = "collectingEvent";
    const resourcePath = "collection-api/material-sample";

    // The function is async, so we test the rejection.
    await expect(
      getNumberOfRelationshipUsages({
        apiClient: mockApiClient,
        resourcePath,
        relationshipName,
        relationshipId: testUUID
      })
    ).rejects.toThrow(errorMessage);
    expect(mockGet).toHaveBeenCalledTimes(1);
  });
});
