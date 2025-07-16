import { OperationsResponse, makeAxiosErrorMoreReadable } from "common-ui";
import CollectionMethodEditPage, {
  CollectionMethodForm
} from "../../../../pages/collection/collection-method/edit";
import { mountWithAppContext } from "common-ui";
import { CollectionMethod } from "../../../../types/collection-api/resources/CollectionMethod";
import { screen, fireEvent, waitFor } from "@testing-library/react";
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

const mockOnSaved = jest.fn();

/** The mock URL query string params. */
let mockQuery: any = {};

/** Mock Kitsu "get" method. */
const mockGet = jest.fn(async (model) => {
  // The get request will return the existing collection-method.
  if (model === "collection-api/collection-method/1") {
    return { data: TEST_COLLECTION_METHOD };
  } else if (model === "user-api/group") {
    return [];
  }
});

const mockPatch = jest.fn(() => ({
  data: [{ data: TEST_COLLECTION_METHOD, status: 201 }] as OperationsResponse
}));

const mockGetAxios = jest.fn(async (_path) => {
  return INSTANCE_DATA;
});

const mockPost = jest.fn();

const apiContext: any = {
  apiClient: {
    get: mockGet,
    axios: { patch: mockPatch, get: mockGetAxios, post: mockPost }
  }
};

describe("collection-method edit page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockQuery = {};
  });
  it("Provides a form to add a collection-method.", async () => {
    const { container, getByLabelText } = mountWithAppContext(
      <CollectionMethodEditPage />,
      {
        apiContext
      }
    );

    mockPost.mockReturnValueOnce({
      data: {
        data: {
          type: "collection-method",
          id: "1",
          attributes: {
            multilingualDescription: {
              descriptions: [{ lang: "en", desc: "test english description" }]
            },
            name: "updated Name"
          }
        }
      },
      status: 201
    });

    // Simulate changing the name input
    const nameInput = getByLabelText(/name/i);
    await waitFor(() => {
      expect(nameInput).toBeInTheDocument();
    });

    fireEvent.change(nameInput, { target: { value: "updated Name" } });
    // Simulate changing the English description textarea
    const descriptionTextarea = screen.getByRole("textbox", {
      name: /english description/i
    });
    fireEvent.change(descriptionTextarea, {
      target: { value: "test english description" }
    });

    // Submit the form
    const form = container.querySelector("form");
    fireEvent.submit(form!);

    // Wait for async updates after submission
    await waitFor(() => {
      expect(mockPost).lastCalledWith(
        "/collection-api/collection-method",
        {
          data: {
            type: "collection-method",
            id: "00000000-0000-0000-0000-000000000000",
            attributes: {
              multilingualDescription: {
                descriptions: [{ lang: "en", desc: "test english description" }]
              },
              name: "updated Name"
            }
          }
        },

        expect.anything()
      );
    });

    // Check that the user is redirected to the new collection-method's details page
    expect(mockPush).lastCalledWith("/collection/collection-method/view?id=1");
  });

  it("Edits an existing collection method.", async () => {
    const { container, getByLabelText } = mountWithAppContext(
      <CollectionMethodForm
        onSaved={mockOnSaved}
        fetchedCollectionMethod={{
          name: "test-col-method",
          type: "collection-method",
          multilingualDescription: {
            descriptions: [{ lang: "en", desc: "test english description" }]
          },
          id: "1"
        }}
      />,
      { apiContext }
    );

    // Check the initial value of the English description textarea
    const descriptionTextarea = getByLabelText(
      /english description/i
    ) as HTMLTextAreaElement;
    await waitFor(() => {
      expect(descriptionTextarea).toBeInTheDocument();
    });
    expect(descriptionTextarea.value).toEqual("test english description");

    // Simulate changing the French description textarea
    const frenchDescriptionTextarea = getByLabelText(/french description/i);
    fireEvent.change(frenchDescriptionTextarea, {
      target: { value: "test french description" }
    });

    // Simulate changing the name input
    const nameInput = getByLabelText(/name/i);
    fireEvent.change(nameInput, {
      target: { value: "updated Name" }
    });

    // Submit the form
    const form = container.querySelector("form");
    fireEvent.submit(form!);

    // Wait for async updates after submission
    await waitFor(() => {
      // Check the last called patch request
      expect(mockPatch).lastCalledWith(
        "/collection-api/collection-method/1",
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
              name: "updated Name"
            },
            id: "1",
            type: "collection-method"
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
        url: "/collection-api/collection-method"
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

    const { container, getByText } = mountWithAppContext(
      <CollectionMethodEditPage />,
      { apiContext }
    );

    // Submit the form
    const form = container.querySelector("form");
    fireEvent.submit(form!);

    // Check that the error message is displayed

    await waitFor(() => {
      expect(
        getByText(
          /\/collection\-api\/collection\-method: 422 constraint violation: name must not be blank/i
        )
      ).toBeInTheDocument();

      // Ensure no redirection happened
      expect(mockPush).toBeCalledTimes(0);
    });
  });
});

/** Test collection-method with all fields defined. */

const TEST_COLLECTION_METHOD: CollectionMethod = {
  id: "1",
  name: "test collection method",
  type: "collection-method"
};
