import { OperationsResponse } from "components/api-client/jsonapi-types";
import { mount } from "enzyme";
import { ApiClientContext, createContextValue } from "../../../components";
import { PcrPrimerEditPage } from "../../../pages/pcr-primer/edit";
import { PcrPrimer } from "../../../types/seqdb-api/resources/PcrPrimer";

// Mock out the Link component, which normally fails when used outside of a Next app.
jest.mock("next/link", () => ({ children }) => <div>{children}</div>);

/** Mock Kitsu "get" method. */
const mockGet = jest.fn(async model => {
  if (model === "pcrPrimer/100") {
    // The request for the primer returns the test primer.
    return { data: TEST_PRIMER };
  } else {
    // Requests for the selectable resources (linked group, region, etc.) return an empty array.
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

describe("PcrPrimer edit page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("Provides a form to add a PcrPrimer.", done => {
    mockPatch.mockReturnValueOnce({
      data: [
        {
          data: {
            id: 1,
            type: "pcrPrimer"
          },
          status: 201
        }
      ] as OperationsResponse
    });

    const wrapper = mountWithContext(
      <PcrPrimerEditPage router={{ query: {}, push: mockPush } as any} />
    );

    // Edit the primer name.
    wrapper.find(".name-field input").simulate("change", {
      target: { name: "name", value: "New PcrPrimer" }
    });

    // Submit the form.
    wrapper.find("form").simulate("submit");

    setImmediate(() => {
      expect(mockPatch).lastCalledWith(
        "operations",
        [
          {
            op: "POST",
            path: "pcrPrimer",
            value: {
              attributes: {
                lotNumber: 1,
                name: "New PcrPrimer",
                seq: "",
                type: "PRIMER"
              },
              id: -100,
              type: "pcrPrimer"
            }
          }
        ],
        expect.anything()
      );

      // The user should be redirected to the new primer's details page.
      expect(mockPush).lastCalledWith("/pcr-primer/view?id=1");
      done();
    });
  });

  it("Renders an error after form submit if one is returned from the back-end.", done => {
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
      <PcrPrimerEditPage router={{ query: {}, push: mockPush } as any} />
    );

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

  it("Provides a form to edit a PcrPrimer.", async done => {
    // The patch request will be successful.
    mockPatch.mockReturnValueOnce({
      data: [
        {
          data: {
            id: 1,
            type: "pcrPrimer"
          },
          status: 201
        }
      ] as OperationsResponse
    });

    const wrapper = mountWithContext(
      <PcrPrimerEditPage
        router={{ query: { id: 100 }, push: mockPush } as any}
      />
    );

    // The page should load initially with a loading spinner.
    expect(wrapper.find(".spinner-border").exists()).toEqual(true);

    // Wait for the primer form to load.
    await Promise.resolve();
    wrapper.update();

    // // Check that the existing primer's seq value is in the field.
    expect(wrapper.find(".seq-field input").prop("value")).toEqual(
      "ACTACGATCAGCATCGATG"
    );

    // Modify the "designedBy" value.
    wrapper.find(".seq-field input").simulate("change", {
      target: { name: "seq", value: "new seq value" }
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
            path: "pcrPrimer/1",
            value: {
              attributes: expect.objectContaining({
                application: null,
                name: "ITS1",
                seq: "new seq value"
              }),
              id: "1",
              relationships: {
                group: {
                  data: expect.objectContaining({ id: "8", type: "group" })
                },
                region: {
                  data: expect.objectContaining({ id: "2", type: "region" })
                }
              },
              type: "pcrPrimer"
            }
          }
        ],
        expect.anything()
      );

      // The user should be redirected to the existing primer's details page.
      expect(mockPush).lastCalledWith("/pcr-primer/view?id=1");
      done();
    });
  });
});

/** Test Primer with all fields defined. Taken from SeqDB sample data. */
const TEST_PRIMER: Required<PcrPrimer> = {
  application: null,
  dateOrdered: null,
  designDate: null,
  designedBy: "Bob Jones",
  direction: "R",
  group: {
    description: null,
    groupName: "Public",
    id: "8",
    type: "group"
  },
  id: "1",
  lastModified: "2013-03-19T04:00:00.000+0000",
  lotNumber: 1,
  name: "ITS1",
  note: "ITS4 primer hybridizes at the 5' end of the 28S gene region.",
  position: null,
  purification: "none",
  reference: null,
  referenceSeqDir: null,
  referenceSeqFile: null,
  region: {
    description: "ITS Region Amplification",
    id: "2",
    name: "Internal Transcribed Spacer",
    symbol: "ITS",
    type: "region"
  },
  restrictionSite: "600",
  seq: "ACTACGATCAGCATCGATG",
  stockConcentration: "10",
  storage: null,
  supplier: null,
  targetSpecies: null,
  tmCalculated: "55",
  tmPe: null,
  type: "PRIMER",
  urllink: null,
  used4cloning: true,
  used4genotyping: false,
  used4nestedPcr: false,
  used4qrtpcr: false,
  used4sequencing: true,
  used4stdPcr: true,
  version: null
};
