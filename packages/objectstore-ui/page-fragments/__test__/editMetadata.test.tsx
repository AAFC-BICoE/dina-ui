import { mountWithAppContext } from "../../test-util/mock-app-context";
import { EditMetadataFormPage } from "../editMetadata";

// Mock out the Link component, which normally fails when used outside of a Next app.
jest.mock("next/link", () => ({ children }) => <div>{children}</div>);

/** Mock axios for operations requests. */
const mockPost = jest.fn();

const mockGet = jest.fn();

const flushPromises = () => new Promise(setImmediate);

// Mock Kitsu, the client class that talks to the backend.
jest.mock(
  "kitsu",
  () =>
    class {
      public get = mockGet;
      public axios = {
        post: mockPost
      };
    }
);

describe("Metadata edit page", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockGet.mockImplementation(async model => {
      if (model === "agent") {
        return {
          data: [
            {
              displayName: "shemy",
              email: "xuemei.gan@canada.ca",
              id: 1
            }
          ]
        };
      } else if (model === "managed-attribute") {
        return {
          data: [
            {
              acceptedValues: ["dorcel"],
              id: 1,
              managedAttributeType: "STRING",
              name: "specimen view"
            }
          ]
        };
      }
    });
  });

  it("Provides a form to edit a metadata.", done => {
    // The post request will be successful.
    mockPost.mockReturnValueOnce({
      data: {
        data: {
          id: 1,
          type: "metadata"
        },
        status: 201
      }
    });

    const ui = (
      <EditMetadataFormPage
        originalFileName="fileName"
        fileIdentifier="fileId"
      />
    );
    const wrapper = mountWithAppContext(ui);

    const addButton = wrapper.find("button.list-inline-item.btn.btn-primary");

    // Check that the existing add button is displayed
    expect(addButton).toBeTruthy();

    wrapper.find(".dcFormat-field input").simulate("change", {
      target: { name: "dcFormat", value: "dcFormat" }
    });

    // Submit the form.
    wrapper.find("form").simulate("submit");

    setImmediate(() => {
      expect(mockPost).lastCalledWith(
        "/metadata",
        {
          data: {
            attributes: {
              bucket: "mybucket",
              customButtonName: "Save Metadata",
              dcFormat: "dcFormat",
              dcType: "image",
              fileIdentifier: "fileId",
              originalFilename: "fileName",
              type: undefined
            },

            type: "metadata"
          }
        },
        expect.anything()
      );
      done();
    });
  });

  it("Provides a form to edit a metadata with unmanaged attribute.", done => {
    // The post request will be successful.
    mockPost.mockReturnValueOnce({
      data: {
        data: {
          attributes: {
            bucket: "mybucket"
          },
          id: "3406712e-1722-467a-9284-49887cb9f2d1",
          type: "metadata"
        },
        status: 201
      }
    });

    const ui = (
      <EditMetadataFormPage
        originalFileName="fileName"
        fileIdentifier="fileId"
      />
    );
    const wrapper = mountWithAppContext(ui);

    wrapper.find(".assignedValue_un1-field input").simulate("change", {
      target: { name: "assignedValue_un1", value: "anything2" }
    });

    // Submit the form.
    wrapper.find("form").simulate("submit");

    setImmediate(() => {
      expect(mockPost).lastCalledWith(
        "/metadata",
        {
          data: {
            attributes: {
              acTags: new Set(["anything2"]),
              bucket: "mybucket",
              customButtonName: "Save Metadata",
              dcType: "image",
              fileIdentifier: "fileId",
              originalFilename: "fileName",
              type: undefined
            },

            type: "metadata"
          }
        },
        expect.anything()
      );
      done();
    });
  });

  it("Renders an error after form submit if one is returned from the back-end.", async () => {
    // The post request will return an error.
    mockPost.mockImplementationOnce(() => ({
      data: {
        errors: [
          {
            detail: "DcType is mandatory",
            status: "422",
            title: "Constraint violation"
          }
        ],
        status: 422
      }
    }));

    const wrapper = mountWithAppContext(
      <EditMetadataFormPage
        originalFileName="fileName"
        fileIdentifier="fileId"
      />
    );
    wrapper.find(".originalFilename-field input").simulate("change", {
      target: { name: "originalFilename", value: "newfile" }
    });

    wrapper.find("form").simulate("submit");

    await flushPromises();
    wrapper.update();
    expect(wrapper.find(".alert.alert-danger").text()).toEqual(
      "Constraint violation: DcType is mandatory"
    );
  });
});
