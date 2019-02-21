import { AxiosRequestConfig } from "axios";
import Kitsu from "kitsu";
import { createContextValue } from "../ApiClientContext";
import { Operation, OperationsResponse } from "../jsonapi-types";

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

const AXIOS_JSONPATCH_REQUEST_CONFIG: AxiosRequestConfig = {
  headers: {
    Accept: "application/json-patch+json",
    "Content-Type": "application/json-patch+json"
  }
};

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

/** Mock of Axios' patch function. */
const mockPatch = jest.fn((_, data) => {
  if (data === TODO_INSERT_OPERATION) {
    return MOCK_TODO_INSERT_AXIOS_RESPONSE;
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
});
