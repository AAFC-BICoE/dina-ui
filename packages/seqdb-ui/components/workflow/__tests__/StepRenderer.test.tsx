import { shallow } from "enzyme";
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

const TEST_CHAIN_TEMPLATE: ChainTemplate = {
  id: "1",
  name: "WGS Pooling",
  type: "chainTemplate"
};

const TEST_CHAIN: Chain = {
  chainTemplate: TEST_CHAIN_TEMPLATE,
  dateCreated: "2019-01-01",
  id: "1",
  name: "Mat's pooling chain",
  type: "chain"
};

const SAMPLES_STEP = {
  stepTemplate: { outputs: ["SAMPLE"] }
};
const LIBRARY_PREP_BATCH_STEP = {
  stepTemplate: { outputs: ["LIBRARY_PREP_BATCH"] }
};
const SIZE_SELECTION_STEP = {
  stepTemplate: { outputs: ["SIZE_SELECTION"] }
};
const LIBRARY_POOL_STEP = {
  stepTemplate: { outputs: ["LIBRARY_POOL"] }
};

function getWrapper(propsOverride: Partial<StepRendererProps> = {}) {
  return shallow(
    <StepRenderer
      chain={TEST_CHAIN}
      chainStepTemplates={[]}
      step={SAMPLES_STEP as ChainStepTemplate}
      {...propsOverride}
    />
  );
}

describe("StepRenderer component", () => {
  it("Renders the step based on the given stepTemplate", async () => {
    const sampleWrapper = getWrapper({
      step: SAMPLES_STEP as ChainStepTemplate
    });
    expect(sampleWrapper.find(SampleSelection).exists()).toEqual(true);

    const lpbWrapper = getWrapper({
      step: LIBRARY_PREP_BATCH_STEP as ChainStepTemplate
    });
    expect(lpbWrapper.find(LibraryPrepStep).exists()).toEqual(true);

    const ssWrapper = getWrapper({
      step: SIZE_SELECTION_STEP as ChainStepTemplate
    });
    expect(ssWrapper.find(PreLibraryPrepStep).exists()).toEqual(true);

    const lpWrapper = getWrapper({
      step: LIBRARY_POOL_STEP as ChainStepTemplate
    });
    expect(lpWrapper.find(LibraryPoolingStep).exists()).toEqual(true);
  });
});
