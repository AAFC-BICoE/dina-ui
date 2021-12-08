import { PersistedResource } from "kitsu";
import { useRouter } from "next/router";
import {
  ExistingMaterialSampleBulkEditor,
  Head,
  Nav
} from "../../../components";
import { useDinaIntl } from "../../../intl/dina-ui-intl";
import { MaterialSample } from "../../../types/collection-api";

export default function MaterialSampleBulkEditPage() {
  const router = useRouter();
  const ids = router.query.ids?.toString().split(",");

  const { formatMessage } = useDinaIntl();

  const title = "bulkEdit";

  async function moveToResultPage(
    samples: PersistedResource<MaterialSample>[]
  ) {
    const savedIds = samples.map(it => it.id).join(",");
    await router.push({
      pathname: "/collection/material-sample/bulk-result",
      query: { ids: savedIds, actionType: "edited" }
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
