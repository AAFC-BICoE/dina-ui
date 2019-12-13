import { PersistedResource } from "kitsu";
import { Chain, ChainStepTemplate } from "../../types/seqdb-api";
import { PreLibraryPrepStep } from "./pre-library-prep/PreLibraryPrepStep";
import { SampleSelection } from "./sample-selection/SampleSelection";

export interface StepRendererProps {
  chainStepTemplates: Array<PersistedResource<ChainStepTemplate>>;
  chain: PersistedResource<Chain>;
  step: PersistedResource<ChainStepTemplate>;
}

export function StepRenderer(props: StepRendererProps) {
  switch (props.step.stepTemplate.outputs[0]) {
    case "SAMPLE":
      return <SampleSelection {...props} />;
    default:
      return <PreLibraryPrepStep {...props} />;
  }
}
