import { AxiosError } from "axios";
import Kitsu from "kitsu";
import {
  ApiClientImpl,
  CustomDinaKitsu,
  getErrorMessages,
  makeAxiosErrorMoreReadable
} from "../ApiClientContext";
import { SuccessfulOperation } from "../operations-types";
import { isEqual } from "lodash";
interface TestPcrPrimer {
  name: string;
  lotNumber: number;
  type: string;
}
import {
  MOCK_AXIOS_RESPONSE_1_VALID_2_INVALID,
  MOCK_AXIOS_RESPONSE_ACCESS_DENIED,
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
  MOCK_TODO_INSERT_AXIOS_RESPONSE,
  TODO_OPERATION_1_VALID_2_INVALID,
  TODO_OPERATION_DENY_ACCESS,
  AXIOS_JSONPATCH_REQUEST_CONFIG,
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
  MOCK_BULK_GET_410_404_RESPONSE_DESERIALIZED
} from "../__mocks__/ApiClientContextMocks";
import { waitFor } from "@testing-library/dom";

/** Mock of Axios' patch function. */
const mockPatch = jest.fn((_, data) => {
  if (data === TODO_INSERT_OPERATION) {
    return MOCK_TODO_INSERT_AXIOS_RESPONSE;
  }
  if (data === TODO_OPERATION_1_VALID_2_INVALID) {
    return MOCK_AXIOS_RESPONSE_1_VALID_2_INVALID;
  }
  if (data === TODO_OPERATION_DENY_ACCESS) {
    return MOCK_AXIOS_RESPONSE_ACCESS_DENIED;
  }
  if (isEqual(data, MOCK_BULK_UPDATE_DATA)) {
    return MOCK_BULK_UPDATE_RESPONSE;
  }
});

const mockPost = jest.fn((url, data) => {
  if (url.includes("bulk-load")) {
    if (url.includes("include=")) {
      const includes = url.split("=").slice(-1)[0].split(",");
      if (includes.includes("organizations")) {
        return Promise.resolve(MOCK_BULK_GET_RESPONSE_INCLUDE_ORGANIZATIONS);
      }
    }
    if (isEqual(data, MOCK_BULK_GET_DATA)) {
      return Promise.resolve(
        JSON.parse(JSON.stringify(MOCK_BULK_GET_RESPONSE))
      ); // make a deep copy to avoid mutating the original mock data
    }
    if (isEqual(data, MOCK_BULK_GET_404_ERROR_INPUT)) {
      return Promise.reject(MOCK_BULK_GET_404_ERROR_OBJECT);
    }
    if (isEqual(data, MOCK_BULK_GET_410_ERROR_INPUT)) {
      return Promise.reject(MOCK_BULK_GET_410_ERROR_OBJECT);
    }
    if (isEqual(data, MOCK_BULK_GET_410_404_ERROR_INPUT)) {
      return Promise.reject(MOCK_BULK_GET_410_ERROR_OBJECT);
    }
    if (isEqual(data, MOCK_BULK_GET_404_ERROR_INPUT_2)) {
      return Promise.reject(MOCK_BULK_GET_404_ERROR_OBJECT);
    }
  } else {
    if (isEqual(data.data, MOCK_BULK_CREATE_DATA)) {
      return Promise.resolve(
        JSON.parse(JSON.stringify(MOCK_BULK_GET_RESPONSE))
      ); // make a deep copy to avoid mutating the original mock data
    }
  }
});

const mockDelete = jest.fn((_, data) => {
  if (isEqual(data.data, MOCK_BULK_GET_DATA)) {
    return MOCK_BULK_DELETE_RESPONSE;
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
  delete: mockDelete
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
    it("Provides a doOperations function that submits a JSONAPI jsonpatch request.", async () => {
      const response = await doOperations(TODO_INSERT_OPERATION);

      // Check that the correct arguments were passed into axios' patch function.
      expect(mockPatch).toHaveBeenCalledTimes(1);
      const [patchCall] = mockPatch.mock.calls;
      expect(patchCall).toEqual([
        "/operations",
        TODO_INSERT_OPERATION,
        AXIOS_JSONPATCH_REQUEST_CONFIG
      ]);

      // Check the response.
      expect(response).toEqual(MOCK_TODO_INSERT_AXIOS_RESPONSE.data);
    });

    it("Provides a doOperations function that throws an error.", async () => {
      const expectedErrorMessage = `Constraint violation: name size must be between 1 and 10\nConstraint violation: description size must be between 1 and 10`;

      let actualError: Error = new Error();

      try {
        await doOperations(TODO_OPERATION_1_VALID_2_INVALID);
      } catch (error) {
        actualError = error;
      }
      expect(actualError.message).toEqual(expectedErrorMessage);
    });

    it("Omits the detail field from the error message if the detail is undefined.", async () => {
      const expectedErrorMessage = "Access is denied";

      let actualError: Error = new Error();

      try {
        await doOperations(TODO_OPERATION_DENY_ACCESS);
      } catch (error) {
        actualError = error;
      }
      expect(actualError.message).toEqual(expectedErrorMessage);
    });
  });

  describe("save", () => {
    it("Provides a save function that can create resources.", async () => {
      // Mock POST responses.
      mockPatch.mockImplementationOnce(() => ({
        data: [
          {
            data: {
              attributes: {
                lotNumber: 1,
                name: "testPrimer1"
              },
              id: "123",
              type: "pcrPrimer"
            },
            status: 201
          },
          {
            data: {
              attributes: {
                lotNumber: 1,
                name: "testPrimer2"
              },
              id: "124",
              type: "pcrPrimer"
            },
            status: 201
          }
        ]
      }));

      const response = await save([
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

      // Expect correct patch args.
      expect(mockPatch).lastCalledWith(
        "/operations",
        [
          {
            op: "POST",
            path: "pcrPrimer",
            value: {
              attributes: { lotNumber: 1, name: "testPrimer1" },
              id: "00000000-0000-0000-0000-000000000000",
              type: "pcrPrimer"
            }
          },
          {
            op: "POST",
            path: "pcrPrimer",
            value: {
              attributes: { lotNumber: 1, name: "testPrimer2" },
              id: "00000000-0000-0000-0000-000000000000",
              type: "pcrPrimer"
            }
          }
        ],
        expect.anything()
      );

      // Expect correct response.
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

    it("Provides a save function that can update resources.", async () => {
      // Mock PATCH responses.
      mockPatch.mockImplementationOnce(() => ({
        data: [
          {
            data: {
              attributes: {
                lotNumber: 1,
                name: "testPrimer1 edited"
              },
              id: "123",
              type: "pcrPrimer"
            },
            status: 201
          },
          {
            data: {
              attributes: {
                lotNumber: 1,
                name: "testPrimer2 edited"
              },
              id: "124",
              type: "pcrPrimer"
            },
            status: 201
          }
        ]
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

      expect(mockPatch).lastCalledWith(
        "/operations",
        [
          {
            op: "PATCH",
            path: "pcrPrimer/123",
            value: {
              attributes: { lotNumber: 1, name: "testPrimer1 edited" },
              id: "123",
              type: "pcrPrimer"
            }
          },
          {
            op: "PATCH",
            path: "pcrPrimer/124",
            value: {
              attributes: { lotNumber: 1, name: "testPrimer2 edited" },
              id: "124",
              type: "pcrPrimer"
            }
          }
        ],
        expect.anything()
      );

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

    it("Provides a save function that can delete resources.", async () => {
      mockPatch.mockImplementationOnce(() => ({
        data: [{ status: 204 } as SuccessfulOperation]
      }));

      const response = await save([
        { delete: { id: "1234", type: "test-type" } }
      ]);

      expect(response).toEqual([undefined]);
      expect(mockPatch).lastCalledWith(
        "/operations",
        [{ op: "DELETE", path: "test-type/1234" }],
        expect.anything()
      );
    });

    it("Removed the 'meta' field when saving to the back-end.", async () => {
      // Mock PATCH response:
      mockPatch.mockImplementationOnce(() => ({
        data: [
          {
            data: {
              attributes: {
                lotNumber: 1,
                name: "testPrimer1 edited"
              },
              id: "123",
              type: "pcrPrimer"
            },
            status: 201
          }
        ]
      }));

      await save([
        {
          resource: {
            id: "123",
            lotNumber: 1,
            name: "testPrimer1 edited",
            // Sometimes the initial GET operation include the "meta" field:
            meta: {
              permissions: ["create", "update", "delete"],
              permissionsProvider: "GroupAuthorizationService"
            },
            type: "pcrPrimer"
          } as TestPcrPrimer,
          type: "pcrPrimer"
        }
      ]);

      expect(mockPatch).lastCalledWith(
        "/operations",
        [
          // The "meta" field should be excluded from the save operation:
          {
            op: "PATCH",
            path: "pcrPrimer/123",
            value: {
              attributes: { lotNumber: 1, name: "testPrimer1 edited" },
              id: "123",
              type: "pcrPrimer"
            }
          }
        ],
        expect.anything()
      );
    });
  });

  describe("bulkGet", () => {
    it("Provides a bulk-get-by-ID function.", async () => {
      mockPatch.mockImplementationOnce(() => ({
        data: [
          {
            data: {
              attributes: { name: "primer 123" },
              id: "123",
              type: "pcrPrimer"
            },
            status: 201
          },
          {
            data: {
              attributes: { name: "primer 124" },
              id: "124",
              type: "pcrPrimer"
            },
            status: 201
          }
        ]
      }));

      const response = await bulkGet<TestPcrPrimer>([
        "pcrPrimer/123",
        "pcrPrimer/124"
      ]);

      // Bulk-requests by ID:
      expect(mockPatch).lastCalledWith(
        "/operations",
        [
          { op: "GET", path: "pcrPrimer/123" },
          { op: "GET", path: "pcrPrimer/124" }
        ],
        expect.anything()
      );

      // Returns an array of primers:
      expect(response).toEqual([
        { id: "123", name: "primer 123", type: "pcrPrimer" },
        { id: "124", name: "primer 124", type: "pcrPrimer" }
      ]);
    });

    it("bulkGet can return null entries instead of throwing errors on 404 responses.", async () => {
      mockPatch.mockImplementationOnce(() => ({
        data: [
          {
            data: {
              attributes: { name: "primer 123" },
              id: "123",
              type: "pcrPrimer"
            },
            status: 201
          },
          {
            errors: [],
            status: 404
          }
        ]
      }));

      const response = await bulkGet(["primer/123", "primer/000"], {
        returnNullForMissingResource: true
      });

      expect(response).toEqual([
        {
          id: "123",
          name: "primer 123",
          type: "pcrPrimer"
        },
        null
      ]);
    });

    it("bulkGet batches together the same ID to avoid sending duplicate find-one requests.", async () => {
      mockPatch.mockImplementationOnce((_, operations) => ({
        data: operations.map((op) => {
          const id = op.path.replace("primer/", "");

          return {
            data: {
              attributes: { name: `primer ${id}` },
              id,
              type: "primer"
            },
            status: 200
          };
        })
      }));

      const response = await bulkGet(
        // Has duplicates:
        ["primer/100", "primer/100", "primer/200", "primer/200"],
        { returnNullForMissingResource: true }
      );

      expect(response.length).toEqual(4);
      expect(response.map((primer) => primer?.id)).toEqual([
        "100",
        "100",
        "200",
        "200"
      ]);

      // Only 2 unique GET calls are made even though 4 paths were passed to bulkGet:
      expect(mockPatch.mock.calls).toEqual([
        [
          "/operations",
          [
            {
              op: "GET",
              path: "primer/100"
            },
            {
              op: "GET",
              path: "primer/200"
            }
          ],
          {
            headers: {
              Accept: "application/json-patch+json",
              "Content-Type": "application/json-patch+json",
              "Crnk-Compact": "true"
            }
          }
        ]
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
      expect(response).toEqual(MOCK_BULK_GET_RESPONSE_DESERIALIZED);
    });

    it("Provides a bulkLoadResources function that can get multiple objects by id with includes", async () => {
      const response = await bulkLoadResources(["1", "2", "3"], {
        resourceType: "person",
        apiBaseUrl: "/agent-api",
        include: ["organizations"]
      });
      expect(response).toEqual(
        MOCK_BULK_GET_RESPONSE_INCLUDE_ORGANIZATIONS_DESERIALIZED
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

  it("Sends a get request without omitting the end of a login URL more than 2 slashes.", async () => {
    const kitsu = new CustomDinaKitsu({
      baseURL: "/base-url",
      headers: { myHeader: "my-value" }
    });

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
});
