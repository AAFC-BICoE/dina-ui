import { AxiosError, AxiosRequestConfig } from "axios";
import Kitsu from "kitsu";
import { create } from "react-test-renderer";
import { ApiClientContext } from "../ApiClientContext";
import { Operation, OperationsResponse } from "../jsonapi-types";
import { Operations } from "../Operations";

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

/** Todo insert operation where the first todo is valid and the second is invalid */
const TODO_OPERATION_1_VALID_1_INVALID: Operation[] = [
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
  }
];

/** Jsonpatch response where the first operation is valid but the second is invalid. */
const MOCK_AXIOS_RESPONSE_1_VALID_1_INVALID = {
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
    }
  ] as OperationsResponse
};

const INVALID_OPERATIONS_FORMAT_REQUEST =
  "This is an operations request in an invalid format";

const MOCK_AXIOS_ERROR: AxiosError = {
  config: {},
  message: "error",
  name: "error"
};

/** Mock of Axios' patch function. */
const mockPatch = jest.fn((_, data) => {
  if (data === TODO_INSERT_OPERATION) {
    return MOCK_TODO_INSERT_AXIOS_RESPONSE;
  } else if (data === TODO_OPERATION_1_VALID_1_INVALID) {
    return MOCK_AXIOS_RESPONSE_1_VALID_1_INVALID;
  } else if (data === INVALID_OPERATIONS_FORMAT_REQUEST) {
    throw MOCK_AXIOS_ERROR;
  }
});

jest.mock("axios", () => ({
  create() {
    return {
      patch: mockPatch
    };
  }
}));

/** JSONAPI client. */
const testClient = new Kitsu({
  baseURL: "/api",
  pluralize: false,
  resourceCase: "none"
});

describe("Operations component", () => {
  beforeEach(() => {
    mockPatch.mockClear();
  });

  it("Provides a doOperations function to children that submits a JSONAPI jsonpatch request.", async () => {
    // Create a form element that on submit calls the provided doOperations function.
    const wrapper = create(
      <ApiClientContext.Provider value={{ apiClient: testClient }}>
        <Operations>
          {({ doOperations }) => {
            async function onSubmit() {
              await doOperations(TODO_INSERT_OPERATION);
            }

            return <form onSubmit={onSubmit} />;
          }}
        </Operations>
      </ApiClientContext.Provider>
    );

    // Submit the form.
    await wrapper.root.findByType("form").props.onSubmit();

    // Check that the correct arguments were passed into axios' patch function.
    expect(mockPatch).toHaveBeenCalledTimes(1);
    const [patchCall] = mockPatch.mock.calls;
    expect(patchCall).toEqual([
      "operations",
      TODO_INSERT_OPERATION,
      AXIOS_JSONPATCH_REQUEST_CONFIG
    ]);
  });

  it("Renders with loading as false before sending a request", done => {
    create(
      <ApiClientContext.Provider value={{ apiClient: testClient }}>
        <Operations>
          {({ loading, response }) => {
            expect(loading).toBeFalsy();
            expect(response).toBeUndefined();
            done();
            return null;
          }}
        </Operations>
      </ApiClientContext.Provider>
    );
  });

  it("Renders with loading as true after sending a request", async done => {
    const render = create(
      <ApiClientContext.Provider value={{ apiClient: testClient }}>
        <Operations>
          {({ doOperations, loading, response }) => {
            async function onSubmit() {
              await doOperations(TODO_INSERT_OPERATION);
            }

            if (loading) {
              expect(response).toBeUndefined();
              done();
            }

            return <form onSubmit={onSubmit} />;
          }}
        </Operations>
      </ApiClientContext.Provider>
    );

    await render.root.findByType("form").props.onSubmit();
  });

  it("Renders a jsonpatch response to child components", async done => {
    const render = create(
      <ApiClientContext.Provider value={{ apiClient: testClient }}>
        <Operations>
          {({ doOperations, loading, response }) => {
            async function onSubmit() {
              await doOperations(TODO_OPERATION_1_VALID_1_INVALID);
            }

            if (response) {
              expect(loading).toBeFalsy();
              expect(response).toEqual(
                MOCK_AXIOS_RESPONSE_1_VALID_1_INVALID.data
              );
              done();
            }

            return <form onSubmit={onSubmit} />;
          }}
        </Operations>
      </ApiClientContext.Provider>
    );

    await render.root.findByType("form").props.onSubmit();
  });

  it("Throws an error when an invalid format request is sent.", async done => {
    const render = create(
      <ApiClientContext.Provider value={{ apiClient: testClient }}>
        <Operations>
          {({ doOperations }) => {
            async function onSubmit() {
              await doOperations(INVALID_OPERATIONS_FORMAT_REQUEST as any);
            }

            return <form onSubmit={onSubmit} />;
          }}
        </Operations>
      </ApiClientContext.Provider>
    );

    try {
      // Expect doOperations to throw an error.
      await render.root.findByType("form").props.onSubmit();
    } catch (error) {
      expect(error).toEqual(MOCK_AXIOS_ERROR);
      done();
    }
  });
});
