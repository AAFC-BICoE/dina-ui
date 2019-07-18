import { OperationsResponse } from "components/api-client/jsonapi-types";
import { mount } from "enzyme";
import { ApiClientContext, createContextValue } from "../../../components";
import { ProtocolEditPage } from "../../../pages/protocol/edit";
import { Protocol } from "../../../types/seqdb-api/resources/Protocol";

// Mock out the Link component, which normally fails when used outside of a Next app.
jest.mock("next/link", () => ({ children }) => <div>{children}</div>);

/** Mock Kitsu "get" method. */
const mockGet = jest.fn(async model => {
  if (model === "protocol/10") {
    // The request for the protocol returns the test protocol.
    return { data: TEST_PROTOCOL };
  } else {
    // Requests for the selectable resources (linked group, kit, etc.) return an empty array.
    return { data: [] };
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

function mountWithContext(element: JSX.Element) {
  return mount(
    <ApiClientContext.Provider value={createContextValue()}>
      {element}
    </ApiClientContext.Provider>
  );
}

describe("Protocol edit page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("Provides a form to add a Protocol.", done => {
    mockPatch.mockReturnValueOnce({
      data: [
        {
          data: {
            id: 1,
            type: "protocol"
          },
          status: 201
        }
      ] as OperationsResponse
    });

    const wrapper = mountWithContext(
      <ProtocolEditPage router={{ query: {}, push: mockPush } as any} />
    );

    // Edit the protocol name, adding mandatory field values
    wrapper.find(".name-field input").simulate("change", {
      target: { name: "name", value: "New Protocol" }
    });

    // Submit the form.
    wrapper.find("form").simulate("submit");

    setImmediate(() => {
      expect(mockPatch).lastCalledWith(
        "operations",
        [
          {
            op: "POST",
            path: "protocol",
            value: {
              attributes: {
                name: "New Protocol"
              },
              id: -100,
              type: "protocol"
            }
          }
        ],
        expect.anything()
      );

      // The user should be redirected to the new protocol's details page.
      expect(mockPush).lastCalledWith("/protocol/view?id=1");
      done();
    });
  });

  it("Provides a form to edit a Protocol.", async done => {
    // The get request will return the existing protocol.
    mockGet.mockImplementation(async model => {
      if (model === "protocol/10") {
        // The request for the protocol returns the test protocol.
        return { data: TEST_PROTOCOL };
      } else {
        // Requests for the selectable resources (linked group) return an empty array.
        return { data: [] };
      }
    });

    // The patch request will be successful.
    mockPatch.mockReturnValueOnce({
      data: [
        {
          data: {
            id: 10,
            type: "protocol"
          },
          status: 201
        }
      ] as OperationsResponse
    });

    const wrapper = mountWithContext(
      <ProtocolEditPage router={{ query: { id: 10 }, push: mockPush } as any} />
    );

    // The page should load initially with a loading spinner.
    expect(wrapper.find(".spinner-border").exists()).toEqual(true);

    // Wait for the product form to load.
    await Promise.resolve();
    wrapper.update();

    // // Check that the existing protocol's name value is in the field.
    expect(wrapper.find(".name-field input").prop("value")).toEqual(
      "PCR Standardized for Sequencing (10ul), +BSA"
    );

    // Modify the "description" value.
    wrapper.find(".description-field input").simulate("change", {
      target: {
        name: "description",
        value: "new desc for protocol 10"
      }
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
            path: "protocol/10",
            value: {
              attributes: expect.objectContaining({
                description: "new desc for protocol 10",
                name: "PCR Standardized for Sequencing (10ul), +BSA"
              }),
              id: "10",
              relationships: {
                group: {
                  data: expect.objectContaining({ id: "8", type: "group" })
                },
                kit: {
                  data: expect.objectContaining({ id: "10", type: "product" })
                }
              },
              type: "protocol"
            }
          }
        ],
        expect.anything()
      );

      // The user should be redirected to the existing protocol's details page.
      expect(mockPush).lastCalledWith("/protocol/view?id=10");
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
              detail: "name size must be between 1 and 10",
              status: "422",
              title: "Constraint violation"
            }
          ],
          status: 422
        }
      ] as OperationsResponse
    }));

    const wrapper = mountWithContext(
      <ProtocolEditPage router={{ query: {}, push: mockPush } as any} />
    );

    // Edit the protocol name.
    wrapper.find(".name-field input").simulate("change", {
      target: { name: "name", value: "invalid name" }
    });

    // Submit the form.
    wrapper.find("form").simulate("submit");

    setImmediate(() => {
      wrapper.update();
      expect(wrapper.find(".alert.alert-danger").text()).toEqual(
        "Constraint violation: name size must be between 1 and 10"
      );
      expect(mockPush).toBeCalledTimes(0);
      done();
    });
  });
});

/** Test Protocol with all fields defined. */
const TEST_PROTOCOL: Required<Protocol> = {
  description: "protocol desc",
  equipment: "equip",
  forwardPrimerConcentration: "fPrimer",
  group: {
    description: "protocol group desc",
    groupName: "Public",
    id: "8",
    type: "group"
  },
  id: "10",
  kit: {
    group: {
      description: "product group desc",
      groupName: "ganx",
      id: "8",
      type: "group"
    },
    id: "10",
    lastModified: "2019-03-27T04:00:00.000+0000",
    name: "Rapid Alkaline DNA Extraction",
    type: "product",
    upc: "Universal product code"
  },
  lastModified: "2019-03-27T04:00:00.000+0000",
  name: "PCR Standardized for Sequencing (10ul), +BSA",
  notes: "some notes",
  reactionMixVolume: "0.1",
  reactionMixVolumePerTube: "0.01",
  reference: " some ref",
  reversePrimerConcentration: "rPrimer",
  steps: "step",
  type: "PCR_REACTION",
  version: "1"
};
