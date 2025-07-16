import { makeAxiosErrorMoreReadable } from "common-ui";
import PreparationTypeEditPage, {
  PreparationTypeForm
} from "../../../../pages/collection/preparation-type/edit";
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
    // The get request will return the existing preparation-type.
    case "collection-api/preparation-type/1":
      return {
        data: {
          id: "1",
          name: "test preparation type",
          type: "preparation-type",
          group: "preptype-test-group"
        }
      };
  }
});

const mockPost = jest.fn();

// Mock API requests:
const mockPatch = jest.fn();
const apiContext: any = {
  apiClient: {
    get: mockGet,
    axios: { patch: mockPatch, get: mockGetAxios, post: mockPost }
  }
};

describe("preparation-type edit page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockQuery = {};
  });
  it("Provides a form to add a preparation-type.", async () => {
    mockPost.mockReturnValueOnce({
      data: {
        data: {
          id: "1",
          type: "preparation-type"
        }
      },
      status: 201
    });

    mockQuery = {};

    const wrapper = mountWithAppContext(<PreparationTypeEditPage />, {
      apiContext
    });

    // Change Name field value
    fireEvent.change(wrapper.getByRole("textbox", { name: /name/i }), {
      target: {
        name: "name",
        value: "updated Name"
      }
    });

    // Change English Description field value
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
        "/collection-api/preparation-type",

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
            type: "preparation-type"
          }
        },

        expect.anything()
      );
    });

    // The user should be redirected to the new preparation-type's details page.
    expect(mockPush).lastCalledWith("/collection/preparation-type/view?id=1");
  });

  it("Edits an existing prep type.", async () => {
    const mockOnSaved = jest.fn();

    const wrapper = mountWithAppContext(
      <PreparationTypeForm
        onSaved={mockOnSaved}
        fetchedPrepType={{
          name: "test-prep-type",
          id: "00000000-0000-0000-0000-000000000000",
          type: "preparation-type",
          multilingualDescription: {
            descriptions: [{ lang: "en", desc: "test english description" }]
          }
        }}
      />,
      { apiContext }
    );

    // Wait for the page to load
    await waitFor(() => {
      // Test English Description field value
      expect(
        wrapper.getByRole("textbox", { name: /english description/i })
      ).toHaveDisplayValue("test english description");
    });

    // Change French Description field value
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
        "/collection-api/preparation-type/00000000-0000-0000-0000-000000000000",

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
              name: "test-prep-type"
            },
            id: "00000000-0000-0000-0000-000000000000",
            type: "preparation-type"
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
      error.config = {
        url: "/collection-api/preparation-type"
      };
      error.response = {
        statusText: "422",
        data: {
          errors: [
            {
              status: 422,
              detail: "name must not be blank",
              title: "Constraint violation"
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

    const wrapper = mountWithAppContext(<PreparationTypeEditPage />, {
      apiContext
    });

    // Submit form without name field value
    fireEvent.submit(wrapper.container.querySelector("form")!);

    // Test expected error
    await waitFor(() => {
      expect(
        wrapper.getByText(
          /\/collection\-api\/preparation\-type: 422 constraint violation: name must not be blank/i
        )
      ).toBeInTheDocument();
      expect(mockPush).toBeCalledTimes(0);
    });
  });
});
