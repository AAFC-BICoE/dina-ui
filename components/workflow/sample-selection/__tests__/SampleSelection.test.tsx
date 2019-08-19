import { mount } from "enzyme";
import { ApiClientContext, createContextValue } from "../../..";
import {
  Chain,
  ChainStepTemplate,
  ChainTemplate,
  Sample,
  StepResource,
  StepTemplate
} from "../../../../types/seqdb-api";
import { SampleSelection } from "../SampleSelection";

// Mock out the Link component, which normally fails when used outside of a Next app.
jest.mock("next/link", () => ({ children }) => <div>{children}</div>);

const TEST_SAMPLES: Sample[] = [
  { id: "1", type: "sample", name: "test sample 1" } as Sample,
  { id: "2", type: "sample", name: "test sample 2" } as Sample,
  { id: "3", type: "sample", name: "test sample 3" } as Sample,
  { id: "4", type: "sample", name: "test sample 4" } as Sample,
  { id: "5", type: "sample", name: "test sample 5" } as Sample
];

const TEST_STEP_RESOURCES: StepResource[] = [
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

const TEST_CHAIN_STEP_TEMPLATE: ChainStepTemplate = {
  chainTemplate: TEST_CHAIN_TEMPLATE,
  id: "1",
  stepNumber: 1,
  stepTemplate: { id: "1", type: "stepTemplate" } as StepTemplate,
  type: "chainStepTemplate"
};

const TEST_CHAIN_STEP_TEMPLATES = [TEST_CHAIN_STEP_TEMPLATE];

/** Mock Kitsu "get" method. */
const mockGet = jest.fn(async model => {
  if (model === "sample") {
    return { data: TEST_SAMPLES };
  } else if (model === "stepResource") {
    return { data: TEST_STEP_RESOURCES };
  } else {
    return { data: [] };
  }
});

/** Mock axios for operations requests. */
const mockPatch = jest.fn(async () => ({ data: [] }));

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

function getWrapper() {
  return mount(
    <ApiClientContext.Provider value={createContextValue()}>
      <SampleSelection
        chain={TEST_CHAIN}
        chainStepTemplates={TEST_CHAIN_STEP_TEMPLATES}
        step={TEST_CHAIN_STEP_TEMPLATE}
      />
    </ApiClientContext.Provider>
  );
}

describe("Sample Selection UI", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("Renders the available samples.", async () => {
    const wrapper = getWrapper();

    // Await available samples query.
    await new Promise(setImmediate);
    wrapper.update();

    wrapper
      .find(".available-samples rt-tbody")
      .contains(<div>test sample 1</div>);
    wrapper
      .find(".available-samples rt-tbody")
      .contains(<div>test sample 5</div>);
  });

  it("Lets you select a single sample using the single select button.", async () => {
    const wrapper = getWrapper();

    // Await available samples query.
    await new Promise(setImmediate);
    wrapper.update();

    wrapper
      .find(".single-select-button")
      .at(0)
      .simulate("click");

    await new Promise(setImmediate);
    wrapper.update();

    expect(mockPatch).lastCalledWith(
      "operations",
      [
        {
          op: "POST",
          path: "stepResource",
          value: {
            attributes: { type: "INPUT", value: "SAMPLE" },
            id: -100,
            relationships: {
              chain: { data: { id: "1", type: "chain" } },
              chainStepTemplate: {
                data: { id: "1", type: "chainStepTemplate" }
              },
              sample: {
                data: { id: "1", name: "test sample 1", type: "sample" }
              }
            },
            type: "stepResource"
          }
        }
      ],
      expect.anything()
    );
  });

  it("Lets you select multiple samples using checkboxes.", async () => {
    const wrapper = getWrapper();

    // Await available samples query.
    await new Promise(setImmediate);
    wrapper.update();

    // Select samples 3 to 5.
    wrapper
      .find(".available-samples input[type='checkbox']")
      .at(2)
      .prop("onClick")({ target: { checked: true } } as any);
    wrapper.update();
    wrapper
      .find(".available-samples input[type='checkbox']")
      .at(4)
      .prop("onClick")({ shiftKey: true, target: { checked: true } } as any);
    wrapper.update();

    wrapper.find("button.select-all-checked-button").simulate("click");

    // Await the patch request.
    await new Promise(setImmediate);
    wrapper.update();

    expect(mockPatch).lastCalledWith(
      "operations",
      [
        {
          op: "POST",
          path: "stepResource",
          value: {
            attributes: { type: "INPUT", value: "SAMPLE" },
            id: -100,
            relationships: {
              chain: { data: { id: "1", type: "chain" } },
              chainStepTemplate: {
                data: { id: "1", type: "chainStepTemplate" }
              },
              sample: { data: { id: "3", type: "sample" } }
            },
            type: "stepResource"
          }
        },
        {
          op: "POST",
          path: "stepResource",
          value: {
            attributes: { type: "INPUT", value: "SAMPLE" },
            id: -101,
            relationships: {
              chain: { data: { id: "1", type: "chain" } },
              chainStepTemplate: {
                data: { id: "1", type: "chainStepTemplate" }
              },
              sample: { data: { id: "4", type: "sample" } }
            },
            type: "stepResource"
          }
        },
        {
          op: "POST",
          path: "stepResource",
          value: {
            attributes: { type: "INPUT", value: "SAMPLE" },
            id: -102,
            relationships: {
              chain: { data: { id: "1", type: "chain" } },
              chainStepTemplate: {
                data: { id: "1", type: "chainStepTemplate" }
              },
              sample: { data: { id: "5", type: "sample" } }
            },
            type: "stepResource"
          }
        }
      ],
      expect.anything()
    );
  });

  it("Lets you deselect a single sample using the single deselect button.", async () => {
    const wrapper = getWrapper();

    // Await available samples query.
    await new Promise(setImmediate);
    wrapper.update();

    wrapper
      .find(".single-deselect-button")
      .at(0)
      .simulate("click");

    await new Promise(setImmediate);
    wrapper.update();

    expect(mockPatch).lastCalledWith(
      "operations",
      [
        {
          op: "DELETE",
          path: "stepResource/1",
          value: { id: "1", type: "stepResource" }
        }
      ],
      expect.anything()
    );
  });

  it("Lets you deselect multiple samples using checkboxes.", async () => {
    const wrapper = getWrapper();

    // Await available samples and selected samples queries.
    await new Promise(setImmediate);
    wrapper.update();

    // Deselect/delete the second to fourth stepResources.
    wrapper
      .find(".selected-samples input[type='checkbox']")
      .at(1)
      .prop("onClick")({ target: { checked: true } } as any);
    wrapper.update();
    wrapper
      .find(".selected-samples input[type='checkbox']")
      .at(3)
      .prop("onClick")({ shiftKey: true, target: { checked: true } } as any);
    wrapper.update();

    wrapper.find(".deselect-all-checked-button").simulate("click");

    // Await available samples and selected samples queries.
    await new Promise(setImmediate);
    wrapper.update();

    expect(mockPatch).lastCalledWith(
      "operations",
      [
        {
          op: "DELETE",
          path: "stepResource/2",
          value: { id: "2", type: "stepResource" }
        },
        {
          op: "DELETE",
          path: "stepResource/3",
          value: { id: "3", type: "stepResource" }
        },
        {
          op: "DELETE",
          path: "stepResource/4",
          value: { id: "4", type: "stepResource" }
        }
      ],
      expect.anything()
    );
  });
});
