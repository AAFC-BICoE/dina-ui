import { PersistedResource } from "kitsu";
import { useRouter } from "next/router";
import { BULK_EDIT_IDS_KEY } from "common-ui";
import { useLocalStorage, writeStorage } from "@rehooks/local-storage";
import {
  ExistingMaterialSampleBulkEditor,
  Head,
  Nav
} from "../../../components";
import { useDinaIntl } from "../../../intl/dina-ui-intl";
import { MaterialSample } from "../../../types/collection-api";
import { useEffect } from "react";

/**
 * Key value where the bulk edit ids will be stored to display as the result.
 *
 * This constant is available to use for setting and retrieving the value.
 */
export const BULK_EDIT_RESULT_IDS_KEY = "bulkEditResultIds";

export default function MaterialSampleBulkEditPage() {
  const router = useRouter();
  const [ids] = useLocalStorage<string[]>(BULK_EDIT_IDS_KEY, []);

  useEffect(() => {
    localStorage.removeItem(BULK_EDIT_RESULT_IDS_KEY);
  }, ids);

  const { formatMessage } = useDinaIntl();

  const title = "bulkEdit";

  async function moveToResultPage(
    samples: PersistedResource<MaterialSample>[]
  ) {
    writeStorage(
      BULK_EDIT_RESULT_IDS_KEY,
      samples.map((it) => it.id)
    );
    await router.push({
      pathname: "/collection/material-sample/bulk-result",
      query: { actionType: "edited" }
    });
  }

  return (
    <div>
      <Head title={formatMessage(title)} />
      <Nav />
      <main className="container-fluid">
        <h1 id="wb-cont">{formatMessage(title)}</h1>
        {ids && (
          <ExistingMaterialSampleBulkEditor
            ids={ids ?? []}
            onSaved={moveToResultPage}
            onPreviousClick={() =>
              router.push("/collection/material-sample/list?reloadLastSearch")
            }
          />
        )}
      </main>
    </div>
  );
}
