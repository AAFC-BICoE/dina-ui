import { PCRBatchItemGrid } from "./PCRBatchItemGrid";

export interface PCRBatchPlatingStepProps {
    pcrBatchId: string;
  }

export function PCRBatchPlatingStep({
    pcrBatchId
}: PCRBatchPlatingStepProps) {
    return(
      <>
        <h2>PCR Batch Item Plating</h2>
        <br/>
          <PCRBatchItemGrid
            pcrBatchId = {pcrBatchId}
          />
      </> 
    );
}

