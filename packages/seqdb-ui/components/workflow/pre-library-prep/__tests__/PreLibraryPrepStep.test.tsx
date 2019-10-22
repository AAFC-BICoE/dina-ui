import {
  ApiClientContext,
  createContextValue,
  ResourceSelect
} from "common-ui";
import { mount } from "enzyme";
import NumberFormat from "react-number-format";
import {
  Chain,
  ChainStepTemplate,
  ChainTemplate,
  Sample,
  StepResource,
  StepTemplate
} from "../../../../types/seqdb-api";
import { PreLibraryPrepStep } from "../PreLibraryPrepStep";

// Mock out the Link component, which normally fails when used outside of a Next app.
jest.mock("next/link", () => ({ children }) => <div>{children}</div>);

const TEST_SAMPLES: Sample[] = [
  { id: "1", type: "sample", name: "test sample 1" } as Sample,
  { id: "2", type: "sample", name: "test sample 2" } as Sample,
  { id: "3", type: "sample", name: "test sample 3" } as Sample,
  { id: "4", type: "sample", name: "test sample 4" } as Sample,
  { id: "5", type: "sample", name: "test sample 5" } as Sample
];

const TEST_SAMPLE_STEP_RESOURCES: StepResource[] = [
  { id: "1", sample: TEST_SAMPLES[0] } as StepResource,
  { id: "2", sample: TEST_SAMPLES[1] } as StepResource,
  { id: "3", sample: TEST_SAMPLES[2] } as StepResource,
  { id: "4", sample: TEST_SAMPLES[3] } as StepResource,
  { id: "5", sample: TEST_SAMPLES[4] } as StepResource
];

const TEST_CHAIN_TEMPLATE: ChainTemplate = {
  id: "1",
  name: "WGS",
  type: "chainTemplate"
};

const TEST_CHAIN: Chain = {
  chainTemplate: TEST_CHAIN_TEMPLATE,
  dateCreated: "2019-01-01",
  id: "1",
  name: "Mat's chain",
  type: "chain"
};

/** This is the first step in the chain that precedes this one. */
const TEST_SAMPLE_SELECTION_CHAIN_STEP_TEMPLATE: ChainStepTemplate = {
  chainTemplate: TEST_CHAIN_TEMPLATE,
  id: "1",
  stepNumber: 1,
  stepTemplate: { id: "1", type: "stepTemplate" } as StepTemplate,
  type: "chainStepTemplate"
};

/** This is the second and current step in the chain. */
const TEST_PRE_LIBRARY_PREP_CHAIN_STEP_TEMPLATE: ChainStepTemplate = {
  chainTemplate: TEST_CHAIN_TEMPLATE,
  id: "2",
  stepNumber: 2,
  stepTemplate: { id: "2", type: "stepTemplate" } as StepTemplate,
  type: "chainStepTemplate"
};

const TEST_CHAIN_STEP_TEMPLATES = [
  TEST_SAMPLE_SELECTION_CHAIN_STEP_TEMPLATE,
  TEST_PRE_LIBRARY_PREP_CHAIN_STEP_TEMPLATE
];

const mockGet = jest.fn();
const mockPatch = jest.fn();

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

// Mock random numbers to only return 0.5.
const mockMath = Object.create(global.Math);
mockMath.random = () => 0.5;
global.Math = mockMath;

function getWrapper() {
  return mount(
    <ApiClientContext.Provider value={createContextValue()}>
      <PreLibraryPrepStep
        chain={TEST_CHAIN}
        chainStepTemplates={TEST_CHAIN_STEP_TEMPLATES}
        step={TEST_PRE_LIBRARY_PREP_CHAIN_STEP_TEMPLATE}
      />
    </ApiClientContext.Provider>
  );
}

describe("PreLibraryPrepStep UI", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    /** Mock Kitsu "get" method. */
    mockGet.mockImplementation(async (model, params) => {
      if (model === "stepResource") {
        if (params.include === "sample,sample.group") {
          return { data: TEST_SAMPLE_STEP_RESOURCES };
        } else if (params.include.includes("sample,preLibraryPrep")) {
          return { data: [] };
        }
      } else {
        return { data: [] };
      }
    });

    /** Mock axios for operations requests. */
    mockPatch.mockImplementation(async (_, __) => ({ data: [] }));
  });

  it("Renders the samples from the list", async () => {
    const wrapper = getWrapper();

    // Await initial queries.
    await new Promise(setImmediate);
    wrapper.update();

    expect(mockGet).toHaveBeenCalledTimes(3);

    const [
      sampleStepResourceCall,
      ,
      preLibraryPrepStepResourceCall
    ] = mockGet.mock.calls;

    expect(sampleStepResourceCall).toEqual([
      "stepResource",
      {
        // It should be filtered to the previous step's stepResources.
        filter: {
          "chain.chainId": "1",
          "chainStepTemplate.chainStepTemplateId": "1",
          rsql: ""
        },
        include: "sample,sample.group",
        page: {
          limit: 100,
          offset: 0
        }
      }
    ]);
    expect(preLibraryPrepStepResourceCall).toEqual([
      "stepResource",
      {
        fields: {
          product: "name",
          protocol: "name",
          sample: "name,version"
        },
        filter: {
          "chain.chainId": "1",
          "chainStepTemplate.chainStepTemplateId": "2",
          rsql: "sample.sampleId=in=(1,2,3,4,5) and sample.name!=0.5"
        },
        include:
          "sample,preLibraryPrep,preLibraryPrep.protocol,preLibraryPrep.product",
        page: {
          limit: 1000
        }
      }
    ]);

    // The tables should show 'not sheared' and 'no size selection'.
    expect(wrapper.containsMatchingElement(<div>Not Sheared</div>)).toEqual(
      true
    );
    expect(
      wrapper.containsMatchingElement(<div>No Size Selection</div>)
    ).toEqual(true);
    expect(wrapper.containsMatchingElement(<div>Sheared</div>)).toEqual(false);
    expect(
      wrapper.containsMatchingElement(<div>Size Selection Added</div>)
    ).toEqual(false);
  });

  it("Lets you add shearing details for the checked samples.", async () => {
    const wrapper = getWrapper();

    // Await initial queries.
    await new Promise(setImmediate);
    wrapper.update();

    // Select samples 3 to 5.
    wrapper
      .find(".selected-samples .rt-tbody input[type='checkbox']")
      .at(2)
      .prop("onClick")({ target: { checked: true } } as any);
    wrapper.update();
    wrapper
      .find(".selected-samples .rt-tbody input[type='checkbox']")
      .at(4)
      .prop("onClick")({ shiftKey: true, target: { checked: true } } as any);
    wrapper.update();

    // Add the preLibraryPrep details.
    wrapper
      .find(".inputAmount-field")
      .find(NumberFormat)
      .prop("onValueChange")({ floatValue: 1234 } as any);
    (wrapper
      .find(".protocol-field")
      .find(ResourceSelect)
      .prop("onChange") as any)({ id: "1", type: "protocol" });
    (wrapper
      .find(".product-field")
      .find(ResourceSelect)
      .prop("onChange") as any)({ id: "1", type: "product" });

    // Assume there are no stepresources for these samples,
    // so this form submit creates 3 stepResources and does not edit existing ones.
    mockPatch.mockImplementation(async (_, operations) => {
      if (operations[0].path === "preLibraryPrep") {
        return {
          data: [
            {
              data: {
                attributes: {
                  preLibraryPrepType: "SHEARING"
                },
                id: "1",
                type: "preLibraryPrep"
              },
              status: 201
            },
            {
              data: {
                attributes: {
                  preLibraryPrepType: "SHEARING"
                },
                id: "2",
                type: "preLibraryPrep"
              },
              status: 201
            },
            {
              data: {
                attributes: {
                  preLibraryPrepType: "SHEARING"
                },
                id: "3",
                type: "preLibraryPrep"
              },
              status: 201
            }
          ]
        };
      }
      if (operations[0].path === "stepResource") {
        return {
          data: [
            { status: 201, data: { id: "11", type: "stepResource" } },
            { status: 201, data: { id: "12", type: "stepResource" } },
            { status: 201, data: { id: "13", type: "stepResource" } }
          ]
        };
      }
    });

    // Submit the form
    wrapper.find("form.pre-library-prep-form").simulate("submit");
    // Await form submit.
    await new Promise(setImmediate);

    // There should have been two patch calls:
    // One to add the prelibrarypreps
    // and one to add the stepResources.
    expect(mockPatch).toHaveBeenCalledTimes(2);

    const [prepCall, stepResourceCall] = mockPatch.mock.calls;

    // There should have been 3 preps created.
    expect(prepCall).toEqual([
      "operations",
      [
        {
          op: "POST",
          path: "preLibraryPrep",
          value: {
            attributes: {
              inputAmount: 1234,
              preLibraryPrepType: "SHEARING"
            },
            id: -100,
            relationships: {
              product: {
                data: {
                  id: "1",
                  type: "product"
                }
              },
              protocol: {
                data: {
                  id: "1",
                  type: "protocol"
                }
              }
            },
            type: "preLibraryPrep"
          }
        },
        {
          op: "POST",
          path: "preLibraryPrep",
          value: {
            attributes: {
              inputAmount: 1234,
              preLibraryPrepType: "SHEARING"
            },
            id: -101,
            relationships: {
              product: {
                data: {
                  id: "1",
                  type: "product"
                }
              },
              protocol: {
                data: {
                  id: "1",
                  type: "protocol"
                }
              }
            },
            type: "preLibraryPrep"
          }
        },
        {
          op: "POST",
          path: "preLibraryPrep",
          value: {
            attributes: {
              inputAmount: 1234,
              preLibraryPrepType: "SHEARING"
            },
            id: -102,
            relationships: {
              product: {
                data: {
                  id: "1",
                  type: "product"
                }
              },
              protocol: {
                data: {
                  id: "1",
                  type: "protocol"
                }
              }
            },
            type: "preLibraryPrep"
          }
        }
      ],
      expect.anything()
    ]);

    // There should have been 3 step resources created.
    expect(stepResourceCall).toEqual([
      "operations",
      [
        {
          op: "POST",
          path: "stepResource",
          value: {
            attributes: {
              type: "INPUT",
              value: "SHEARING"
            },
            id: -100,
            relationships: {
              chain: {
                data: {
                  id: "1",
                  type: "chain"
                }
              },
              chainStepTemplate: {
                data: {
                  id: "2",
                  type: "chainStepTemplate"
                }
              },
              preLibraryPrep: {
                data: {
                  id: "1",
                  type: "preLibraryPrep"
                }
              },
              sample: {
                data: {
                  id: "3",
                  type: "sample"
                }
              }
            },
            type: "stepResource"
          }
        },
        {
          op: "POST",
          path: "stepResource",
          value: {
            attributes: {
              type: "INPUT",
              value: "SHEARING"
            },
            id: -101,
            relationships: {
              chain: {
                data: {
                  id: "1",
                  type: "chain"
                }
              },
              chainStepTemplate: {
                data: {
                  id: "2",
                  type: "chainStepTemplate"
                }
              },
              preLibraryPrep: {
                data: {
                  id: "2",
                  type: "preLibraryPrep"
                }
              },
              sample: {
                data: {
                  id: "4",
                  type: "sample"
                }
              }
            },
            type: "stepResource"
          }
        },
        {
          op: "POST",
          path: "stepResource",
          value: {
            attributes: {
              type: "INPUT",
              value: "SHEARING"
            },
            id: -102,
            relationships: {
              chain: {
                data: {
                  id: "1",
                  type: "chain"
                }
              },
              chainStepTemplate: {
                data: {
                  id: "2",
                  type: "chainStepTemplate"
                }
              },
              preLibraryPrep: {
                data: {
                  id: "3",
                  type: "preLibraryPrep"
                }
              },
              sample: {
                data: {
                  id: "5",
                  type: "sample"
                }
              }
            },
            type: "stepResource"
          }
        }
      ],
      expect.anything()
    ]);
  });

  it("Edits existing PreLibraryPreps when they exist, and creates new ones when they don't.", async () => {
    const wrapper = getWrapper();

    // Await initial queries.
    await new Promise(setImmediate);
    wrapper.update();

    // Select samples 3 to 5.
    wrapper
      .find(".selected-samples .rt-tbody input[type='checkbox']")
      .at(2)
      .prop("onClick")({ target: { checked: true } } as any);
    wrapper.update();
    wrapper
      .find(".selected-samples .rt-tbody input[type='checkbox']")
      .at(4)
      .prop("onClick")({ shiftKey: true, target: { checked: true } } as any);
    wrapper.update();

    // Add the preLibraryPrep details.
    wrapper
      .find(".inputAmount-field")
      .find(NumberFormat)
      .prop("onValueChange")({ floatValue: 4321 } as any);

    mockGet.mockImplementation((path, params) => {
      if (
        path === "stepResource" &&
        params.include.includes("sample,preLibraryPrep")
      ) {
        expect(params.filter.rsql).toEqual("sample.sampleId=in=(3,4,5)");
        // The first 2 samples should already have preLibraryPreps.
        return {
          data: [
            {
              id: "11",
              preLibraryPrep: { id: "1", type: "preLibraryPrep" },
              sample: { id: "3", type: "sample" },
              type: "stepResource"
            },
            {
              id: "12",
              preLibraryPrep: { id: "2", type: "preLibraryPrep" },
              sample: { id: "4", type: "sample" },
              type: "stepResource"
            }
          ]
        };
      } else {
        return { data: [] };
      }
    });

    mockPatch.mockImplementation(async (_, operations) => {
      // The first patch request should edit the first two and create the third.
      if (operations[0].path === "preLibraryPrep/1") {
        return {
          data: [
            {
              data: {
                attributes: {
                  preLibraryPrepType: "SHEARING"
                },
                id: "1",
                type: "preLibraryPrep"
              },
              status: 201
            },
            {
              data: {
                attributes: {
                  preLibraryPrepType: "SHEARING"
                },
                id: "2",
                type: "preLibraryPrep"
              },
              status: 201
            },
            {
              data: {
                attributes: {
                  preLibraryPrepType: "SHEARING"
                },
                id: "3",
                type: "preLibraryPrep"
              },
              status: 201
            }
          ]
        };
      }
      // The second patch request should create the third stepResource.
      if (operations[0].path === "stepResource") {
        return {
          data: [{ status: 201, data: { id: "13", type: "stepResource" } }]
        };
      }
    });

    // Submit the form
    wrapper.find("form.pre-library-prep-form").simulate("submit");
    // Await form submit.
    await new Promise(setImmediate);

    const [prepCall, stepResourceCall] = mockPatch.mock.calls;

    // There should have been two PATCH operations and one POST operation.
    expect(prepCall).toEqual([
      "operations",
      [
        // The existing ones:
        {
          op: "PATCH",
          path: "preLibraryPrep/1",
          value: {
            attributes: {
              inputAmount: 4321,
              preLibraryPrepType: "SHEARING"
            },
            id: "1",
            type: "preLibraryPrep"
          }
        },
        {
          op: "PATCH",
          path: "preLibraryPrep/2",
          value: {
            attributes: {
              inputAmount: 4321,
              preLibraryPrepType: "SHEARING"
            },
            id: "2",
            type: "preLibraryPrep"
          }
        },
        // The new one:
        {
          op: "POST",
          path: "preLibraryPrep",
          value: {
            attributes: {
              inputAmount: 4321,
              preLibraryPrepType: "SHEARING"
            },
            id: -100,
            type: "preLibraryPrep"
          }
        }
      ],
      expect.anything()
    ]);

    // Only one stepResource should have been created: for the new preLibraryPrep
    expect(stepResourceCall).toEqual([
      "operations",
      [
        {
          op: "POST",
          path: "stepResource",
          value: {
            attributes: {
              type: "INPUT",
              value: "SHEARING"
            },
            id: -100,
            relationships: {
              chain: {
                data: {
                  id: "1",
                  type: "chain"
                }
              },
              chainStepTemplate: {
                data: {
                  id: "2",
                  type: "chainStepTemplate"
                }
              },
              preLibraryPrep: {
                data: {
                  id: "3",
                  type: "preLibraryPrep"
                }
              },
              sample: {
                data: {
                  id: "5",
                  type: "sample"
                }
              }
            },
            type: "stepResource"
          }
        }
      ],
      expect.anything()
    ]);
  });

  it("Does nothing if you submit the form without checking any sample checkboxes.", async () => {
    const wrapper = getWrapper();

    // Await initial queries.
    await new Promise(setImmediate);
    wrapper.update();

    // Submit the form
    wrapper.find("form.pre-library-prep-form").simulate("submit");
    // Await form submit.
    await new Promise(setImmediate);

    // There should have been two empty operations calls.
    expect(mockPatch.mock.calls).toEqual([
      ["operations", [], expect.anything()],
      ["operations", [], expect.anything()]
    ]);
  });

  it("Does nothing if you click the Remove Shearing button without checking any sample checkboxes.", async () => {
    const wrapper = getWrapper();

    // Await initial queries.
    await new Promise(setImmediate);
    wrapper.update();

    // Submit the form
    wrapper.find("button.remove-shearing").simulate("click");
    // Await form submit.
    await new Promise(setImmediate);

    // There should have been one empty operations call.
    expect(mockPatch.mock.calls).toEqual([
      ["operations", [], expect.anything()]
    ]);
  });

  it("Does nothing if you click the Remove Size Selection button without checking any sample checkboxes.", async () => {
    const wrapper = getWrapper();

    // Await initial queries.
    await new Promise(setImmediate);
    wrapper.update();

    // Submit the form
    wrapper.find("button.remove-size-selection").simulate("click");
    // Await form submit.
    await new Promise(setImmediate);

    // There should have been one empty operations call.
    expect(mockPatch.mock.calls).toEqual([
      ["operations", [], expect.anything()]
    ]);
  });

  it("Shows the Shearing and Size Selection status in the table.", async () => {
    mockGet.mockImplementation(async (path, params) => {
      // The request for the sample stepResources.
      if (
        path === "stepResource" &&
        params.include.includes("sample,sample.group")
      ) {
        // Return stepResources with samples.
        return {
          data: [
            {
              id: "1",
              sample: { id: "5", type: "sample" },
              type: "stepResource"
            },
            {
              id: "2",
              sample: { id: "6", type: "sample" },
              type: "stepResource"
            }
          ]
        };
      }

      // The request for the preLibraryPrep stepResources.
      if (
        path === "stepResource" &&
        params.include.includes("sample,preLibraryPrep")
      ) {
        // Return stepResources with preLibraryPreps and samples.
        return {
          data: [
            {
              id: "3",
              preLibraryPrep: {
                id: "1",
                preLibraryPrepType: "SHEARING",
                type: "preLibraryPrep"
              },
              sample: { id: "5", type: "sample" },
              type: "stepResource",
              value: "SHEARING"
            },
            {
              id: "4",
              preLibraryPrep: {
                id: "2",
                preLibraryPrepType: "SIZE_SELECTION",
                type: "preLibraryPrep"
              },
              sample: { id: "6", type: "sample" },
              type: "stepResource",
              value: "SIZE_SELECTION"
            }
          ]
        };
      }

      // Empty array otherwise so the ResourceSelect doesn't get an undefined response.
      return { data: [] };
    });

    const wrapper = getWrapper();

    // Await initial queries.
    await new Promise(setImmediate);
    wrapper.update();

    const rows = wrapper.find(".rt-tr");

    // Row 1 should be sheared but not size selected. Row 2 should be size selected but not sheared.
    expect(rows.at(1).containsMatchingElement(<div>Sheared</div>)).toEqual(
      true
    );
    expect(
      rows.at(1).containsMatchingElement(<div>No Size Selection</div>)
    ).toEqual(true);
    expect(rows.at(2).containsMatchingElement(<div>Not Sheared</div>)).toEqual(
      true
    );
    expect(
      rows.at(2).containsMatchingElement(<div>Size Selection Added</div>)
    ).toEqual(true);
  });

  it("Lets you delete selected shearing or size selection stepResources.", async () => {
    mockGet.mockImplementation(async (path, params) => {
      // Mock sample table response.
      if (
        path === "stepResource" &&
        params.include.includes("sample,sample.group")
      ) {
        return {
          data: [
            { id: "5", type: "stepResource", sample: { id: "11" } },
            { id: "6", type: "stepResource", sample: { id: "12" } },
            { id: "7", type: "stepResource", sample: { id: "13" } },
            { id: "8", type: "stepResource", sample: { id: "14" } }
          ]
        };
      }

      // Mock stepResource call from inside the deleteStepResources function.
      if (
        path === "stepResource" &&
        params.include.includes("sample,preLibraryPrep")
      ) {
        return {
          data: [
            {
              id: "100",
              preLibraryPrep: { id: "200", type: "preLibraryPrep" },
              sample: { id: "12", type: "sample" },
              type: "stepResource"
            }
          ]
        };
      }

      return { data: [] };
    });

    const wrapper = getWrapper();

    // Await initial queries.
    await new Promise(setImmediate);
    wrapper.update();

    // Select samples 2 to 4.
    wrapper
      .find(".selected-samples .rt-tbody input[type='checkbox']")
      .at(1)
      .prop("onClick")({ target: { checked: true } } as any);
    wrapper.update();
    wrapper
      .find(".selected-samples .rt-tbody input[type='checkbox']")
      .at(3)
      .prop("onClick")({ shiftKey: true, target: { checked: true } } as any);
    wrapper.update();

    wrapper.find("button.remove-shearing").simulate("click");

    // Await the request and page refresh.
    await new Promise(setImmediate);
    wrapper.update();

    expect(mockPatch).toHaveBeenCalledTimes(1);
    expect(mockPatch).lastCalledWith(
      "operations",
      [
        { op: "DELETE", path: "stepResource/100" },
        { op: "DELETE", path: "preLibraryPrep/200" }
      ],
      expect.anything()
    );
  });

  it("Shows different view modes for the shearing and size selectino details", async () => {
    mockGet.mockImplementation(async (path, params) => {
      // The request for the sample stepResources.
      if (
        path === "stepResource" &&
        params.include.includes("sample,sample.group")
      ) {
        return {
          data: [{ id: "5", type: "stepResource", sample: { id: "10" } }]
        };
      }

      // The request for the preLibraryPrep stepResources; There should be a prelibraryprep with
      // an inputAmount for the sample.
      if (
        path === "stepResource" &&
        params.include.includes("sample,preLibraryPrep")
      ) {
        return {
          data: [
            {
              id: "100",
              preLibraryPrep: {
                id: "200",
                inputAmount: 999,
                type: "preLibraryPrep"
              },
              sample: { id: "10", type: "sample" },
              type: "stepResource",
              value: "SIZE_SELECTION"
            }
          ]
        };
      }

      return { data: [] };
    });

    const wrapper = getWrapper();

    // Await initial queries.
    await new Promise(setImmediate);
    wrapper.update();

    wrapper
      .find("li.react-tabs__tab.SIZE_SELECTION_DETAILS-toggle")
      .simulate("click");

    wrapper.update();

    expect(
      wrapper
        .find("div.rt-resizable-header-content[children='Input Amount']")
        .exists()
    ).toEqual(true);

    // The mock input amount 999 should show up in the table.
    expect(wrapper.find("div.rt-td[children=999]").exists()).toEqual(true);
  });
});
