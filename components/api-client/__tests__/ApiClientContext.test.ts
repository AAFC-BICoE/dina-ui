import { AxiosRequestConfig } from "axios";
import Kitsu from "kitsu";
import { createContextValue } from "../ApiClientContext";
import { Operation, OperationsResponse } from "../jsonapi-types";

const AXIOS_JSONPATCH_REQUEST_CONFIG: AxiosRequestConfig = {
  headers: {
    Accept: "application/json-patch+json",
    "Content-Type": "application/json-patch+json"
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
      id: 123,
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
        id: 123,
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
      id: 1,
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
      id: 2,
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
      id: 3,
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

jest.mock("axios", () => ({
  create() {
    return {
      patch: mockPatch
    };
  }
}));

const { apiClient, doOperations } = createContextValue();

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
      "operations",
      TODO_INSERT_OPERATION,
      AXIOS_JSONPATCH_REQUEST_CONFIG
    ]);

    // Check the response.
    expect(response).toEqual(MOCK_TODO_INSERT_AXIOS_RESPONSE.data);
  });

  it("Provides a doOperations function that throws an error.", async () => {
    const expectedErrorMessage = `Constraint violation: name size must be between 1 and 10
Constraint violation: description size must be between 1 and 10`;

    let actualError: Error;

    try {
      await doOperations(TODO_OPERATION_1_VALID_2_INVALID);
    } catch (error) {
      actualError = error;
    }
    expect(actualError.message).toEqual(expectedErrorMessage);
  });
});
