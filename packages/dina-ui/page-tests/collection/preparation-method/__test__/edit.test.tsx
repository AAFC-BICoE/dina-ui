import { OperationsResponse } from "common-ui";
import PreparationMethodEditPage, {
  PreparationMethodForm
} from "../../../../pages/collection/preparation-method/edit";
import { mountWithAppContext } from "common-ui";
import { PreparationMethod } from "../../../../types/collection-api/resources/PreparationMethod";
import { fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";

const INSTANCE_DATA = {
  data: {
    "instance-mode": "developer",
    "supported-languages-iso": "en,fr"
  },
  status: 200,
  statusText: "",
  headers: {
    "content-length": "99",
    "content-type": "text/plain; charset=utf-8",
    date: "Tue, 09 Jan 2024 17:03:48 GMT"
  },
  config: {
    url: "/instance.json",
    method: "get",
    headers: {
      Accept: "application/json, text/plain, */*"
    },
    transformRequest: [null],
    transformResponse: [null],
    timeout: 0,
    xsrfCookieName: "XSRF-TOKEN",
    xsrfHeaderName: "X-XSRF-TOKEN",
    maxContentLength: -1
  },
  request: {}
};

const mockGetAxios = jest.fn(async (_path) => {
  return INSTANCE_DATA;
});

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
const mockGet = jest.fn(async (path) => {
  switch (path) {
    // The get request will return the existing preparation-method.
    case "collection-api/preparation-method/1":
      return {
        data: {
          id: "1",
          name: "test preparation method",
          type: "preparation-method",
          group: "prepmethod-test-group"
        }
      };
  }
});

// Mock API requests:
const mockPatch = jest.fn();
const apiContext: any = {
  apiClient: { get: mockGet, axios: { patch: mockPatch, get: mockGetAxios } }
};

describe("preparation-method edit page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockQuery = {};
  });
  it("Provides a form to add a preparation-method.", async () => {
    mockPatch.mockReturnValueOnce({
      data: [
        {
          data: {
            id: "1",
            type: "preparation-method"
          },
          status: 201
        }
      ] as OperationsResponse
    });

    mockQuery = {};

    const wrapper = mountWithAppContext(<PreparationMethodEditPage />, {
      apiContext
    });

    // Change value of the Name field
    fireEvent.change(wrapper.getByRole("textbox", { name: /name/i }), {
      target: {
        name: "name",
        value: "updated Name"
      }
    });

    // Change value of the Eng Description field
    fireEvent.change(
      wrapper.getByRole("textbox", { name: /english description/i }),
      {
        target: {
          value: "test english description"
        }
      }
    );

    // Submit the form.
    fireEvent.submit(wrapper.container.querySelector("form")!);

    await new Promise(setImmediate);

    // Test expected API response
    expect(mockPatch).lastCalledWith(
      "/collection-api/operations",
      [
        {
          op: "POST",
          path: "preparation-method",
          value: {
            attributes: {
              multilingualDescription: {
                descriptions: [{ lang: "en", desc: "test english description" }]
              },
              name: "updated Name"
            },
            id: "00000000-0000-0000-0000-000000000000",
            type: "preparation-method"
          }
        }
      ],
      expect.anything()
    );

    // The user should be redirected to the new preparation-method's details page.
    expect(mockPush).lastCalledWith("/collection/preparation-method/view?id=1");
  });

  it("Edits an existing prep method.", async () => {
    const mockOnSaved = jest.fn();

    const wrapper = mountWithAppContext(
      <PreparationMethodForm
        onSaved={mockOnSaved}
        fetchedPrepMethod={{
          name: "test-prep-method",
          type: "preparation-method",
          multilingualDescription: {
            descriptions: [{ lang: "en", desc: "test english description" }]
          }
        }}
      />,
      { apiContext }
    );

    await new Promise(setImmediate);

    // Test default Eng Description value
    // expect(wrapper.find(".en-description textarea").prop("value")).toEqual(
    //   "test english description"
    // );
    expect(
      wrapper.getByRole("textbox", { name: /english description/i })
    ).toHaveDisplayValue("test english description");

    // Change Fr Description value
    // wrapper.find(".fr-description textarea").simulate("change", {
    //   target: { value: "test french description" }
    // });
    fireEvent.change(
      wrapper.getByRole("textbox", { name: /french description/i }),
      {
        target: {
          value: "test french description"
        }
      }
    );

    // Submit form
    // wrapper.find("form").simulate("submit");
    fireEvent.submit(wrapper.container.querySelector("form")!);

    await new Promise(setImmediate);

    // Test expected API response
    expect(mockPatch).lastCalledWith(
      "/collection-api/operations",
      [
        {
          op: "POST",
          path: "preparation-method",
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
              name: "test-prep-method"
            },
            id: "00000000-0000-0000-0000-000000000000",
            type: "preparation-method"
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

    const wrapper = mountWithAppContext(<PreparationMethodEditPage />, {
      apiContext
    });

    // Submit default form
    fireEvent.submit(wrapper.container.querySelector("form")!);

    await new Promise(setImmediate);

    // Test expected error
    expect(
      wrapper.getByText(/constraint violation: name is mandatory/i)
    ).toBeInTheDocument();
    expect(mockPush).toBeCalledTimes(0);
  });
});
