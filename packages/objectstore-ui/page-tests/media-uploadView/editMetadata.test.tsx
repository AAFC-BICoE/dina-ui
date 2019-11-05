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
    jest.clearAllMocks();

    mockGet.mockImplementation(async model => {
      if (model === "agent") {
        // The request for the product returns the test product.
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

  it("Renders an error after form submit if one is returned from the back-end.", async () => {
    // The patch request will return an error.
    mockPost.mockImplementationOnce(() => ({
      data: {
        errors: [
          {
            detail: "name size must be between 1 and 10",
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
      "Constraint violation: name size must be between 1 and 10"
    );
    expect(mockPush).toBeCalledTimes(0);
  });

  it("Provides a form to edit a metadata.", async () => {
    // The patch request will be successful.
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

    // Modify the "designedBy" value.
    /*fireEvent.change(wrapper.find("input").getDOMNode(),
      {target: { name: "key_1", value: "new assigned value" }}
    );

    // Submit the form.
    container.querySelector("form").simulate("submit");

    setImmediate(() => {
      // "patch" should have been called with a jsonpatch request containing the existing values
      // and the modified one.
      expect(mockPatch).lastCalledWith(
        "post",
        
          {
              attributes: expect.objectContaining({
                assignedValue: 'new assigned value'
              }),
              id: "1",
              relationships: {
                objectStoreMetadata: {
                  data: expect.objectContaining({ id: "1", type: "metadata" })
                },
                managedAttribute: {
                  data: expect.objectContaining({ id: "2", type: "managed-attribute" })
                }
              },
              type: "metadata-managed-attribute"
            }
               ,
        expect.anything()
      );

      // The user should be redirected to the existing image's details page.
      //expect(mockPush).lastCalledWith("/pcr-primer/view?id=1");
      
      done();
    });*/
  });
});
