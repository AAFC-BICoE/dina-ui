import { OperationsResponse } from "common-ui";
import { ObjectSubtype } from "../../../objectstore-ui/types/objectstore-api/resources/ObjectSubtype";
import { ObjectSubtypeEditPage } from "../../pages/object-subtype/edit";
import { mountWithAppContext } from "../../test-util/mock-app-context";

// Mock out the Link component, which normally fails when used outside of a Next app.
jest.mock("next/link", () => ({ children }) => <div>{children}</div>);

/** Mock Kitsu "get" method. */
const mockGet = jest.fn(async model => {
  // The get request will return the existing object subtype.
  if (model === "object-subtype/1") {
    // The request returns the test subtype.
    return { data: TEST_OBJECT_SUBTYPE };
  }
});

/** Mock axios for operations requests. */
const mockPatch = jest.fn();

/** Mock next.js' router "push" function for navigating pages. */
const mockPush = jest.fn();

// Mock Kitsu, the client class that talks to the backend.
jest.mock(
  "kitsu",
  () =>
    class {
      public get = mockGet;
      public axios = {
        patch: mockPatch
      };
    }
);

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
      <ObjectSubtypeEditPage router={{ query: {}, push: mockPush } as any} />
    );

    expect(wrapper.find(".acSubtype-field input")).toHaveLength(1);
    // Edit the subtype name.
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
      />
    );

    // The page should load initially with a loading spinner.
    expect(wrapper.find(".spinner-border").exists()).toEqual(true);

    // Wait for the profile form to load.
    await Promise.resolve();
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
        "operations",
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

      // The user should be redirected to the existing object subtype's details page.
      expect(mockPush).lastCalledWith("/object-subtype/view?id=1");
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
