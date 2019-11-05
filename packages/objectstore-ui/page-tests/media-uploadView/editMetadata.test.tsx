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

  it("Provides a form to edit a metadata.", async () => {
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

    await Promise.resolve();
    wrapper.update();

    const addButton = wrapper.find("button.list-inline-item.btn.btn-primary");

    // Check that the existing add button is displayed
    expect(addButton).toBeTruthy();

    wrapper.find(".dcFormat").simulate("change", {
      target: { name: "dcFormat", value: "IMAGING" }
    });

    // Submit the form.
    wrapper.find("form").simulate("submit");

    await new Promise(setImmediate);
    wrapper.update();

    expect(mockPost).lastCalledWith(
      "/metadata",
      {
        data: {
          attributes: {
            dcFormat: "IMAGING",
            type: undefined
          },

          type: "metadata"
        }
      },
      expect.anything()
    );
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

    wrapper.find(".form-group.row .dcFormat").simulate("change", {
      target: { name: "dcFormat", value: "new assigned value" }
    });

    wrapper.find("form").simulate("submit");

    await new Promise(setImmediate);
    wrapper.update();

    expect(wrapper.find(".alert.alert-danger").text()).toEqual(
      "Constraint violation: DcType is mandatory"
    );
  });
});
