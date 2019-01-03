import { AxiosRequestConfig } from "axios";
import Kitsu from "kitsu";
import { create } from "react-test-renderer";
import { ApiClientContext } from "../ApiClientContext";
import { Operation, Operations } from "../Operations";

const TODO_INSERT_OPERATION: Operation[] = [
  {
    op: "POST",
    path: "todo",
    value: {
      id: 123,
      type: "todo",
      attributes: {
        name: "todo 1",
        description: "description"
      }
    }
  }
];

const AXIOS_JSONPATCH_REQUEST_CONFIG: AxiosRequestConfig = {
  headers: {
    "Content-Type": "application/json-patch+json",
    Accept: "application/json-patch+json"
  }
};

const MOCK_TODO_INSERT_AXIOS_RESPONSE = {
  data: [
    {
      data: {
        id: 1,
        type: "todo",
        attributes: {
          name: "todo 1",
          description: "description"
        }
      },
      status: 201
    }
  ]
};

const mockPatch = jest.fn((_, data) => {
  if (data == TODO_INSERT_OPERATION) {
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
          {({ doOperations }) => (
            <form
              onSubmit={async () => {
                await doOperations(TODO_INSERT_OPERATION);
              }}
            />
          )}
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
});
