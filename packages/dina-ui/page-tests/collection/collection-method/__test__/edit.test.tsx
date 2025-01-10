import { OperationsResponse } from "common-ui";
import CollectionMethodEditPage, {
  CollectionMethodForm
} from "../../../../pages/collection/collection-method/edit";
import { mountWithAppContext } from "common-ui";
import { CollectionMethod } from "../../../../types/collection-api/resources/CollectionMethod";
import { screen, waitFor, fireEvent, within } from "@testing-library/react";
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

const apiContext: any = {
  apiClient: { get: mockGet, axios: { patch: mockPatch, get: mockGetAxios } }
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

    // Wait for asynchronous updates
    await new Promise(setImmediate);

    // Simulate changing the name input
    const nameInput = getByLabelText(/name/i);
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
    await new Promise(setImmediate);

    expect(mockPatch).lastCalledWith(
      "/collection-api/operations",
      [
        {
          op: "POST",
          path: "collection-method",
          value: {
            attributes: {
              multilingualDescription: {
                descriptions: [{ lang: "en", desc: "test english description" }]
              },
              name: "updated Name"
            },
            id: "00000000-0000-0000-0000-000000000000",
            type: "collection-method"
          }
        }
      ],
      expect.anything()
    );

    // Check that the user is redirected to the new collection-method's details page
    expect(mockPush).lastCalledWith("/collection/collection-method/view?id=1");
  });

  it("Edits an existing collection method.", async () => {
    const { container, getByLabelText, getByRole } = mountWithAppContext(
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

    // Wait for asynchronous updates
    await new Promise(setImmediate);

    // Check the initial value of the English description textarea
    const descriptionTextarea = getByLabelText(
      /english description/i
    ) as HTMLTextAreaElement;
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
    await new Promise(setImmediate);

    // Check the last called patch request
    expect(mockPatch).lastCalledWith(
      "/collection-api/operations",
      [
        {
          op: "PATCH",
          path: "collection-method/1",
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
              name: "updated Name"
            },
            id: "1",
            type: "collection-method"
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

    const { container, getByText } = mountWithAppContext(
      <CollectionMethodEditPage />,
      { apiContext }
    );

    // Submit the form
    const form = container.querySelector("form");
    fireEvent.submit(form!);

    // Wait for asynchronous updates
    await new Promise(setImmediate);

    // Check that the error message is displayed
    expect(
      getByText("Constraint violation: Name is mandatory")
    ).toBeInTheDocument();

    // Ensure no redirection happened
    expect(mockPush).toBeCalledTimes(0);
  });
});

/** Test collection-method with all fields defined. */

const TEST_COLLECTION_METHOD: CollectionMethod = {
  id: "1",
  name: "test collection method",
  type: "collection-method"
};
