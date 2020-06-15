import { OperationsResponse } from "common-ui";
import { ObjectSubtypeEditPage } from "../../../pages/object-store/object-subtype/edit";
import { mountWithAppContext } from "../../../test-util/mock-app-context";
import { ObjectSubtype } from "../../../types/objectstore-api/resources/ObjectSubtype";

// Mock out the Link component, which normally fails when used outside of a Next app.
jest.mock("next/link", () => ({ children }) => <div>{children}</div>);

/** Mock next.js' router "push" function for navigating pages. */
const mockPush = jest.fn();

/** Mock Kitsu "get" method. */
const mockGet = jest.fn(async model => {
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

    expect(wrapper.find(".acSubtype-field input")).toHaveLength(1);

    // Edit the subtype name.

    wrapper.find(".acSubtype-field input").simulate("change", {
      target: {
        name: "acSubtype",
        value: "libre office word"
      }
    });

    // Submit the form.
    wrapper.find("form").simulate("submit");
    await new Promise(setImmediate);

    expect(mockPatch).lastCalledWith(
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
    expect(mockPush).lastCalledWith("/object-store/object-subtype/list");
  });

  it("Provides a form to edit a object subtype.", async done => {
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
    expect(wrapper.find(".spinner-border").exists()).toEqual(true);

    // Wait for the form to load.
    await new Promise(setImmediate);
    wrapper.update();

    // Check that the existing existing subtype value is in the field.
    expect(wrapper.find(".acSubtype-field input").prop("value")).toEqual(
      "word file"
    );

    // Modify the acSubtype value.
    wrapper.find(".acSubtype-field input").simulate("change", {
      target: { name: "acSubtype", value: "new subtype value" }
    });

    // Submit the form.
    wrapper.find("form").simulate("submit");

    setImmediate(() => {
      // "patch" should have been called with a jsonpatch request containing the existing values
      // and the modified one.
      expect(mockPatch).lastCalledWith(
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
      expect(mockPush).lastCalledWith("/object-store/object-subtype/list");
      done();
    });
  });

  it("Renders an error after form submit if one is returned from the back-end.", async done => {
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
    wrapper.find("form").simulate("submit");

    setImmediate(() => {
      wrapper.update();
      expect(wrapper.find(".alert.alert-danger").text()).toEqual(
        "Constraint violation: DcType and subtype combination should be unique"
      );
      expect(mockPush).toBeCalledTimes(0);
      done();
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
