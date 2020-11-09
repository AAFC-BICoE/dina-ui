import { shallow } from "enzyme";
import { PersistedResource } from "kitsu";
import {
  Chain,
  ChainStepTemplate,
  ChainTemplate
} from "../../../types/seqdb-api";
import { LibraryPoolingStep } from "../library-pooling/LibraryPoolingStep";
import { LibraryPrepStep } from "../library-prep/LibraryPrepStep";
import { PreLibraryPrepStep } from "../pre-library-prep/PreLibraryPrepStep";
import { SampleSelection } from "../sample-selection/SampleSelection";
import { StepRenderer, StepRendererProps } from "../StepRenderer";

const TEST_CHAIN_TEMPLATE = {
  id: "1",
  name: "WGS Pooling",
  type: "chainTemplate"
} as PersistedResource<ChainTemplate>;

const TEST_CHAIN = {
  chainTemplate: TEST_CHAIN_TEMPLATE,
  createdOn: "2019-01-01",
  id: "1",
  name: "Mat's pooling chain",
  type: "chain"
} as PersistedResource<Chain>;

const SAMPLES_STEP = {
  stepTemplate: { outputs: ["SAMPLE"] }
} as PersistedResource<ChainStepTemplate>;

const LIBRARY_PREP_BATCH_STEP = {
  stepTemplate: { outputs: ["LIBRARY_PREP_BATCH"] }
} as PersistedResource<ChainStepTemplate>;

const SIZE_SELECTION_STEP = {
  stepTemplate: { outputs: ["SIZE_SELECTION"] }
} as PersistedResource<ChainStepTemplate>;

const LIBRARY_POOL_STEP = {
  stepTemplate: { outputs: ["LIBRARY_POOL"] }
} as PersistedResource<ChainStepTemplate>;

function getWrapper(propsOverride: Partial<StepRendererProps> = {}) {
  return shallow(
    <StepRenderer
      chain={TEST_CHAIN}
      chainStepTemplates={[]}
      step={SAMPLES_STEP}
      {...propsOverride}
    />
  );
}

describe("StepRenderer component", () => {
  it("Renders the step based on the given stepTemplate", async () => {
    const sampleWrapper = getWrapper({
      step: SAMPLES_STEP
    });
    expect(sampleWrapper.find(SampleSelection).exists()).toEqual(true);

    const lpbWrapper = getWrapper({
      step: LIBRARY_PREP_BATCH_STEP
    });
    expect(lpbWrapper.find(LibraryPrepStep).exists()).toEqual(true);

    const ssWrapper = getWrapper({
      step: SIZE_SELECTION_STEP
    });
    expect(ssWrapper.find(PreLibraryPrepStep).exists()).toEqual(true);

    const lpWrapper = getWrapper({
      step: LIBRARY_POOL_STEP
    });
    expect(lpWrapper.find(LibraryPoolingStep).exists()).toEqual(true);
  });
});
