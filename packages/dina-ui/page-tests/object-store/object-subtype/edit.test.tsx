import { OperationsResponse } from "common-ui";
import { ObjectSubtypeEditPage } from "../../../pages/object-store/object-subtype/edit";
import { mountWithAppContext } from "common-ui";
import { ObjectSubtype } from "../../../types/objectstore-api/resources/ObjectSubtype";
import { fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";

// Mock out the Link component, which normally fails when used outside of a Next app.
jest.mock("next/link", () => ({ children }) => <div>{children}</div>);

/** Mock next.js' router "push" function for navigating pages. */
const mockPush = jest.fn();

/** Mock Kitsu "get" method. */
const mockGet = jest.fn(async (model) => {
  // The get request will return the existing object subtype.
  if (model === "objectstore-api/object-subtype/1") {
    // The request returns the test subtype.
    return { data: TEST_OBJECT_SUBTYPE };
  }
});

// Mock API requests:
const mockPatch = jest.fn();
const apiContext: any = {
  apiClient: { get: mockGet, axios: { patch: mockPatch } }
};

describe("Object subtype edit page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("Provides a form to add a subtype.", async () => {
    mockPatch.mockReturnValueOnce({
      data: [
        {
          data: {
            attributes: {
              acSubtype: "txt",
              dcType: "TEXT"
            },
            id: "1",
            type: "object-subtype"
          },
          status: 201
        }
      ] as OperationsResponse
    });

    const wrapper = mountWithAppContext(
      <ObjectSubtypeEditPage router={{ query: {}, push: mockPush } as any} />,
      { apiContext }
    );

    expect(
      wrapper.getAllByRole("textbox", { name: /object subtype/i })
    ).toHaveLength(1);

    // Edit the subtype name.
    fireEvent.change(
      wrapper.getByRole("textbox", { name: /object subtype/i }),
      {
        target: {
          name: "acSubtype",
          value: "libre office word"
        }
      }
    );

    // Submit the form.
    fireEvent.submit(wrapper.container.querySelector("form")!);
    await wrapper.waitForRequests();

    // Test expected response
    expect(mockPatch).toHaveBeenLastCalledWith(
      "/objectstore-api/operations",
      [
        {
          op: "POST",
          path: "object-subtype",
          value: {
            attributes: {
              acSubtype: "libre office word"
            },
            id: "00000000-0000-0000-0000-000000000000",
            type: "object-subtype"
          }
        }
      ],
      expect.anything()
    );

    // The user should be redirected to the new object subtype's details page.
    expect(mockPush).toHaveBeenLastCalledWith(
      "/object-store/object-subtype/list"
    );
  });

  it("Provides a form to edit a object subtype.", async () => {
    // The patch request will be successful.
    mockPatch.mockReturnValueOnce({
      data: [
        {
          data: {
            id: "1",
            type: "object-subtype"
          },
          status: 201
        }
      ] as OperationsResponse
    });

    const wrapper = mountWithAppContext(
      <ObjectSubtypeEditPage
        router={{ query: { id: 1 }, push: mockPush } as any}
      />,
      { apiContext }
    );

    // The page should load initially with a loading spinner.
    expect(wrapper.getByText(/loading\.\.\./i)).toBeInTheDocument();

    // Wait for the form to load.
    await wrapper.waitForRequests();

    // Check that the existing existing subtype value is in the field.
    expect(
      wrapper.getByRole("textbox", { name: /object subtype/i })
    ).toHaveValue("word file");

    // Modify the acSubtype value.
    fireEvent.change(
      wrapper.getByRole("textbox", { name: /object subtype/i }),
      {
        target: {
          name: "acSubtype",
          value: "new subtype value"
        }
      }
    );

    // Submit the form.
    fireEvent.submit(wrapper.container.querySelector("form")!);

    await wrapper.waitForRequests();

    // "patch" should have been called with a jsonpatch request containing the existing values
    // and the modified one.
    expect(mockPatch).toHaveBeenLastCalledWith(
      "/objectstore-api/operations",
      [
        {
          op: "PATCH",
          path: "object-subtype/1",
          value: {
            attributes: expect.objectContaining({
              acSubtype: "new subtype value"
            }),
            id: "1",
            type: "object-subtype"
          }
        }
      ],
      expect.anything()
    );

    // The user should be redirected to object subtype's list page.
    expect(mockPush).toHaveBeenLastCalledWith(
      "/object-store/object-subtype/list"
    );
  });

  it("Renders an error after form submit if one is returned from the back-end.", async () => {
    // The patch request will return an error.
    mockPatch.mockImplementationOnce(() => ({
      data: [
        {
          errors: [
            {
              detail: "DcType and subtype combination should be unique",
              status: "422",
              title: "Constraint violation"
            }
          ],
          status: 422
        }
      ] as OperationsResponse
    }));

    const wrapper = mountWithAppContext(
      <ObjectSubtypeEditPage router={{ query: {}, push: mockPush } as any} />,
      { apiContext }
    );

    // Submit the form.
    fireEvent.submit(wrapper.container.querySelector("form")!);

    await wrapper.waitForRequests();

    // Test expected error
    expect(
      wrapper.getByText(
        "Constraint violation: DcType and subtype combination should be unique"
      )
    ).toBeInTheDocument();
    expect(mockPush).toBeCalledTimes(0);
  });
});

/** Test object subtype with all fields defined. */
const TEST_OBJECT_SUBTYPE: ObjectSubtype = {
  acSubtype: "word file",
  dcType: "Text",
  id: "1",
  type: "object-subtype",
  uuid: "323423-23423-234"
};
