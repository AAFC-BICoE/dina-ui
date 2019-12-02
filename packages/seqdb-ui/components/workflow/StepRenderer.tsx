import { Chain, ChainStepTemplate } from "../../types/seqdb-api";
import { LibraryPoolingStep } from "./library-pooling/LibraryPoolingStep";
import { SubmissionStep } from "./library-pooling/submission/SubmissionStep";
import { LibraryPrepStep } from "./library-prep/LibraryPrepStep";
import { PreLibraryPrepStep } from "./pre-library-prep/PreLibraryPrepStep";
import { SampleSelection } from "./sample-selection/SampleSelection";

export interface StepRendererProps {
  chainStepTemplates: ChainStepTemplate[];
  chain: Chain;
  step: ChainStepTemplate;
}

export function StepRenderer(props: StepRendererProps) {
  switch (props.step.stepTemplate.outputs[0]) {
    case "SAMPLE":
      return <SampleSelection {...props} />;
    case "LIBRARY_PREP_BATCH":
      return <LibraryPrepStep {...props} />;
    case "SIZE_SELECTION":
    case "SHEARING":
      return <PreLibraryPrepStep {...props} />;
    case "LIBRARY_POOL":
      return <LibraryPoolingStep {...props} />;
    case "SEQ_SUBMISSION":
      return <SubmissionStep {...props} />;
    default:
      return null;
  }
}
