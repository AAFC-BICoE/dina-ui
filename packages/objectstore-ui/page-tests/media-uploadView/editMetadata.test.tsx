import { ApiClientContext, createContextValue } from "common-ui";
import { mount } from "enzyme";
import { EditMetadataFormPage } from "../../pages/media-uploadView/editMetadata";

// Mock out the Link component, which normally fails when used outside of a Next app.
jest.mock("next/link", () => ({ children }) => <div>{children}</div>);

/** Mock axios for operations requests. */
const mockPost = jest.fn();

/** Mock next.js' router "push" function for navigating pages. */
const mockPush = jest.fn();

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

function mountWithContext(element: JSX.Element) {
  return mount(
    <ApiClientContext.Provider value={createContextValue()}>
      {element}
    </ApiClientContext.Provider>
  );
}

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
        router={{ query: { fileName: "file" }, push: mockPush } as any}
      />
    );
    const wrapper = mountWithContext(ui);

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
              dcFormat: "dcFormat",
              originalFilename: expect.anything(),
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

    const wrapper = mountWithContext(
      <EditMetadataFormPage router={{ query: {}, push: mockPush } as any} />
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
