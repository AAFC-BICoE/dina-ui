import { DinaMessage } from "../../../../dina-ui/intl/dina-ui-intl";
import { useRouter } from "next/router";
import { writeStorage } from "@rehooks/local-storage";
import { BULK_SPLIT_IDS, Tooltip } from "common-ui/lib";

interface SplitMaterialSampleButtonProps {
  ids: string[];
  disabled: boolean;
}

export function SplitMaterialSampleButton({
  ids,
  disabled
}: SplitMaterialSampleButtonProps) {
  const router = useRouter();

  async function onClick() {
    // Save the ids to local storage for the split page to read.
    writeStorage<string[]>(BULK_SPLIT_IDS, ids);

    await router.push("/collection/material-sample/bulk-split");
  }

  return disabled ? (
    <Tooltip
      id="splitMaterialSampleNameRequiredTooltip"
      disableSpanMargin={true}
      visibleElement={
        <button className="btn btn-primary me-2" disabled={true}>
          <DinaMessage id="splitButton" />
        </button>
      }
    />
  ) : (
    <button className="btn btn-primary me-2" onClick={onClick}>
      <DinaMessage id="splitButton" />
    </button>
  );
}
