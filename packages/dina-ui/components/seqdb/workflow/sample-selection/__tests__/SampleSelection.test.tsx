import { PersistedResource } from "kitsu";
import { mountWithAppContext } from "../../../../../test-util/mock-app-context";
import {
  Chain,
  ChainStepTemplate,
  ChainTemplate,
  MolecularSample,
  StepResource,
  StepTemplate
} from "../../../../../types/seqdb-api";
import { SampleSelection } from "../SampleSelection";

// Mock out the Link component, which normally fails when used outside of a Next app.
jest.mock("next/link", () => ({ children }) => <div>{children}</div>);

const TEST_SAMPLES = [
  { id: "1", type: "molecular-sample", name: "test sample 1" },
  { id: "2", type: "molecular-sample", name: "test sample 2" },
  { id: "3", type: "molecular-sample", name: "test sample 3" },
  { id: "4", type: "molecular-sample", name: "test sample 4" },
  { id: "5", type: "molecular-sample", name: "test sample 5" }
] as PersistedResource<MolecularSample>[];

const TEST_STEP_RESOURCES: PersistedResource<StepResource>[] = [
  {
    id: "1",
    molecularSample: TEST_SAMPLES[0]
  } as PersistedResource<StepResource>,
  {
    id: "2",
    molecularSample: TEST_SAMPLES[1]
  } as PersistedResource<StepResource>,
  {
    id: "3",
    molecularSample: TEST_SAMPLES[2]
  } as PersistedResource<StepResource>,
  {
    id: "4",
    molecularSample: TEST_SAMPLES[3]
  } as PersistedResource<StepResource>,
  {
    id: "5",
    molecularSample: TEST_SAMPLES[4]
  } as PersistedResource<StepResource>
];

const TEST_CHAIN_TEMPLATE: PersistedResource<ChainTemplate> = {
  id: "1",
  name: "WGS",
  type: "chain-template"
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
  stepTemplate: {
    id: "1",
    type: "step-template"
  } as PersistedResource<StepTemplate>,
  type: "chain-step-template"
};

const TEST_CHAIN_STEP_TEMPLATES = [TEST_CHAIN_STEP_TEMPLATE];

/** Mock Kitsu "get" method. */
const mockGet = jest.fn(async (model) => {
  if (model === "seqdb-api/molecular-sample") {
    return { data: TEST_SAMPLES };
  } else if (model === "seqdb-api/step-resource") {
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

describe("MolecularSample Selection UI", () => {
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
          path: "step-resource",
          value: {
            attributes: { value: "SAMPLE" },
            id: "00000000-0000-0000-0000-000000000000",
            relationships: {
              chain: { data: { id: "1", type: "chain" } },
              chainStepTemplate: {
                data: { id: "1", type: "chain-step-template" }
              },
              molecularSample: {
                data: {
                  id: "1",
                  name: "test sample 1",
                  type: "molecular-sample"
                }
              }
            },
            type: "step-resource"
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
      .find(".available-samples tbody input[type='checkbox']")
      .at(2)
      .prop<any>("onClick")({ target: { checked: true } } as any);
    wrapper.update();
    wrapper
      .find(".available-samples tbody input[type='checkbox']")
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
          path: "step-resource",
          value: {
            attributes: { value: "SAMPLE" },
            id: "00000000-0000-0000-0000-000000000000",
            relationships: {
              chain: { data: { id: "1", type: "chain" } },
              chainStepTemplate: {
                data: { id: "1", type: "chain-step-template" }
              },
              molecularSample: { data: { id: "3", type: "molecular-sample" } }
            },
            type: "step-resource"
          }
        },
        {
          op: "POST",
          path: "step-resource",
          value: {
            attributes: { value: "SAMPLE" },
            id: "00000000-0000-0000-0000-000000000000",
            relationships: {
              chain: { data: { id: "1", type: "chain" } },
              chainStepTemplate: {
                data: { id: "1", type: "chain-step-template" }
              },
              molecularSample: { data: { id: "4", type: "molecular-sample" } }
            },
            type: "step-resource"
          }
        },
        {
          op: "POST",
          path: "step-resource",
          value: {
            attributes: { value: "SAMPLE" },
            id: "00000000-0000-0000-0000-000000000000",
            relationships: {
              chain: { data: { id: "1", type: "chain" } },
              chainStepTemplate: {
                data: { id: "1", type: "chain-step-template" }
              },
              molecularSample: { data: { id: "5", type: "molecular-sample" } }
            },
            type: "step-resource"
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
          path: "step-resource/1",
          value: { id: "1", type: "step-resource" }
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
      .find(".selected-samples tbody input[type='checkbox']")
      .at(1)
      .prop<any>("onClick")({ target: { checked: true } } as any);
    wrapper.update();
    wrapper
      .find(".selected-samples tbody input[type='checkbox']")
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
          path: "step-resource/2",
          value: { id: "2", type: "step-resource" }
        },
        {
          op: "DELETE",
          path: "step-resource/3",
          value: { id: "3", type: "step-resource" }
        },
        {
          op: "DELETE",
          path: "step-resource/4",
          value: { id: "4", type: "step-resource" }
        }
      ],
      expect.anything()
    );
  });
});
