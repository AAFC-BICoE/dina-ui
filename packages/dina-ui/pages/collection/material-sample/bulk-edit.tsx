import { PersistedResource } from "kitsu";
import { useRouter } from "next/router";
import { BULK_EDIT_IDS_KEY } from "common-ui/lib";
import { useLocalStorage, setArray } from "common-ui/lib/util/localStorageUtil";
import {
  ExistingMaterialSampleBulkEditor,
  Head,
  Nav
} from "../../../components";
import { useDinaIntl } from "../../../intl/dina-ui-intl";
import { MaterialSample } from "../../../types/collection-api";

/**
 * Key value where the bulk edit ids will be stored to display as the result.
 *
 * This constant is available to use for setting and retrieving the value.
 */
export const BULK_EDIT_RESULT_IDS_KEY = "bulkEditResultIds";

export default function MaterialSampleBulkEditPage() {
  const router = useRouter();
  const ids = useLocalStorage({
    key: BULK_EDIT_IDS_KEY,
    defaultValue: [],
    removeAfterRetrieval: true
  });

  const { formatMessage } = useDinaIntl();

  const title = "bulkEdit";

  async function moveToResultPage(
    samples: PersistedResource<MaterialSample>[]
  ) {
    setArray(
      BULK_EDIT_RESULT_IDS_KEY,
      samples.map(it => it.id)
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
            ids={ids}
            onSaved={moveToResultPage}
            onPreviousClick={() =>
              router.push("/collection/material-sample/list")
            }
          />
        )}
      </main>
    </div>
  );
}
