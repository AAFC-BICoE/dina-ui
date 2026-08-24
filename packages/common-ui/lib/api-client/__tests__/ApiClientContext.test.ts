import axios, { AxiosError } from "axios";
import Kitsu from "kitsu";
import {
  ApiClientImpl,
  CustomDinaKitsu,
  getErrorMessages,
  makeAxiosErrorMoreReadable
} from "../ApiClientContext";
import { OperationVerb } from "../operations-types";
import { isEqual } from "lodash";
interface TestPcrPrimer {
  name: string;
  lotNumber: number;
  type: string;
}
import {
  MOCK_BULK_CREATE_DATA,
  MOCK_BULK_CREATE_INPUT,
  MOCK_BULK_DELETE_RESPONSE,
  MOCK_BULK_GET_DATA,
  MOCK_BULK_GET_RESPONSE,
  MOCK_BULK_GET_RESPONSE_INCLUDE_ORGANIZATIONS,
  MOCK_BULK_UPDATE_DATA,
  MOCK_BULK_UPDATE_INPUT,
  MOCK_BULK_UPDATE_RESPONSE,
  TODO_INSERT_OPERATION,
  MOCK_BULK_GET_404_ERROR_OBJECT,
  MOCK_BULK_GET_404_ERROR_INPUT,
  MOCK_BULK_GET_410_ERROR_INPUT,
  MOCK_BULK_GET_410_ERROR_OBJECT,
  MOCK_BULK_GET_410_404_ERROR_INPUT,
  MOCK_BULK_GET_404_ERROR_INPUT_2,
  MOCK_BULK_GET_RESPONSE_DESERIALIZED,
  MOCK_BULK_GET_RESPONSE_INCLUDE_ORGANIZATIONS_DESERIALIZED,
  MOCK_BULK_UPDATE_RESPONSE_DESERIALIZED,
  MOCK_BULK_GET_404_RESPONSE_DESERIALIZED,
  MOCK_BULK_GET_410_RESPONSE_DESERIALIZED,
  MOCK_BULK_GET_410_404_RESPONSE_DESERIALIZED,
  MOCK_GET_ERROR
} from "../__mocks__/ApiClientContextMocks";
import { waitFor } from "@testing-library/dom";
import { buildMemoryStorage, setupCache } from "axios-cache-interceptor";

/** Mock of Axios' patch function. */
const mockPatch: jest.Mock<any, any> = jest.fn((_url, data, _config) => {
  if (isEqual(data, MOCK_BULK_UPDATE_DATA)) {
    return MOCK_BULK_UPDATE_RESPONSE;
  }
});

const mockPost: jest.Mock<any, any> = jest.fn((url, data, _config) => {
  const queryString = new URLSearchParams(url.substring(url.indexOf("?")));
  if (url.includes("bulk-load")) {
    if (queryString.has("include")) {
      const includes = queryString.get("include")?.split(",");
      if (includes?.includes("organizations")) {
        return Promise.resolve(MOCK_BULK_GET_RESPONSE_INCLUDE_ORGANIZATIONS);
      }
    }
    if (isEqual(data, MOCK_BULK_GET_DATA)) {
      return Promise.resolve(
        JSON.parse(JSON.stringify(MOCK_BULK_GET_RESPONSE))
      ); // make a deep copy to avoid mutating the original mock data
    }
    if (isEqual(data, MOCK_BULK_GET_404_ERROR_INPUT)) {
      // Simulate an error being intercepted by the API client, since it does not with Promise.reject.
      makeAxiosErrorMoreReadable(MOCK_BULK_GET_404_ERROR_OBJECT);
    }
    if (isEqual(data, MOCK_BULK_GET_410_ERROR_INPUT)) {
      makeAxiosErrorMoreReadable(MOCK_BULK_GET_410_ERROR_OBJECT);
    }
    if (isEqual(data, MOCK_BULK_GET_410_404_ERROR_INPUT)) {
      makeAxiosErrorMoreReadable(MOCK_BULK_GET_410_ERROR_OBJECT);
    }
    if (isEqual(data, MOCK_BULK_GET_404_ERROR_INPUT_2)) {
      makeAxiosErrorMoreReadable(MOCK_BULK_GET_404_ERROR_OBJECT);
    }
  } else {
    if (isEqual(data.data, MOCK_BULK_CREATE_DATA)) {
      return Promise.resolve(
        JSON.parse(JSON.stringify(MOCK_BULK_GET_RESPONSE))
      ); // make a deep copy to avoid mutating the original mock data
    }
  }
});

const mockDelete: jest.Mock<any, any> = jest.fn((_, data) => {
  if (isEqual(data.data, MOCK_BULK_GET_DATA)) {
    return MOCK_BULK_DELETE_RESPONSE;
  }
});

const mockGet = jest.fn((url, _) => {
  if (isEqual(url, "/agent-api/person/doesn't-exist")) {
    makeAxiosErrorMoreReadable(MOCK_GET_ERROR);
  }
});

const {
  apiClient,
  bulkGet,
  doOperations,
  save,
  bulkLoadResources,
  bulkDeleteResources,
  bulkCreateResources,
  bulkUpdateResources
} = new ApiClientImpl({
  newId: () => "00000000-0000-0000-0000-000000000000"
});

// Add the mocked "patch" method to the Axios instance:
apiClient.axios = {
  patch: mockPatch,
  post: mockPost,
  delete: mockDelete,
  get: mockGet
} as any;

describe("API client context", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it("Provides an API client instance.", () => {
    expect(apiClient instanceof Kitsu).toEqual(true);
  });

  describe("doOperations", () => {
    it("Single POST: submits JSON:API request to /{path} (no /operations jsonpatch).", async () => {
      mockPost.mockImplementationOnce(async (_url, body, _config) => {
        return {
          status: 201,
          data: {
            data: body.data
          }
        } as any;
      });

      const response = await doOperations(TODO_INSERT_OPERATION);

      expect(mockPost).toHaveBeenCalledTimes(1);

      const [url, body, config] = mockPost.mock.calls[0];

      expect(url).toBe("/todo");
      expect(body).toEqual({ data: TODO_INSERT_OPERATION[0].value });

      // JSON:API headers for single-op requests:
      expect(config).toEqual({
        headers: {
          Accept: "application/vnd.api+json",
          "Content-Type": "application/vnd.api+json",
          "Crnk-Compact": "true"
        }
      });

      expect(response).toEqual([
        {
          data: TODO_INSERT_OPERATION[0].value,
          included: undefined,
          status: 201
        }
      ]);
    });

    it("Returns a null response if returnNullForMissingResource is true and an error is thrown.", async () => {
      const operations = [
        {
          op: "GET" as OperationVerb,
          path: "person/doesn't-exist"
        }
      ];
      const response = await doOperations(operations, {
        returnNullForMissingResource: true,
        apiBaseUrl: "/agent-api"
      });

      expect(response).toEqual([
        {
          data: null,
          status: 404
        }
      ]);
      expect(mockGet).toHaveBeenCalledTimes(1);
      expect(mockGet.mock.calls[0][0]).toBe("/agent-api/person/doesn't-exist");
    });

    it("Multi PATCH: calls /{apiBaseUrl}/{resourceType}/bulk with ext=bulk headers and returns per-item results.", async () => {
      const ids = [
        "019df432-dceb-7698-99c0-66836da0bfa8",
        "019df433-13bd-72ab-8c9c-8806e12f1aee",
        "019df433-3071-75ef-b0c2-65acae6a1eea"
      ];

      const ops = ids.map((id) => ({
        op: "PATCH" as OperationVerb,
        path: `material-sample/${id}`,
        value: {
          type: "material-sample",
          id,
          attributes: { barcode: "new barcode" }
        }
      }));

      mockPatch.mockImplementationOnce(async (_url, body, _config) => {
        return {
          status: 200,
          data: {
            data: body.data.map((r: any) => ({
              id: r.id,
              type: r.type,
              attributes: r.attributes
            })),
            meta: { moduleVersion: "0.118" }
          }
        } as any;
      });

      const response = await doOperations(ops as any, {
        apiBaseUrl: "/collection-api"
      });

      // Verify it used the bulk endpoint:
      expect(mockPatch).toHaveBeenCalledTimes(1);
      const [url, body, config] = mockPatch.mock.calls[0];

      expect(url).toBe("/collection-api/material-sample/bulk");
      expect(body).toEqual({
        data: ops.map((o) => o.value)
      });

      // Verify ext=bulk headers.
      expect(config).toEqual({
        headers: {
          "Content-Type": "application/vnd.api+json; ext=bulk",
          Accept: "application/vnd.api+json"
        }
      });

      expect(response).toEqual([
        {
          data: { id: ids[0], type: "material-sample", barcode: "new barcode" },
          included: undefined,
          status: 200
        },
        {
          data: { id: ids[1], type: "material-sample", barcode: "new barcode" },
          included: undefined,
          status: 200
        },
        {
          data: { id: ids[2], type: "material-sample", barcode: "new barcode" },
          included: undefined,
          status: 200
        }
      ]);
    });

    it("Multi POST: calls /{apiBaseUrl}/{resourceType}/bulk and returns per-item results.", async () => {
      const ops = [
        {
          op: "POST" as OperationVerb,
          path: "material-sample",
          value: {
            type: "material-sample",
            id: "new-1",
            attributes: { barcode: "b1" }
          }
        },
        {
          op: "POST" as OperationVerb,
          path: "material-sample",
          value: {
            type: "material-sample",
            id: "new-2",
            attributes: { barcode: "b2" }
          }
        }
      ];

      mockPost.mockImplementationOnce(async (_url, body, _config) => {
        return {
          status: 201,
          data: {
            data: body.data.map((r: any) => ({
              id: r.id,
              type: r.type,
              attributes: r.attributes
            }))
          }
        } as any;
      });

      const response = await doOperations(ops as any, {
        apiBaseUrl: "/collection-api"
      });

      expect(mockPost).toHaveBeenCalledTimes(1);

      const [url, body, config] = mockPost.mock.calls[0];

      expect(url).toBe("/collection-api/material-sample/bulk");
      expect(body).toEqual({ data: ops.map((o) => o.value) });

      expect(config).toEqual({
        headers: {
          "Content-Type": "application/vnd.api+json; ext=bulk",
          Accept: "application/vnd.api+json"
        }
      });

      expect(response).toEqual([
        {
          data: { id: "new-1", type: "material-sample", barcode: "b1" },
          included: undefined,
          status: 201
        },
        {
          data: { id: "new-2", type: "material-sample", barcode: "b2" },
          included: undefined,
          status: 201
        }
      ]);
    });

    it("Empty operations: returns [] and warns.", async () => {
      const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
      const res = await doOperations([]);
      expect(res).toEqual([]);
      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });
  });

  describe("save", () => {
    it("Provides a save function that can create resources (bulk POST).", async () => {
      mockPost.mockImplementationOnce(async (_url, body) => ({
        status: 201,
        data: {
          data: body.data.map((r: any, i: number) => ({
            id: String(123 + i),
            type: r.type,
            attributes: r.attributes
          }))
        }
      }));

      const response = await save<TestPcrPrimer>([
        {
          resource: {
            lotNumber: 1,
            name: "testPrimer1",
            type: "pcrPrimer"
          } as TestPcrPrimer,
          type: "pcrPrimer"
        },
        {
          resource: {
            lotNumber: 1,
            name: "testPrimer2",
            type: "pcrPrimer"
          } as TestPcrPrimer,
          type: "pcrPrimer"
        }
      ]);

      // bulk POST is used
      expect(mockPost).toHaveBeenCalledTimes(1);
      expect(mockPost.mock.calls[0][0]).toBe("/pcrPrimer/bulk");

      expect(response).toEqual([
        {
          id: "123",
          lotNumber: 1,
          name: "testPrimer1",
          type: "pcrPrimer"
        },
        {
          id: "124",
          lotNumber: 1,
          name: "testPrimer2",
          type: "pcrPrimer"
        }
      ]);
    });

    it("Provides a save function that can create a single resource (single POST).", async () => {
      mockPost.mockImplementationOnce(async (_url, body) => {
        // Handle both single objects and arrays gracefully based on doOperations behavior
        const dataArray = Array.isArray(body.data) ? body.data : [body.data];
        return {
          status: 201,
          data: {
            data: dataArray.map((r: any) => ({
              id: "123",
              type: r.type,
              attributes: r.attributes
            }))
          }
        };
      });

      const response = await save<TestPcrPrimer>([
        {
          resource: {
            lotNumber: 1,
            name: "singleTestPrimer",
            type: "pcrPrimer"
          } as TestPcrPrimer,
          type: "pcrPrimer"
        }
      ]);

      // Single POST is used
      expect(mockPost).toHaveBeenCalledTimes(1);

      // Asserts that a single resource targets the base collection endpoint
      expect(mockPost.mock.calls[0][0]).toBe("/pcrPrimer");

      expect(response).toEqual([
        [
          {
            id: "123",
            lotNumber: 1,
            name: "singleTestPrimer",
            type: "pcrPrimer"
          }
        ]
      ]);
    });

    it("Provides a save function that can update resources (bulk PATCH).", async () => {
      mockPatch.mockImplementationOnce(async (_url, body) => ({
        status: 200,
        data: {
          data: body.data.map((r: any) => ({
            id: r.id,
            type: r.type,
            attributes: r.attributes
          }))
        }
      }));

      const response = await save([
        {
          resource: {
            id: "123",
            lotNumber: 1,
            name: "testPrimer1 edited",
            type: "pcrPrimer"
          } as TestPcrPrimer,
          type: "pcrPrimer"
        },
        {
          resource: {
            id: "124",
            lotNumber: 1,
            name: "testPrimer2 edited",
            type: "pcrPrimer"
          } as TestPcrPrimer,
          type: "pcrPrimer"
        }
      ]);

      expect(mockPatch).toHaveBeenCalledTimes(1);
      expect(mockPatch.mock.calls[0][0]).toBe("/pcrPrimer/bulk");

      expect(response).toEqual([
        {
          id: "123",
          lotNumber: 1,
          name: "testPrimer1 edited",
          type: "pcrPrimer"
        },
        {
          id: "124",
          lotNumber: 1,
          name: "testPrimer2 edited",
          type: "pcrPrimer"
        }
      ]);
    });

    it("Provides a save function that can update a single resource (single PATCH).", async () => {
      mockPatch.mockImplementationOnce(async (_url, body) => {
        const dataArray = Array.isArray(body.data) ? body.data : [body.data];
        return {
          status: 200,
          data: {
            data: dataArray.map((r: any) => ({
              id: r.id,
              type: r.type,
              attributes: r.attributes
            }))
          }
        };
      });

      const response = await save<TestPcrPrimer>([
        {
          resource: {
            id: "123",
            lotNumber: 1,
            name: "singleTestPrimer edited",
            type: "pcrPrimer"
          } as TestPcrPrimer,
          type: "pcrPrimer"
        }
      ]);

      // Single PATCH is used
      expect(mockPatch).toHaveBeenCalledTimes(1);

      // Asserts that a single resource targets the specific resource ID endpoint
      expect(mockPatch.mock.calls[0][0]).toBe("/pcrPrimer/123");

      expect(response).toEqual([
        [
          {
            id: "123",
            lotNumber: 1,
            name: "singleTestPrimer edited",
            type: "pcrPrimer"
          }
        ]
      ]);
    });

    it("Provides a save function that can delete resources (single DELETE).", async () => {
      mockDelete.mockImplementationOnce(async () => ({
        status: 204
      }));

      const response = await save([
        { delete: { id: "1234", type: "test-type" } }
      ]);

      expect(mockDelete).toHaveBeenCalledTimes(1);
      expect(mockDelete.mock.calls[0][0]).toBe("/test-type/1234");

      // delete returns undefined resource
      expect(response).toEqual([undefined]);
    });

    it("Removes the 'meta' field when saving to the back-end.", async () => {
      mockPatch.mockImplementationOnce(async (_url, body) => ({
        status: 200,
        data: {
          data: [
            {
              id: body.data.id,
              type: body.data.type,
              attributes: body.data.attributes
            }
          ]
        }
      }));

      await save([
        {
          resource: {
            id: "123",
            lotNumber: 1,
            name: "testPrimer1 edited",
            meta: {
              permissions: ["create", "update"]
            },
            type: "pcrPrimer"
          } as any,
          type: "pcrPrimer"
        }
      ]);

      const [, body] = mockPatch.mock.calls[0];
      expect(body.data.meta).toBeUndefined();
    });

    it("Forces a single POST operation when forceOperationMethod is 'POST' on one resource with an ID.", async () => {
      mockPost.mockImplementationOnce(async (_url, body) => {
        const dataArray = Array.isArray(body.data) ? body.data : [body.data];
        return {
          status: 201,
          data: {
            data: dataArray.map((r: any) => ({
              id: r.id,
              type: r.type,
              attributes: r.attributes
            }))
          }
        };
      });

      const response = await save<TestPcrPrimer>(
        [
          {
            resource: {
              id: "123", // Would normally default to PATCH due to the ID
              lotNumber: 1,
              name: "forcedSinglePost",
              type: "pcrPrimer"
            } as TestPcrPrimer,
            type: "pcrPrimer"
          }
        ],
        { forceOperationMethod: "POST" }
      );

      expect(mockPost).toHaveBeenCalledTimes(1);
      expect(mockPatch).not.toHaveBeenCalled();

      // For a single operation, it uses the base collection route
      expect(mockPost.mock.calls[0][0]).toBe("/pcrPrimer");

      // Verifies the payload still contains the ID
      const [, body] = mockPost.mock.calls[0];
      const sentData = Array.isArray(body.data) ? body.data[0] : body.data;
      expect(sentData.id).toBe("123");

      expect(response).toEqual([
        [
          {
            id: "123",
            lotNumber: 1,
            name: "forcedSinglePost",
            type: "pcrPrimer"
          }
        ]
      ]);
    });

    it("Forces a single PATCH operation when forceOperationMethod is 'PATCH' on one resource lacking an ID.", async () => {
      mockPatch.mockImplementationOnce(async (_url, body) => {
        const dataArray = Array.isArray(body.data) ? body.data : [body.data];
        return {
          status: 200,
          data: {
            data: dataArray.map((r: any) => ({
              id: r.id,
              type: r.type,
              // Fallback to top-level fields if attributes isn't populated on r
              attributes: {
                lotNumber: r.attributes?.lotNumber ?? r.lotNumber,
                name: r.attributes?.name ?? r.name,
                ...r.attributes
              }
            }))
          }
        };
      });

      await save<TestPcrPrimer>(
        [
          {
            resource: {
              lotNumber: 2,
              name: "forcedSinglePatch",
              type: "pcrPrimer"
            } as TestPcrPrimer,
            type: "pcrPrimer"
          }
        ],
        { forceOperationMethod: "PATCH" }
      );

      expect(mockPatch).toHaveBeenCalledTimes(1);
      expect(mockPost).not.toHaveBeenCalled();

      // The ID is left out of the URL path completely, hitting the base collection routing
      expect(mockPatch.mock.calls[0][0]).toBe("/pcrPrimer");
    });

    it("Forces a single PATCH operation when forceOperationMethod is 'PATCH' on one resource that contains an ID.", async () => {
      mockPatch.mockImplementationOnce(async (_url, body) => {
        const dataArray = Array.isArray(body.data) ? body.data : [body.data];
        return {
          status: 200,
          data: {
            data: dataArray.map((r: any) => ({
              id: r.id,
              type: r.type,
              // Fallback to top-level fields if attributes isn't populated on r
              attributes: {
                lotNumber: r.attributes?.lotNumber ?? r.lotNumber,
                name: r.attributes?.name ?? r.name,
                ...r.attributes
              }
            }))
          }
        };
      });

      await save<TestPcrPrimer>(
        [
          {
            resource: {
              id: "c2237873-fec8-47d9-8145-cd104b20d232",
              lotNumber: 2,
              name: "forcedSinglePatch",
              type: "pcrPrimer"
            } as TestPcrPrimer,
            type: "pcrPrimer"
          }
        ],
        { forceOperationMethod: "PATCH" }
      );

      expect(mockPatch).toHaveBeenCalledTimes(1);
      expect(mockPost).not.toHaveBeenCalled();

      // The ID should be in the route.
      expect(mockPatch.mock.calls[0][0]).toBe(
        "/pcrPrimer/c2237873-fec8-47d9-8145-cd104b20d232"
      );
    });
  });

  describe("bulkGet", () => {
    it("Provides a bulk-get-by-ID function (via bulk-load).", async () => {
      mockPost.mockImplementationOnce(async (_url, body) => ({
        status: 200,
        data: {
          data: body.data.map((r: any) => ({
            id: r.id,
            type: "pcrPrimer",
            attributes: { name: `primer ${r.id}` }
          }))
        }
      }));

      const response = await bulkGet<TestPcrPrimer>([
        "pcrPrimer/123",
        "pcrPrimer/124"
      ]);

      expect(mockPost).toHaveBeenCalledTimes(1);
      expect(mockPost.mock.calls[0][0]).toBe("/pcrPrimer/bulk-load");

      expect(response).toEqual([
        { id: "123", name: "primer 123", type: "pcrPrimer" },
        { id: "124", name: "primer 124", type: "pcrPrimer" }
      ]);
    });

    it("bulkGet can return null entries instead of throwing errors on 404 responses.", async () => {
      const missingIdError: any = {
        isAxiosError: true,
        config: { url: "/pcrPrimer/bulk-load" },
        response: {
          status: 404,
          statusText: "Not Found",
          data: {
            errors: [
              {
                source: { pointer: "/data/id/000" }
              }
            ]
          }
        }
      };

      mockPost.mockImplementationOnce((_url, _body, _config) => {
        makeAxiosErrorMoreReadable(missingIdError);
        return undefined as any;
      });

      mockPost.mockImplementationOnce(async (_url, body, _config) => {
        expect(body).toEqual({
          data: [{ type: "pcrPrimer", id: "123" }]
        });

        return {
          status: 200,
          data: {
            data: [
              {
                id: "123",
                type: "pcrPrimer",
                attributes: { name: "primer 123" }
              }
            ]
          }
        } as any;
      });

      const response = await bulkGet(["pcrPrimer/123", "pcrPrimer/000"], {
        returnNullForMissingResource: true
      });

      expect(response).toEqual([
        { id: "123", name: "primer 123", type: "pcrPrimer" },
        null
      ]);

      // bulk-load should have been attempted twice (error then retry)
      expect(mockPost).toHaveBeenCalledTimes(2);
      expect(mockPost.mock.calls[0][0]).toBe("/pcrPrimer/bulk-load");
      expect(mockPost.mock.calls[1][0]).toBe("/pcrPrimer/bulk-load");
    });

    it("bulkGet batches duplicate IDs and preserves order.", async () => {
      mockPost.mockImplementationOnce(async (_url, body) => ({
        status: 200,
        data: {
          data: body.data.map((r: any) => ({
            id: r.id,
            type: "primer",
            attributes: { name: `primer ${r.id}` }
          }))
        }
      }));

      const response = await bulkGet(
        ["primer/100", "primer/100", "primer/200", "primer/200"],
        { returnNullForMissingResource: true }
      );

      expect(response.map((r) => r?.id)).toEqual(["100", "100", "200", "200"]);

      // only unique IDs sent to bulk-load
      const body = mockPost.mock.calls[0][1];
      expect(body.data).toEqual([
        { type: "primer", id: "100" },
        { type: "primer", id: "200" }
      ]);
    });

    it("bulkGet single includes should be merging the data into one response", async () => {
      const bulkApiResponse = {
        data: {
          id: "3f5cc46b-a247-4195-a3d7-9e4334ece945",
          type: "metadata",
          attributes: {
            originalFilename: "RAWCANON-30D.CR2",
            filename: "rawr",
            dcFormat: "image/CR2"
          },
          relationships: {
            derivatives: {
              data: [
                {
                  id: "63d2fd88-6d92-45cb-b8fe-2c1d795d1bee",
                  type: "derivative"
                },
                {
                  id: "2feaca8b-34eb-475e-b449-f981e0275b6c",
                  type: "derivative"
                }
              ]
            }
          }
        },
        included: [
          {
            id: "2feaca8b-34eb-475e-b449-f981e0275b6c",
            type: "derivative",
            attributes: {
              derivativeType: "LARGE_IMAGE",
              fileExtension: ".jpg"
            }
          },
          {
            id: "63d2fd88-6d92-45cb-b8fe-2c1d795d1bee",
            type: "derivative",
            attributes: {
              derivativeType: "THUMBNAIL_IMAGE",
              fileExtension: ".jpg"
            }
          }
        ],
        meta: {
          moduleVersion: "1.36"
        }
      };

      mockGet.mockImplementationOnce(async () => ({
        status: 200,
        data: bulkApiResponse
      }));

      const paths = [
        "metadata/3f5cc46b-a247-4195-a3d7-9e4334ece945?include=derivatives"
      ];

      const response = await bulkGet(paths, {
        apiBaseUrl: "/objectstore-api"
      });

      // Verify the bulk-load request URL and body batching
      expect(mockGet).toHaveBeenCalledTimes(1);
      expect(mockGet.mock.calls[0][0]).toBe(
        "/objectstore-api/metadata/3f5cc46b-a247-4195-a3d7-9e4334ece945?include=derivatives"
      );

      // Verify response order and merged includes
      expect(response).toEqual([
        {
          dcFormat: "image/CR2",
          derivatives: [
            {
              derivativeType: "THUMBNAIL_IMAGE",
              fileExtension: ".jpg",
              id: "63d2fd88-6d92-45cb-b8fe-2c1d795d1bee",
              type: "derivative"
            },
            {
              derivativeType: "LARGE_IMAGE",
              fileExtension: ".jpg",
              id: "2feaca8b-34eb-475e-b449-f981e0275b6c",
              type: "derivative"
            }
          ],
          filename: "rawr",
          id: "3f5cc46b-a247-4195-a3d7-9e4334ece945",
          originalFilename: "RAWCANON-30D.CR2",
          type: "metadata"
        }
      ]);
    });

    it("bulkGet multiple includes should be merging the data into one response", async () => {
      const bulkApiResponse = {
        data: [
          {
            id: "3a0538a4-a483-4d4b-813b-2ceadd310bee",
            type: "metadata",
            attributes: {
              originalFilename: "RAWCANON-30D.CR2",
              filename: "rawr",
              dcFormat: "image/CR2"
            },
            relationships: {
              derivatives: {
                data: [
                  {
                    id: "ee69dd9f-862c-4034-bc20-dde0b52ff56e",
                    type: "derivative"
                  },
                  {
                    id: "77f87eb5-ac8e-41bc-b195-b7f4e0c00592",
                    type: "derivative"
                  }
                ]
              }
            }
          },
          {
            id: "b8a9f92b-cf04-461b-b4b4-d439fd47dac3",
            type: "metadata",
            attributes: {
              originalFilename: "profile_picture.jpg",
              filename: "profile_picture.jpg",
              dcFormat: "image/jpeg"
            },
            relationships: {
              derivatives: {
                data: [
                  {
                    id: "7648ba7b-0145-4a12-9912-ef8675b762c9",
                    type: "derivative"
                  }
                ]
              }
            }
          },
          {
            id: "3f5cc46b-a247-4195-a3d7-9e4334ece945",
            type: "metadata",
            attributes: {
              originalFilename: "RAWCANON-30D.CR2",
              filename: "RAWCANON-30D.CR2",
              dcFormat: "image/CR2"
            },
            relationships: {
              derivatives: {
                data: [
                  {
                    id: "63d2fd88-6d92-45cb-b8fe-2c1d795d1bee",
                    type: "derivative"
                  },
                  {
                    id: "2feaca8b-34eb-475e-b449-f981e0275b6c",
                    type: "derivative"
                  }
                ]
              }
            }
          }
        ],
        included: [
          {
            id: "7648ba7b-0145-4a12-9912-ef8675b762c9",
            type: "derivative",
            attributes: {
              derivativeType: "THUMBNAIL_IMAGE",
              fileExtension: ".jpg"
            }
          },
          {
            id: "77f87eb5-ac8e-41bc-b195-b7f4e0c00592",
            type: "derivative",
            attributes: {
              filename: "IMG_3064.JPG",
              derivativeType: "LARGE_IMAGE"
            }
          },
          {
            id: "2feaca8b-34eb-475e-b449-f981e0275b6c",
            type: "derivative",
            attributes: {
              filename: "IMG_2992_2.JPG",
              derivativeType: "LARGE_IMAGE"
            }
          },
          {
            id: "ee69dd9f-862c-4034-bc20-dde0b52ff56e",
            type: "derivative",
            attributes: {
              derivativeType: "THUMBNAIL_IMAGE",
              fileExtension: ".jpg"
            }
          },
          {
            id: "63d2fd88-6d92-45cb-b8fe-2c1d795d1bee",
            type: "derivative",
            attributes: {
              derivativeType: "THUMBNAIL_IMAGE",
              fileExtension: ".jpg"
            }
          }
        ]
      };

      mockPost.mockImplementationOnce(async () => ({
        status: 200,
        data: bulkApiResponse
      }));

      const paths = [
        "metadata/3a0538a4-a483-4d4b-813b-2ceadd310bee?include=derivatives",
        "metadata/b8a9f92b-cf04-461b-b4b4-d439fd47dac3?include=derivatives",
        "metadata/3f5cc46b-a247-4195-a3d7-9e4334ece945?include=derivatives"
      ];

      const response = await bulkGet(paths, {
        apiBaseUrl: "/objectstore-api"
      });

      // Verify the bulk-load request URL and body batching
      expect(mockPost).toHaveBeenCalledTimes(1);
      expect(mockPost.mock.calls[0][0]).toBe(
        "/objectstore-api/metadata/bulk-load?include=derivatives"
      );
      expect(mockPost.mock.calls[0][1]).toEqual({
        data: [
          { type: "metadata", id: "3a0538a4-a483-4d4b-813b-2ceadd310bee" },
          { type: "metadata", id: "b8a9f92b-cf04-461b-b4b4-d439fd47dac3" },
          { type: "metadata", id: "3f5cc46b-a247-4195-a3d7-9e4334ece945" }
        ]
      });

      // Verify response order and merged includes
      expect(response).toEqual([
        {
          dcFormat: "image/CR2",
          derivatives: [
            {
              id: "ee69dd9f-862c-4034-bc20-dde0b52ff56e",
              type: "derivative",
              derivativeType: "THUMBNAIL_IMAGE",
              fileExtension: ".jpg"
            },
            {
              id: "77f87eb5-ac8e-41bc-b195-b7f4e0c00592",
              type: "derivative",
              filename: "IMG_3064.JPG",
              derivativeType: "LARGE_IMAGE"
            }
          ],
          filename: "rawr",
          id: "3a0538a4-a483-4d4b-813b-2ceadd310bee",
          originalFilename: "RAWCANON-30D.CR2",
          type: "metadata"
        },
        {
          dcFormat: "image/jpeg",
          derivatives: [
            {
              id: "7648ba7b-0145-4a12-9912-ef8675b762c9",
              type: "derivative",
              derivativeType: "THUMBNAIL_IMAGE",
              fileExtension: ".jpg"
            }
          ],
          filename: "profile_picture.jpg",
          id: "b8a9f92b-cf04-461b-b4b4-d439fd47dac3",
          originalFilename: "profile_picture.jpg",
          type: "metadata"
        },
        {
          dcFormat: "image/CR2",
          derivatives: [
            {
              id: "63d2fd88-6d92-45cb-b8fe-2c1d795d1bee",
              type: "derivative",
              derivativeType: "THUMBNAIL_IMAGE",
              fileExtension: ".jpg"
            },
            {
              id: "2feaca8b-34eb-475e-b449-f981e0275b6c",
              type: "derivative",
              filename: "IMG_2992_2.JPG",
              derivativeType: "LARGE_IMAGE"
            }
          ],
          filename: "RAWCANON-30D.CR2",
          id: "3f5cc46b-a247-4195-a3d7-9e4334ece945",
          originalFilename: "RAWCANON-30D.CR2",
          type: "metadata"
        }
      ]);
    });
  });

  describe("getErrorMessages and error message handling", () => {
    it("Provides a function to improve the info shown from Axios errors.", () => {
      const axiosError = {
        isAxiosError: true,
        config: {
          url: "/test-url"
        },
        response: {
          statusText: "Test Error"
        }
      };

      expect(() =>
        makeAxiosErrorMoreReadable(axiosError as AxiosError)
      ).toThrow(new Error("/test-url: Test Error"));
    });

    it("Shows a special case error message for 502 bad gateway errors.", () => {
      const axiosError = {
        isAxiosError: true,
        config: {
          url: "/agent-api/operations"
        },
        response: {
          status: 502,
          statusText: "Bad Gateway"
        }
      };

      expect(() =>
        makeAxiosErrorMoreReadable(axiosError as AxiosError)
      ).toThrow(
        new Error("Service unavailable:\n/agent-api/operations: Bad Gateway")
      );
    });

    it("Shows error messages coming from Spring Boot (In addition to Crnk's format).", () => {
      const axiosError = {
        isAxiosError: true,
        config: {
          url: "/agent-api/operations"
        },
        response: {
          status: 422,
          statusText: "Unprocessable Entity",
          data: {
            errors: [
              {
                status: "422",
                title: "Data integrity violation",
                detail:
                  "could not execute statement; SQL [n/a]; constraint [fk_metadata_managed_attribute_to_managed_attribute_id]; nested exception is org.hibernate.exception.ConstraintViolationException: could not execute statement"
              }
            ]
          }
        }
      };

      expect(() =>
        makeAxiosErrorMoreReadable(axiosError as AxiosError)
      ).toThrow(
        new Error(
          [
            "/agent-api/operations: Unprocessable Entity",
            "Data integrity violation: could not execute statement; SQL [n/a]; constraint [fk_metadata_managed_attribute_to_managed_attribute_id]; nested exception is org.hibernate.exception.ConstraintViolationException: could not execute statement"
          ].join("\n")
        )
      );
    });

    it("Gets the form-level error message from a failed Operations response.", async () => {
      const messages = getErrorMessages([
        { status: 400, errors: [{ detail: "Error 1" }] },
        { status: 400, errors: [{ detail: "Error 2" }] }
      ]);

      expect(messages).toEqual({
        errorMessage: "Error 1\nError 2",
        fieldErrors: {},
        individualErrors: [
          {
            errorMessage: "Error 1",
            fieldErrors: {},
            index: 0
          },
          {
            errorMessage: "Error 2",
            fieldErrors: {},
            index: 1
          }
        ]
      });
    });

    it("Gets the field-level error messages from a failed Operations response.", async () => {
      const messages = getErrorMessages([
        {
          status: 400,
          errors: [{ source: { pointer: "field1" }, detail: "Error 1" }]
        },
        {
          status: 400,
          errors: [{ source: { pointer: "field2" }, detail: "Error 2" }]
        }
      ]);

      expect(messages).toEqual({
        errorMessage: null,
        fieldErrors: {
          field1: "Error 1",
          field2: "Error 2"
        },
        individualErrors: [
          {
            errorMessage: null,
            fieldErrors: {
              field1: "Error 1"
            },
            index: 0
          },
          {
            errorMessage: null,
            fieldErrors: {
              field2: "Error 2"
            },
            index: 1
          }
        ]
      });
    });

    it("Gets both the form-level and field-level error messages from a failed Operations response.", async () => {
      const messages = getErrorMessages([
        { status: 400, errors: [{ detail: "Form error" }] },
        {
          status: 400,
          errors: [{ source: { pointer: "field1" }, detail: "Error 1" }]
        },
        {
          status: 400,
          errors: [{ source: { pointer: "field2" }, detail: "Error 2" }]
        }
      ]);

      expect(messages).toEqual({
        errorMessage: "Form error",
        fieldErrors: {
          field1: "Error 1",
          field2: "Error 2"
        },
        individualErrors: [
          {
            errorMessage: "Form error",
            fieldErrors: {},
            index: 0
          },
          {
            errorMessage: null,
            fieldErrors: {
              field1: "Error 1"
            },
            index: 1
          },
          {
            errorMessage: null,
            fieldErrors: {
              field2: "Error 2"
            },
            index: 2
          }
        ]
      });
    });
  });

  describe("bulkLoadResources", () => {
    it("Provides a bulkLoadResources function that can get multiple objects by id", async () => {
      const response = await bulkLoadResources(["1", "2", "3"], {
        resourceType: "person",
        apiBaseUrl: "/agent-api"
      });

      // Ensure the correct request was sent
      await waitFor(() => {
        expect(mockPost).toHaveBeenCalledTimes(1);
      });
      expect(mockPost).toHaveBeenCalledWith(
        "/agent-api/person/bulk-load",
        MOCK_BULK_GET_DATA,
        expect.anything()
      );

      expect(response).toEqual(MOCK_BULK_GET_RESPONSE_DESERIALIZED);
    });

    it("Provides a bulkLoadResources function that can get multiple objects by id with includes", async () => {
      const response = await bulkLoadResources(["1", "2", "3"], {
        resourceType: "person",
        apiBaseUrl: "/agent-api",
        include: ["organizations"]
      });

      // Ensure the correct request was sent
      await waitFor(() => {
        expect(mockPost).toHaveBeenCalledTimes(1);
      });
      expect(mockPost).toHaveBeenCalledWith(
        "/agent-api/person/bulk-load?include=organizations",
        MOCK_BULK_GET_DATA,
        expect.anything()
      );

      expect(response).toEqual(
        MOCK_BULK_GET_RESPONSE_INCLUDE_ORGANIZATIONS_DESERIALIZED
      );
    });

    it("Provides a bulkLoadResources function that can get multiple objects by id with includes and optional fields", async () => {
      await bulkLoadResources(["1", "2", "3"], {
        resourceType: "person",
        apiBaseUrl: "/agent-api",
        include: ["organizations"],
        optfields: {
          person: ["name", "age"]
        }
      });

      // Ensure the correct request was sent
      await waitFor(() => {
        expect(mockPost).toHaveBeenCalledTimes(1);
      });
      expect(mockPost).toHaveBeenCalledWith(
        "/agent-api/person/bulk-load?include=organizations&optfields%5Bperson%5D=name%2Cage",
        MOCK_BULK_GET_DATA,
        expect.anything()
      );
    });

    it("Provides a bulkLoadResources function that can handle 404 errors and fill in missing resources with nulls", async () => {
      const response = await bulkLoadResources(
        ["1", "doesn't_exist", "2", "doesn't_exist_2", "3"],
        {
          resourceType: "person",
          apiBaseUrl: "/agent-api",
          returnNullForMissingResource: true
        }
      );

      await waitFor(() => {
        expect(mockPost).toHaveBeenCalledTimes(2);
      });

      expect(response).toEqual(MOCK_BULK_GET_404_RESPONSE_DESERIALIZED);
    });

    it("Provides a bulkLoadResources function that can handle 410 errors and fill in missing resources with nulls", async () => {
      const response = await bulkLoadResources(
        ["1", "deleted", "2", "deleted_2", "3"],
        {
          resourceType: "person",
          apiBaseUrl: "/agent-api",
          returnNullForMissingResource: true
        }
      );

      // 2 calls are expected to happen.
      await waitFor(() => {
        expect(mockPost).toHaveBeenCalledTimes(2);
      });

      expect(response).toEqual(MOCK_BULK_GET_410_RESPONSE_DESERIALIZED);
    });

    it("Provides a bulkLoadResources function that can handle 410 and 404 errors and fill in missing resources with nulls", async () => {
      const response = await bulkLoadResources(
        [
          "doesn't_exist",
          "1",
          "doesn't_exist_2",
          "2",
          "deleted",
          "3",
          "deleted_2"
        ],
        {
          resourceType: "person",
          apiBaseUrl: "/agent-api",
          returnNullForMissingResource: true
        }
      );

      // 3 calls are expected to happen.
      await waitFor(() => {
        expect(mockPost).toHaveBeenCalledTimes(3);
      });

      expect(response).toEqual(MOCK_BULK_GET_410_404_RESPONSE_DESERIALIZED);
    });
  });

  describe("bulkCreateResources", () => {
    it("Provides a bulkCreateResources function that can create multiple objects", async () => {
      const response = await bulkCreateResources(MOCK_BULK_CREATE_INPUT, {
        resourceType: "person",
        apiBaseUrl: "/agent-api"
      });
      expect(response).toEqual(MOCK_BULK_GET_RESPONSE_DESERIALIZED);
    });
  });

  describe("bulkDeleteResources", () => {
    it("Provides a bulkDeleteResources function that can delete multiple objects by id", async () => {
      const response = await bulkDeleteResources(["1", "2", "3"], {
        resourceType: "person",
        apiBaseUrl: "/agent-api"
      });
      expect(response).toEqual(MOCK_BULK_DELETE_RESPONSE);
    });
  });

  describe("bulkUpdateResources", () => {
    it("Provides a bulkUpdateResources function that can update multiple objects", async () => {
      const response = await bulkUpdateResources(MOCK_BULK_UPDATE_INPUT, {
        resourceType: "person",
        apiBaseUrl: "/agent-api"
      });
      expect(response).toEqual(MOCK_BULK_UPDATE_RESPONSE_DESERIALIZED);
    });
  });

  describe("get", () => {
    let kitsu: CustomDinaKitsu;
    let mockAxiosGet: jest.Mock;

    beforeEach(() => {
      kitsu = new CustomDinaKitsu({
        baseURL: "/base-url",
        headers: { myHeader: "my-value" }
      });
      mockAxiosGet = jest.fn();
      kitsu.axios = { get: mockAxiosGet } as any;
    });

    it("Caches repeated identical GET requests instead of hitting the network again", async () => {
      let networkCallCount = 0;

      // A raw axios instance with a fake adapter that counts real "network" calls.
      const rawAxios = axios.create({
        adapter: async (config) => {
          networkCallCount++;
          return {
            data: {
              data: {
                type: "material-sample",
                id: "1",
                attributes: { name: "Sample 1" }
              }
            },
            status: 200,
            statusText: "OK",
            headers: {},
            config
          };
        }
      });

      // Wrap it with the cache interceptor the same way ApiClientImpl does.
      const cachedAxios = setupCache(rawAxios, {
        storage: buildMemoryStorage(false, 1000, 100),
        ttl: 1000
      });

      kitsu.axios = cachedAxios as any;

      await kitsu.get("seqdb-api/material-sample/1");
      await kitsu.get("seqdb-api/material-sample/1");

      // The second call should be served from cache, not hit the adapter again.
      expect(networkCallCount).toBe(1);
    });

    it("Sends a get request without omitting the end of a login URL more than 2 slashes.", async () => {
      const mockAxiosGet = jest.fn(async () => ({
        data: {
          data: [
            {
              type: "articles",
              id: "200",
              attributes: {
                title: "JSON:API paints my bikeshed!"
              },
              relationships: {
                author: {
                  data: { id: "42", type: "people" }
                }
              }
            }
          ],
          included: [
            {
              type: "people",
              id: "42",
              attributes: {
                name: "John"
              }
            }
          ]
        }
      }));

      // Mock axios GET method to make sure called correctly:
      const mockAxios = { get: mockAxiosGet };
      kitsu.axios = mockAxios as any;

      const response = await kitsu.get("my-api/topic/100/articles/200", {
        include: "author"
      });

      expect(mockAxiosGet).lastCalledWith("my-api/topic/100/articles/200", {
        headers: {
          Accept: "application/vnd.api+json",
          "Content-Type": "application/vnd.api+json",
          myHeader: "my-value"
        },
        params: {
          include: "author"
        }
        // paramsSerializer: expect.anything()
      });

      expect(response).toEqual({
        data: [
          {
            author: {
              id: "42",
              name: "John",
              type: "people"
            },
            id: "200",
            title: "JSON:API paints my bikeshed!",
            type: "articles"
          }
        ]
      });
    });

    it("Sends a get request with spaces in the params for comma-separated lists should be trimmed", async () => {
      const mockAxiosGetTrimmed = jest.fn(async () => ({
        data: {
          data: [
            {
              type: "articles",
              id: "200",
              attributes: {
                title: "JSON:API paints my bikeshed!"
              },
              relationships: {
                author: {
                  data: { id: "42", type: "people" }
                },
                tags: {
                  data: { id: "99", type: "tags" }
                }
              }
            }
          ],
          included: [
            {
              type: "people",
              id: "42",
              attributes: {
                name: "John"
              }
            },
            {
              type: "tags",
              id: "99",
              attributes: {
                name: "science"
              }
            }
          ]
        }
      }));

      const mockAxios = { get: mockAxiosGetTrimmed };
      kitsu.axios = mockAxios as any;

      await kitsu.get("my-api/topic/100/articles/200", {
        include: "author, tags",
        fields: {
          articles: "title, body",
          people: "name, age"
        },
        optfields: {
          articles: "title, body",
          people: "name, age"
        }
      });

      expect(mockAxiosGetTrimmed).lastCalledWith(
        "my-api/topic/100/articles/200",
        expect.objectContaining({
          params: {
            include: "author,tags",
            fields: {
              articles: "title,body",
              people: "name,age"
            },
            optfields: {
              articles: "title,body",
              people: "name,age"
            }
          }
        })
      );
    });

    it("Promotes an external single relationship stub to top level on an array response when not in included", async () => {
      mockAxiosGet.mockResolvedValue({
        data: {
          data: [
            {
              type: "generic-molecular-analysis-item",
              id: "dd13d8ec-c284-4ba7-a3a5-4034fd00c8a6",
              attributes: {},
              relationships: {
                materialSample: {
                  data: {
                    id: "019e1846-54ad-719e-9c15-75adca3862d3",
                    type: "material-sample"
                  }
                }
              }
            },
            {
              type: "generic-molecular-analysis-item",
              id: "047bf907-494f-42d1-98b4-fc38164efbff",
              attributes: {},
              relationships: {
                materialSample: {
                  data: {
                    id: "019e1846-7b67-735b-b7fa-771c0e276369",
                    type: "material-sample"
                  }
                }
              }
            }
          ]
          // No included - external relationship
        }
      });

      const response = await kitsu.get(
        "seqdb-api/generic-molecular-analysis-item",
        {
          include: "materialSample"
        }
      );

      expect(response).toEqual({
        data: [
          {
            id: "dd13d8ec-c284-4ba7-a3a5-4034fd00c8a6",
            type: "generic-molecular-analysis-item",
            materialSample: {
              id: "019e1846-54ad-719e-9c15-75adca3862d3",
              type: "material-sample"
            }
          },
          {
            id: "047bf907-494f-42d1-98b4-fc38164efbff",
            type: "generic-molecular-analysis-item",
            materialSample: {
              id: "019e1846-7b67-735b-b7fa-771c0e276369",
              type: "material-sample"
            }
          }
        ]
      });
    });

    it("Promotes an external single relationship stub to top level on a single object response", async () => {
      mockAxiosGet.mockResolvedValue({
        data: {
          data: {
            type: "generic-molecular-analysis-item",
            id: "dd13d8ec-c284-4ba7-a3a5-4034fd00c8a6",
            attributes: {},
            relationships: {
              materialSample: {
                data: {
                  id: "019e1846-54ad-719e-9c15-75adca3862d3",
                  type: "material-sample"
                }
              }
            }
          }
          // No included - external relationship
        }
      });

      const response = await kitsu.get(
        "seqdb-api/generic-molecular-analysis-item/dd13d8ec-c284-4ba7-a3a5-4034fd00c8a6",
        { include: "materialSample" }
      );

      expect(response).toEqual({
        data: {
          id: "dd13d8ec-c284-4ba7-a3a5-4034fd00c8a6",
          type: "generic-molecular-analysis-item",
          materialSample: {
            id: "019e1846-54ad-719e-9c15-75adca3862d3",
            type: "material-sample"
          }
        }
      });
    });

    it("Does not overwrite a relationship that was already resolved via included", async () => {
      mockAxiosGet.mockResolvedValue({
        data: {
          data: [
            {
              type: "articles",
              id: "200",
              attributes: { title: "JSON:API paints my bikeshed!" },
              relationships: {
                author: {
                  data: { id: "42", type: "people" }
                }
              }
            }
          ],
          included: [
            {
              type: "people",
              id: "42",
              attributes: { name: "John" }
            }
          ]
        }
      });

      const response = await kitsu.get("my-api/articles", {
        include: "author"
      });

      // Should have full resolved data from included, not just the stub
      expect(response).toEqual({
        data: [
          {
            id: "200",
            type: "articles",
            title: "JSON:API paints my bikeshed!",
            author: {
              id: "42",
              type: "people",
              name: "John"
            }
          }
        ]
      });
    });

    it("Promotes multiple external relationship stubs to top level", async () => {
      mockAxiosGet.mockResolvedValue({
        data: {
          data: [
            {
              type: "generic-molecular-analysis-item",
              id: "dd13d8ec-c284-4ba7-a3a5-4034fd00c8a6",
              attributes: {},
              relationships: {
                materialSample: {
                  data: {
                    id: "019e1846-54ad-719e-9c15-75adca3862d3",
                    type: "material-sample"
                  }
                },
                storageUnitUsage: {
                  data: {
                    id: "abc123",
                    type: "storage-unit-usage"
                  }
                },
                molecularAnalysisRunItem: {
                  data: {
                    id: "def456",
                    type: "molecular-analysis-run-item"
                  }
                }
              }
            }
          ]
        }
      });

      const response = await kitsu.get(
        "seqdb-api/generic-molecular-analysis-item",
        {
          include: "materialSample,storageUnitUsage,molecularAnalysisRunItem"
        }
      );

      expect(response).toEqual({
        data: [
          {
            id: "dd13d8ec-c284-4ba7-a3a5-4034fd00c8a6",
            type: "generic-molecular-analysis-item",
            materialSample: {
              id: "019e1846-54ad-719e-9c15-75adca3862d3",
              type: "material-sample"
            },
            storageUnitUsage: {
              id: "abc123",
              type: "storage-unit-usage"
            },
            molecularAnalysisRunItem: {
              id: "def456",
              type: "molecular-analysis-run-item"
            }
          }
        ]
      });
    });

    it("Promotes an external to-many relationship stub array to top level", async () => {
      mockAxiosGet.mockResolvedValue({
        data: {
          data: [
            {
              type: "generic-molecular-analysis-item",
              id: "dd13d8ec-c284-4ba7-a3a5-4034fd00c8a6",
              attributes: {},
              relationships: {
                materialSamples: {
                  data: [
                    {
                      id: "019e1846-54ad-719e-9c15-75adca3862d3",
                      type: "material-sample"
                    },
                    {
                      id: "019e1846-7b67-735b-b7fa-771c0e276369",
                      type: "material-sample"
                    }
                  ]
                }
              }
            }
          ]
        }
      });

      const response = await kitsu.get(
        "seqdb-api/generic-molecular-analysis-item",
        {
          include: "materialSamples"
        }
      );

      expect(response).toEqual({
        data: [
          {
            id: "dd13d8ec-c284-4ba7-a3a5-4034fd00c8a6",
            type: "generic-molecular-analysis-item",
            materialSamples: [
              {
                id: "019e1846-54ad-719e-9c15-75adca3862d3",
                type: "material-sample"
              },
              {
                id: "019e1846-7b67-735b-b7fa-771c0e276369",
                type: "material-sample"
              }
            ]
          }
        ]
      });
    });

    it("Does not promote a relationship that was not requested in include", async () => {
      mockAxiosGet.mockResolvedValue({
        data: {
          data: [
            {
              type: "generic-molecular-analysis-item",
              id: "dd13d8ec-c284-4ba7-a3a5-4034fd00c8a6",
              attributes: {},
              relationships: {
                materialSample: {
                  data: {
                    id: "019e1846-54ad-719e-9c15-75adca3862d3",
                    type: "material-sample"
                  }
                },
                storageUnitUsage: {
                  data: {
                    id: "abc123",
                    type: "storage-unit-usage"
                  }
                }
              }
            }
          ]
        }
      });

      // Only request materialSample, not storageUnitUsage
      const response = await kitsu.get(
        "seqdb-api/generic-molecular-analysis-item",
        {
          include: "materialSample"
        }
      );

      expect((response.data as any[])[0].materialSample).toBeDefined();
      expect((response.data as any[])[0].storageUnitUsage).toBeUndefined();
    });

    it("Handles items with no relationships gracefully", async () => {
      mockAxiosGet.mockResolvedValue({
        data: {
          data: [
            {
              type: "generic-molecular-analysis-item",
              id: "dd13d8ec-c284-4ba7-a3a5-4034fd00c8a6",
              attributes: {}
              // No relationships at all
            }
          ]
        }
      });

      const response = await kitsu.get(
        "seqdb-api/generic-molecular-analysis-item",
        {
          include: "materialSample"
        }
      );

      expect(response).toEqual({
        data: [
          {
            id: "dd13d8ec-c284-4ba7-a3a5-4034fd00c8a6",
            type: "generic-molecular-analysis-item"
          }
        ]
      });
    });

    it("Does nothing when no include param is provided", async () => {
      mockAxiosGet.mockResolvedValue({
        data: {
          data: [
            {
              type: "generic-molecular-analysis-item",
              id: "dd13d8ec-c284-4ba7-a3a5-4034fd00c8a6",
              attributes: {},
              relationships: {
                materialSample: {
                  data: {
                    id: "019e1846-54ad-719e-9c15-75adca3862d3",
                    type: "material-sample"
                  }
                }
              }
            }
          ]
        }
      });

      // No include param
      const response = await kitsu.get(
        "seqdb-api/generic-molecular-analysis-item"
      );

      expect((response.data as any[])[0].materialSample).toBeUndefined();
    });

    it("Normalizes uuid to id on the primary item when id is missing", async () => {
      mockAxiosGet.mockResolvedValue({
        data: {
          data: [
            {
              type: "material-sample",
              uuid: "019e1846-54ad-719e-9c15-75adca3862d3",
              attributes: { name: "Sample 1" }
            }
          ]
        }
      });

      const response = await kitsu.get("seqdb-api/material-sample");

      expect(response.data[0].id).toBe("019e1846-54ad-719e-9c15-75adca3862d3");
      expect(response.data[0].uuid).toBeUndefined();
    });

    it("Normalizes uuid to id on a single promoted relationship stub", async () => {
      mockAxiosGet.mockResolvedValue({
        data: {
          data: [
            {
              type: "generic-molecular-analysis-item",
              id: "dd13d8ec-c284-4ba7-a3a5-4034fd00c8a6",
              attributes: {},
              relationships: {
                materialSample: {
                  data: {
                    uuid: "019e1846-54ad-719e-9c15-75adca3862d3",
                    type: "material-sample"
                  }
                }
              }
            }
          ]
        }
      });

      const response = await kitsu.get(
        "seqdb-api/generic-molecular-analysis-item",
        { include: "materialSample" }
      );

      const promotedSample = response.data[0].materialSample;
      expect(promotedSample.id).toBe("019e1846-54ad-719e-9c15-75adca3862d3");
      expect(promotedSample.uuid).toBeUndefined();
    });

    it("Normalizes uuid to id on all items inside a promoted to-many relationship stub array", async () => {
      mockAxiosGet.mockResolvedValue({
        data: {
          data: [
            {
              type: "generic-molecular-analysis-item",
              id: "dd13d8ec-c284-4ba7-a3a5-4034fd00c8a6",
              attributes: {},
              relationships: {
                materialSamples: {
                  data: [
                    {
                      uuid: "019e1846-54ad-719e-9c15-75adca3862d3",
                      type: "material-sample"
                    },
                    {
                      uuid: "019e1846-7b67-735b-b7fa-771c0e276369",
                      type: "material-sample"
                    }
                  ]
                }
              }
            }
          ]
        }
      });

      const response = await kitsu.get(
        "seqdb-api/generic-molecular-analysis-item",
        { include: "materialSamples" }
      );

      const promotedSamples = response.data[0].materialSamples;
      expect(promotedSamples[0].id).toBe(
        "019e1846-54ad-719e-9c15-75adca3862d3"
      );
      expect(promotedSamples[0].uuid).toBeUndefined();
      expect(promotedSamples[1].id).toBe(
        "019e1846-7b67-735b-b7fa-771c0e276369"
      );
      expect(promotedSamples[1].uuid).toBeUndefined();
    });

    it("Does not alter properties if the item has no uuid or if an id is already present", async () => {
      mockAxiosGet.mockResolvedValue({
        data: {
          data: [
            {
              type: "generic-molecular-analysis-item",
              id: "existing-id",
              uuid: "should-be-ignored-or-removed", // Your function triggers if !obj.id, so if id exists it won't swap it
              attributes: {},
              relationships: {
                materialSample: {
                  data: {
                    id: "sample-id",
                    type: "material-sample"
                  }
                }
              }
            }
          ]
        }
      });

      const response = await kitsu.get(
        "seqdb-api/generic-molecular-analysis-item",
        { include: "materialSample" }
      );

      expect(response.data[0].id).toBe("existing-id");
      expect(response.data[0].materialSample.id).toBe("sample-id");
    });

    it("Parses includes from the path query string when not provided in params", async () => {
      mockAxiosGet.mockResolvedValue({
        data: {
          data: {
            type: "collecting-event",
            id: "019ef07e-4674-7384-b117-7c78db679733",
            attributes: {
              dwcFieldNumber: "test"
            },
            relationships: {
              collectors: {
                data: [
                  {
                    id: "21f87305-3cfa-4351-8a9c-16abedac776d",
                    type: "person"
                  }
                ]
              }
            }
          }
          // No included - collectors are from agent-api, a different API
        }
      });

      // Include is embedded in the path, not passed as a param
      const response = await kitsu.get(
        "collection-api/collecting-event/019ef07e-4674-7384-b117-7c78db679733?include=collectors,attachment",
        {}
      );

      expect((response.data as any).collectors).toEqual([
        {
          id: "21f87305-3cfa-4351-8a9c-16abedac776d",
          type: "person"
        }
      ]);
    });

    it("Combines includes from both path query string and params without duplicates", async () => {
      mockAxiosGet.mockResolvedValue({
        data: {
          data: {
            type: "collecting-event",
            id: "019ef07e-4674-7384-b117-7c78db679733",
            attributes: {},
            relationships: {
              collectors: {
                data: [
                  {
                    id: "21f87305-3cfa-4351-8a9c-16abedac776d",
                    type: "person"
                  }
                ]
              },
              attachment: {
                data: [
                  {
                    id: "abc123",
                    type: "metadata"
                  }
                ]
              }
            }
          }
        }
      });

      // collectors in path, attachment in params, collectors duplicated in both
      const response = await kitsu.get(
        "collection-api/collecting-event/019ef07e-4674-7384-b117-7c78db679733?include=collectors",
        { include: "collectors,attachment" }
      );

      expect((response.data as any).collectors).toEqual([
        {
          id: "21f87305-3cfa-4351-8a9c-16abedac776d",
          type: "person"
        }
      ]);
      expect((response.data as any).attachment).toEqual([
        {
          id: "abc123",
          type: "metadata"
        }
      ]);
    });

    it("Promotes a to-many relationship stub when kitsu resolves it to an empty array due to missing included section", async () => {
      mockAxiosGet.mockResolvedValue({
        data: {
          data: {
            type: "collecting-event",
            id: "019ef07e-4674-7384-b117-7c78db679733",
            attributes: {
              dwcFieldNumber: "test"
            },
            relationships: {
              collectors: {
                data: [
                  {
                    id: "21f87305-3cfa-4351-8a9c-16abedac776d",
                    type: "person"
                  }
                ]
              },
              attachment: {
                data: []
              }
            }
          }
          // No included section at all - collectors from agent-api cannot be included
        }
      });

      const response = await kitsu.get(
        "collection-api/collecting-event/019ef07e-4674-7384-b117-7c78db679733?include=collectors,attachment,collectionMethod"
      );

      // collectors should be promoted from relationship stubs, not left as []
      expect((response.data as any).collectors).toEqual([
        {
          id: "21f87305-3cfa-4351-8a9c-16abedac776d",
          type: "person"
        }
      ]);

      // attachment has an empty data array in relationships, should stay []
      expect((response.data as any).attachment).toEqual([]);

      // collectionMethod has no relationship data at all, should be undefined
      expect((response.data as any).collectionMethod).toBeUndefined();
    });

    it("Does not overwrite a non-empty resolved relationship with stubs when included is present", async () => {
      mockAxiosGet.mockResolvedValue({
        data: {
          data: {
            type: "collecting-event",
            id: "019ef07e-4674-7384-b117-7c78db679733",
            attributes: {},
            relationships: {
              collectionMethod: {
                data: {
                  id: "col-method-1",
                  type: "collection-method"
                }
              },
              collectors: {
                data: [
                  {
                    id: "21f87305-3cfa-4351-8a9c-16abedac776d",
                    type: "person"
                  }
                ]
              }
            }
          },
          included: [
            {
              type: "collection-method",
              id: "col-method-1",
              attributes: {
                name: "Hand Collected"
              }
            }
          ]
        }
      });

      const response = await kitsu.get(
        "collection-api/collecting-event/019ef07e-4674-7384-b117-7c78db679733?include=collectors,collectionMethod"
      );

      // collectionMethod was resolved via included, should have full attributes
      expect((response.data as any).collectionMethod).toEqual({
        id: "col-method-1",
        type: "collection-method",
        name: "Hand Collected"
      });

      // collectors were not in included (different API), should be promoted as stubs
      expect((response.data as any).collectors).toEqual([
        {
          id: "21f87305-3cfa-4351-8a9c-16abedac776d",
          type: "person"
        }
      ]);
    });
  });
});
