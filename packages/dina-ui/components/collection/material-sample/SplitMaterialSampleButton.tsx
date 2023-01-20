import { BULK_SPLIT_IDS } from "../../../pages/collection/material-sample/bulk-split";
import { DinaMessage } from "../../../../dina-ui/intl/dina-ui-intl";
import { useRouter } from "next/router";
import { writeStorage } from "@rehooks/local-storage";

interface SplitMaterialSampleButtonProps {
  ids: string[];
}

export function SplitMaterialSampleButton({
  ids
}: SplitMaterialSampleButtonProps) {
  const router = useRouter();

  async function onClick() {
    // Save the ids to local storage for the split page to read.
    writeStorage<string[]>(BULK_SPLIT_IDS, ids);

    await router.push("/collection/material-sample/bulk-split");
  }

  return (
    <button className="btn btn-primary" onClick={onClick}>
      <DinaMessage id="splitButton" />
    </button>
  );
}
