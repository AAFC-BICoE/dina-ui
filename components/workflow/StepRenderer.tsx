import { Chain, ChainStepTemplate } from "../../types/seqdb-api";
import { SampleSelection } from "../selection/SampleSelection";
import { PreLibraryPrepStep } from "./PreLibraryPrepStep";

export interface StepRendererProps {
  chainStepTemplates: ChainStepTemplate[];
  chain: Chain;
  step: ChainStepTemplate;
}

export function StepRenderer(props: StepRendererProps) {
  switch (props.step.stepTemplate.inputs[0]) {
    case "SAMPLE":
      return <SampleSelection {...props} />;
    default:
      return <PreLibraryPrepStep {...props} />;
  }
}
