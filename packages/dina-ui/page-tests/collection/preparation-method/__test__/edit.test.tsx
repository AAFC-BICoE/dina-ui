import { makeAxiosErrorMoreReadable } from "common-ui";
import PreparationMethodEditPage, {
  PreparationMethodForm
} from "../../../../pages/collection/preparation-method/edit";
import { mountWithAppContext } from "common-ui";
import { fireEvent, waitFor } from "@testing-library/react";
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
const mockPost = jest.fn();
const apiContext: any = {
  apiClient: {
    get: mockGet,
    axios: { patch: mockPatch, get: mockGetAxios, post: mockPost }
  }
};

describe("preparation-method edit page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockQuery = {};
  });
  it("Provides a form to add a preparation-method.", async () => {
    mockPost.mockReturnValueOnce({
      data: {
        data: {
          id: "1",
          type: "preparation-method"
        }
      },
      status: 201
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

    // Test expected API response
    await waitFor(() => {
      expect(mockPost).lastCalledWith(
        "/collection-api/preparation-method",

        {
          data: {
            attributes: {
              multilingualDescription: {
                descriptions: [
                  {
                    desc: "test english description",
                    lang: "en"
                  }
                ]
              },
              name: "updated Name"
            },
            id: "00000000-0000-0000-0000-000000000000",
            type: "preparation-method"
          }
        },

        expect.anything()
      );
    });

    // The user should be redirected to the new preparation-method's details page.
    expect(mockPush).lastCalledWith("/collection/preparation-method/view?id=1");
  });

  it("Edits an existing prep method.", async () => {
    const mockOnSaved = jest.fn();

    const wrapper = mountWithAppContext(
      <PreparationMethodForm
        onSaved={mockOnSaved}
        fetchedPrepMethod={{
          id: "00000000-0000-0000-0000-000000000000",
          name: "test-prep-method",
          type: "preparation-method",
          multilingualDescription: {
            descriptions: [{ lang: "en", desc: "test english description" }]
          }
        }}
      />,
      { apiContext }
    );

    await waitFor(() => {
      expect(
        wrapper.getByRole("textbox", { name: /english description/i })
      ).toHaveDisplayValue("test english description");
    });

    fireEvent.change(
      wrapper.getByRole("textbox", { name: /french description/i }),
      {
        target: {
          value: "test french description"
        }
      }
    );

    // Submit form
    fireEvent.submit(wrapper.container.querySelector("form")!);

    // Test expected API response
    await waitFor(() => {
      expect(mockPatch).lastCalledWith(
        "/collection-api/preparation-method/00000000-0000-0000-0000-000000000000",

        {
          data: {
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
        },

        expect.anything()
      );
    });
  });

  it("Renders an error after form submit without specifying mandatory field.", async () => {
    // The patch request will return an error.

    const MOCK_POST_ERROR = (() => {
      const error = new Error() as any;
      error.isAxiosError = true;
      error.config = { url: "/collection-api/preparation-method" };
      error.response = {
        statusText: "422",
        data: {
          errors: [
            {
              status: "422 UNPROCESSABLE_ENTITY",
              code: "422",
              title: "Constraint violation",
              detail: "name must not be blank",
              source: { pointer: "name" }
            }
          ]
        }
      };
      return error;
    })();

    mockPost.mockImplementationOnce(() => {
      makeAxiosErrorMoreReadable(MOCK_POST_ERROR);
    });

    mockQuery = {};

    const wrapper = mountWithAppContext(<PreparationMethodEditPage />, {
      apiContext
    });

    // Submit default form
    fireEvent.submit(wrapper.container.querySelector("form")!);

    const { title, detail } = MOCK_POST_ERROR.response.data.errors[0];

    // Test expected error
    await waitFor(() => {

      expect(
        wrapper.getByText((_, element) => {
          return (
            !!element &&
            element.classList.contains("error-message") &&
            element.textContent?.includes(title) &&
            element.textContent?.includes(detail)
          );
        })
      ).toBeInTheDocument();

      expect(mockPush).toBeCalledTimes(0);
    });
  });
});
