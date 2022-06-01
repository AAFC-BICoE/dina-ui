import { OperationsResponse } from "common-ui";
import ProtocolEditPage, {
  ProtocolForm
} from "../../../../pages/collection/protocol/edit";
import { mountWithAppContext } from "../../../../test-util/mock-app-context";

// Mock out the Link component, which normally fails when used outside of a Next app.
jest.mock("next/link", () => ({ children }) => <div>{children}</div>);

jest.mock("next/router", () => ({
  useRouter: () => ({
    push: mockPush,
    query: mockQuery
  })
}));

/** Mock next.js' router "push" function for navigating pages. */
const mockPush = jest.fn();

/** The mock URL query string params. */
let mockQuery: any = {};

/** Mock Kitsu "get" method. */
const mockGet = jest.fn(async path => {
  switch (path) {
    // The get request will return the existing protocol.
    case "collection-api/protocol/1":
      return {
        data: {
          id: "1",
          name: "test protocol",
          type: "protocol",
          group: "protocol-test-group"
        }
      };
  }
});

// Mock API requests:
const mockPatch = jest.fn();
const apiContext: any = {
  apiClient: { get: mockGet, axios: { patch: mockPatch } }
};

describe("protocol edit page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockQuery = {};
  });
  it("Provides a form to add a protocol.", async () => {
    mockPatch.mockReturnValueOnce({
      data: [
        {
          data: {
            id: "1",
            type: "protocol"
          },
          status: 201
        }
      ] as OperationsResponse
    });

    mockQuery = {};

    const wrapper = mountWithAppContext(<ProtocolEditPage />, {
      apiContext
    });

    wrapper.find(".protocolName input").simulate("change", {
      target: {
        name: "name",
        value: "updated Name"
      }
    });

    wrapper.find(".english-description textarea").simulate("change", {
      target: { value: "test english description" }
    });

    // Submit the form.
    wrapper.find("form").simulate("submit");
    await new Promise(setImmediate);

    expect(mockPatch).lastCalledWith(
      "/collection-api/operations",
      [
        {
          op: "POST",
          path: "protocol",
          value: {
            attributes: {
              multilingualDescription: {
                descriptions: [{ lang: "en", desc: "test english description" }]
              },
              name: "updated Name"
            },
            id: "00000000-0000-0000-0000-000000000000",
            type: "protocol"
          }
        }
      ],
      expect.anything()
    );

    // The user should be redirected to the new protocol's details page.
    expect(mockPush).lastCalledWith("/collection/protocol/view?id=1");
  });

  it("Edits an existing protocol.", async () => {
    const mockOnSaved = jest.fn();

    const wrapper = mountWithAppContext(
      <ProtocolForm
        onSaved={mockOnSaved}
        fetchedProtocol={{
          name: "test-protocol",
          type: "protocol",
          multilingualDescription: {
            descriptions: [{ lang: "en", desc: "test english description" }]
          }
        }}
      />,
      { apiContext }
    );

    expect(wrapper.find(".english-description textarea").prop("value")).toEqual(
      "test english description"
    );

    wrapper.find(".french-description textarea").simulate("change", {
      target: { value: "test french description" }
    });

    wrapper.find("form").simulate("submit");

    await new Promise(setImmediate);
    wrapper.update();

    expect(mockPatch).lastCalledWith(
      "/collection-api/operations",
      [
        {
          op: "POST",
          path: "protocol",
          value: {
            attributes: {
              multilingualDescription: {
                descriptions: [
                  {
                    desc: "test english description",
                    lang: "en"
                  },
                  {
                    desc: "test french description",
                    lang: "fr"
                  }
                ]
              },
              name: "test-protocol"
            },
            id: "00000000-0000-0000-0000-000000000000",
            type: "protocol"
          }
        }
      ],
      expect.anything()
    );
  });

  it("Renders an error after form submit without specifying mandatory field.", async () => {
    // The patch request will return an error.
    mockPatch.mockImplementationOnce(() => ({
      data: [
        {
          errors: [
            {
              detail: "Name is mandatory",
              status: "422",
              title: "Constraint violation"
            }
          ],
          status: 422
        }
      ] as OperationsResponse
    }));

    mockQuery = {};

    const wrapper = mountWithAppContext(<ProtocolEditPage />, {
      apiContext
    });

    wrapper.find("form").simulate("submit");

    await new Promise(setImmediate);

    wrapper.update();
    expect(wrapper.find(".alert.alert-danger").text()).toEqual(
      "Constraint violation: Name is mandatory"
    );
    expect(mockPush).toBeCalledTimes(0);
  });
});
