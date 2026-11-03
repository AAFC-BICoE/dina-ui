import { ObjectSubtypeEditPage } from "../../../pages/object-store/object-subtype/edit";
import { clearAndType, mountWithAppContext } from "common-ui";
import { ObjectSubtype } from "../../../types/objectstore-api/resources/ObjectSubtype";
import { fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import userEvent from "@testing-library/user-event";

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
  if (model === "objectstore-api/object-subtype/2") {
    return { data: { ...TEST_OBJECT_SUBTYPE, id: "2", systemDefined: true } };
  }
});

const mockPost = jest.fn(async (model) => {
  // The post request will return the existing object subtype.
  if (model === "/objectstore-api/object-subtype") {
    // The request returns the test subtype.
    return { data: { data: TEST_OBJECT_SUBTYPE } };
  }
});

// Mock API requests:
const mockPatch = jest.fn(async () => ({
  data: { data: { id: "1", type: "object-subtype" } }
}));
const apiContext: any = {
  apiClient: { get: mockGet, axios: { patch: mockPatch, post: mockPost } }
};

describe("Object subtype edit page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("Provides a form to add a subtype.", async () => {
    const wrapper = mountWithAppContext(
      <ObjectSubtypeEditPage router={{ query: {}, push: mockPush } as any} />,
      { apiContext }
    );

    expect(
      wrapper.getAllByRole("textbox", { name: /object subtype/i })
    ).toHaveLength(1);

    // Edit the subtype name.
    await clearAndType(
      wrapper.getByRole("textbox", { name: /object subtype/i }),
      "libre office word"
    );

    // Fill in the required fields.
    await userEvent.click(
      wrapper.getByRole("combobox", { name: /stored object type/i })
    );
    await userEvent.click(wrapper.getByRole("option", { name: "Text" }));

    // Submit the form.
    fireEvent.submit(wrapper.container.querySelector("form")!);

    // Test expected response
    await waitFor(() => {
      expect(mockPost).lastCalledWith(
        "/objectstore-api/object-subtype",
        {
          data: {
            attributes: {
              acSubtype: "libre office word",
              dcType: "TEXT",
              multilingualTitle: null,
              multilingualDescription: null
            },
            id: "00000000-0000-0000-0000-000000000000",
            type: "object-subtype"
          }
        },
        expect.anything()
      );
    });

    // The user should be redirected to the new object subtype's details page.
    expect(mockPush).lastCalledWith("/object-store/object-subtype/view?id=1");
  });

  it("Provides a form to edit a object subtype.", async () => {
    const wrapper = mountWithAppContext(
      <ObjectSubtypeEditPage
        router={{ query: { id: 1 }, push: mockPush } as any}
      />,
      { apiContext }
    );

    // The page should load initially with a loading spinner.
    expect(wrapper.getByText(/loading\.\.\./i)).toBeInTheDocument();

    // Wait for the form to load.
    await waitFor(() => {
      // Check that the existing existing subtype value is in the field.
      expect(
        wrapper.getByRole("textbox", { name: /object subtype/i })
      ).toHaveValue("word file");
    });

    // Modify the acSubtype value.
    await clearAndType(
      wrapper.getByRole("textbox", { name: /object subtype/i }),
      "new subtype value"
    );

    // Submit the form.
    fireEvent.submit(wrapper.container.querySelector("form")!);

    // "patch" should have been called with a jsonpatch request containing the existing values
    // and the modified one.
    await waitFor(() => {
      expect(mockPatch).lastCalledWith(
        "/objectstore-api/object-subtype/1",
        {
          data: {
            attributes: {
              acSubtype: "new subtype value",
              dcType: "Text",
              uuid: "323423-23423-234",
              multilingualTitle: null,
              multilingualDescription: null
            },
            id: "1",
            type: "object-subtype"
          }
        },
        expect.anything()
      );
    });

    // The user should be redirected to object subtype's view page.
    expect(mockPush).lastCalledWith("/object-store/object-subtype/view?id=1");
  });

  it("Redirects to the view page when editing a system defined subtype.", async () => {
    const mockReplace = jest.fn();
    const wrapper = mountWithAppContext(
      <ObjectSubtypeEditPage
        router={
          { query: { id: "2" }, push: mockPush, replace: mockReplace } as any
        }
      />,
      { apiContext }
    );

    await waitFor(() => {
      expect(mockReplace).lastCalledWith(
        "/object-store/object-subtype/view?id=2"
      );
    });
    expect(wrapper.container.querySelector("form")).toBeNull();
  });

  it("Renders an error after form submit if one is returned from the back-end.", async () => {
    // The patch request will return an error.
    mockPost.mockImplementationOnce(() => {
      throw new Error(
        `Constraint violation: DcType and subtype combination should be unique`
      );
    });

    const wrapper = mountWithAppContext(
      <ObjectSubtypeEditPage router={{ query: {}, push: mockPush } as any} />,
      { apiContext }
    );

    // Fill in the required fields.
    await userEvent.click(
      wrapper.getByRole("combobox", { name: /stored object type/i })
    );
    await userEvent.click(wrapper.getByRole("option", { name: "Text" }));
    await clearAndType(
      wrapper.getByRole("textbox", { name: /object subtype name/i }),
      "txt"
    );

    // Submit the form.
    fireEvent.submit(wrapper.container.querySelector("form")!);

    // Test expected error
    await waitFor(() => {
      expect(
        wrapper.getByText(
          "Constraint violation: DcType and subtype combination should be unique"
        )
      ).toBeInTheDocument();
      expect(mockPush).toBeCalledTimes(0);
    });
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
