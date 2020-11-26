import { PersistedResource } from "kitsu";
import { mountWithAppContext } from "../../../../../test-util/mock-app-context";
import {
  Chain,
  ChainStepTemplate,
  ChainTemplate,
  Sample,
  StepResource,
  StepTemplate
} from "../../../../../types/seqdb-api";
import { SampleSelection } from "../SampleSelection";

// Mock out the Link component, which normally fails when used outside of a Next app.
jest.mock("next/link", () => ({ children }) => <div>{children}</div>);

const TEST_SAMPLES = [
  { id: "1", type: "sample", name: "test sample 1" },
  { id: "2", type: "sample", name: "test sample 2" },
  { id: "3", type: "sample", name: "test sample 3" },
  { id: "4", type: "sample", name: "test sample 4" },
  { id: "5", type: "sample", name: "test sample 5" }
] as PersistedResource<Sample>[];

const TEST_STEP_RESOURCES: PersistedResource<StepResource>[] = [
  { id: "1", sample: TEST_SAMPLES[0] } as PersistedResource<StepResource>,
  { id: "2", sample: TEST_SAMPLES[1] } as PersistedResource<StepResource>,
  { id: "3", sample: TEST_SAMPLES[2] } as PersistedResource<StepResource>,
  { id: "4", sample: TEST_SAMPLES[3] } as PersistedResource<StepResource>,
  { id: "5", sample: TEST_SAMPLES[4] } as PersistedResource<StepResource>
];

const TEST_CHAIN_TEMPLATE: PersistedResource<ChainTemplate> = {
  id: "1",
  name: "WGS",
  type: "chainTemplate"
};

const TEST_CHAIN: PersistedResource<Chain> = {
  chainTemplate: TEST_CHAIN_TEMPLATE,
  createdOn: "2019-01-01",
  id: "1",
  name: "Mat's chain",
  type: "chain"
};

const TEST_CHAIN_STEP_TEMPLATE: PersistedResource<ChainStepTemplate> = {
  chainTemplate: TEST_CHAIN_TEMPLATE,
  id: "1",
  stepNumber: 1,
  stepTemplate: { id: "1", type: "stepTemplate" } as PersistedResource<
    StepTemplate
  >,
  type: "chainStepTemplate"
};

const TEST_CHAIN_STEP_TEMPLATES = [TEST_CHAIN_STEP_TEMPLATE];

/** Mock Kitsu "get" method. */
const mockGet = jest.fn(async model => {
  if (model === "seqdb-api/sample") {
    return { data: TEST_SAMPLES };
  } else if (model === "seqdb-api/stepResource") {
    return { data: TEST_STEP_RESOURCES };
  } else {
    return { data: [] };
  }
});

/** Mock axios for operations requests. */
const mockPatch = jest.fn(async () => ({ data: [] }));
const apiContext: any = {
  apiClient: { get: mockGet, axios: { patch: mockPatch } }
};

function getWrapper() {
  return mountWithAppContext(
    <SampleSelection
      chain={TEST_CHAIN}
      chainStepTemplates={TEST_CHAIN_STEP_TEMPLATES}
      step={TEST_CHAIN_STEP_TEMPLATE}
    />,
    { apiContext }
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

    wrapper.find(".single-select-button").at(0).simulate("click");

    await new Promise(setImmediate);
    wrapper.update();

    expect(mockPatch).lastCalledWith(
      "/seqdb-api/operations",
      [
        {
          op: "POST",
          path: "stepResource",
          value: {
            attributes: { value: "SAMPLE" },
            id: "-100",
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

    // The checkbox should be cleared.
    expect(wrapper.find("input[type='checkbox'][value=true]").length).toEqual(
      0
    );
  });

  it("Lets you select multiple samples using checkboxes.", async () => {
    const wrapper = getWrapper();

    // Await available samples query.
    await new Promise(setImmediate);
    wrapper.update();

    // Select samples 3 to 5.
    wrapper
      .find(".available-samples .rt-tbody input[type='checkbox']")
      .at(2)
      .prop<any>("onClick")({ target: { checked: true } } as any);
    wrapper.update();
    wrapper
      .find(".available-samples .rt-tbody input[type='checkbox']")
      .at(4)
      .prop<any>("onClick")({
      shiftKey: true,
      target: { checked: true }
    } as any);
    wrapper.update();

    wrapper.find("button.select-all-checked-button").simulate("click");

    // Await the patch request.
    await new Promise(setImmediate);
    wrapper.update();

    expect(mockPatch).lastCalledWith(
      "/seqdb-api/operations",
      [
        {
          op: "POST",
          path: "stepResource",
          value: {
            attributes: { value: "SAMPLE" },
            id: "-100",
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
            attributes: { value: "SAMPLE" },
            id: "-101",
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
            attributes: { value: "SAMPLE" },
            id: "-102",
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

    wrapper.find(".single-deselect-button").at(0).simulate("click");

    await new Promise(setImmediate);
    wrapper.update();

    expect(mockPatch).lastCalledWith(
      "/seqdb-api/operations",
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
      .find(".selected-samples .rt-tbody input[type='checkbox']")
      .at(1)
      .prop<any>("onClick")({ target: { checked: true } } as any);
    wrapper.update();
    wrapper
      .find(".selected-samples .rt-tbody input[type='checkbox']")
      .at(3)
      .prop<any>("onClick")({
      shiftKey: true,
      target: { checked: true }
    } as any);
    wrapper.update();

    wrapper.find("button.deselect-all-checked-button").simulate("click");

    // Await available samples and selected samples queries.
    await new Promise(setImmediate);
    wrapper.update();

    expect(mockPatch).lastCalledWith(
      "/seqdb-api/operations",
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
