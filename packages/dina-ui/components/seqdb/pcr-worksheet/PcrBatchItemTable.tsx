import { FieldSet, LoadingSpinner } from "../../../../common-ui/lib";
import { DinaMessage } from "../../../../dina-ui/intl/dina-ui-intl";
import {
  PcrReactionTable,
  usePcrReactionData
} from "../pcr-workflow/PcrReactionTable";

export function PcrBatchItemTable({ pcrBatchId }: { pcrBatchId: string }) {
  const { loading, pcrBatchItems, materialSamples } =
    usePcrReactionData(pcrBatchId);

  if (loading) {
    return <LoadingSpinner loading={true} />;
  }

  return (
    <FieldSet legend={<DinaMessage id="pcrReactionTitle" />}>
      <PcrReactionTable
        pcrBatchItems={pcrBatchItems}
        materialSamples={materialSamples}
        readOnlyOverride={true}
      />
    </FieldSet>
  );
}
