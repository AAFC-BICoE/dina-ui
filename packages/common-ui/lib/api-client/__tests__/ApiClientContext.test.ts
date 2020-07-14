import { AxiosRequestConfig } from "axios";
import Kitsu from "kitsu";
import { createContextValue } from "../ApiClientContext";
import {
  FailedOperation,
  Operation,
  OperationsResponse
} from "../operations-types";

interface TestPcrPrimer {
  name: string;
  lotNumber: number;
  type: string;
}

const AXIOS_JSONPATCH_REQUEST_CONFIG: AxiosRequestConfig = {
  headers: {
    Accept: "application/json-patch+json",
    "Content-Type": "application/json-patch+json",
    "Crnk-Compact": "true"
  }
};

const TODO_INSERT_OPERATION: Operation[] = [
  {
    op: "POST",
    path: "todo",
    value: {
      attributes: {
        description: "description",
        name: "todo 1"
      },
      id: "123",
      type: "todo"
    }
  }
];

const MOCK_TODO_INSERT_AXIOS_RESPONSE = {
  data: [
    {
      data: {
        attributes: {
          description: "description",
          name: "todo 1"
        },
        id: "123",
        type: "todo"
      },
      status: 201
    }
  ] as OperationsResponse
};

const TODO_OPERATION_1_VALID_2_INVALID: Operation[] = [
  {
    op: "POST",
    path: "todo",
    value: {
      attributes: {
        name: "valid-name"
      },
      id: "1",
      type: "todo"
    }
  },
  {
    op: "POST",
    path: "todo",
    value: {
      attributes: {
        name: "this-name-is-too-long"
      },
      id: "2",
      type: "todo"
    }
  },
  {
    op: "POST",
    path: "todo",
    value: {
      attributes: {
        description: "this-description-is-too-long"
      },
      id: "3",
      type: "todo"
    }
  }
];

const MOCK_AXIOS_RESPONSE_1_VALID_2_INVALID = {
  data: [
    {
      data: {
        attributes: {
          name: "valid-name"
        },
        id: "1",
        links: { self: "/api/region/1" },
        type: "todo"
      },
      status: 201
    },
    {
      errors: [
        {
          detail: "name size must be between 1 and 10",
          status: "422",
          title: "Constraint violation"
        }
      ],
      status: 422
    },
    {
      errors: [
        {
          detail: "description size must be between 1 and 10",
          status: "422",
          title: "Constraint violation"
        }
      ],
      status: 422
    },
    {
      // The client should be able to ignore a response with no 'errors' field.
      status: 500
    }
  ] as OperationsResponse
};

/** Mock of Axios' patch function. */
const mockPatch = jest.fn((_, data) => {
  if (data === TODO_INSERT_OPERATION) {
    return MOCK_TODO_INSERT_AXIOS_RESPONSE;
  }
  if (data === TODO_OPERATION_1_VALID_2_INVALID) {
    return MOCK_AXIOS_RESPONSE_1_VALID_2_INVALID;
  }
});

const { apiClient, bulkGet, doOperations, save } = createContextValue();

// Add the mocked "patch" method to the Axios instance:
apiClient.axios = { patch: mockPatch } as any;

describe("API client context", () => {
  it("Provides an API client instance.", () => {
    expect(apiClient instanceof Kitsu).toEqual(true);
  });

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
    const expectedErrorMessage = `Constraint violation: name size must be between 1 and 10
Constraint violation: description size must be between 1 and 10`;

    let actualError: Error = new Error();

    try {
      await doOperations(TODO_OPERATION_1_VALID_2_INVALID);
    } catch (error) {
      actualError = error;
    }
    expect(actualError.message).toEqual(expectedErrorMessage);
  });

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
            id: "-100",
            type: "pcrPrimer"
          }
        },
        {
          op: "POST",
          path: "pcrPrimer",
          value: {
            attributes: { lotNumber: 1, name: "testPrimer2" },
            id: "-101",
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
      { id: "124", lotNumber: 1, name: "testPrimer2 edited", type: "pcrPrimer" }
    ]);
  });

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
});
