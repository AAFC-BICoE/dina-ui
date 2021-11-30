import { useRouter } from "next/router";
import { LoadingSpinner } from "common-ui";
import { useMaterialSampleQuery } from "../../../components/collection";
import { Head, MaterialSampleBulkEditor, Nav } from "../../../components";
import { useDinaIntl } from "../../../intl/dina-ui-intl";
import { compact } from "lodash";
import { Promisable } from "type-fest";
import { PersistedResource } from "kitsu";
import { MaterialSample } from "../../../types/collection-api";

export default function MaterialSampleBulkEditPage() {
  const router = useRouter();
  const ids = router.query.ids?.toString().split(",");

  const { formatMessage } = useDinaIntl();

  const title = "bulkEdit";

  async function moveToListPage() {
    await router.push(`/collection/material-sample/list`);
  }

  return (
    <div>
      <Head title={formatMessage(title)} />
      <Nav />
      <main className="container">
        <h1 id="wb-cont">{formatMessage(title)}</h1>
        {ids && (
          <ExistingMaterialSampleBulkEditor
            ids={ids}
            onSaved={moveToListPage}
          />
        )}
      </main>
    </div>
  );
}

export interface ExistingMaterialSampleBulkEditorProps {
  ids: string[];
  onSaved: (samples: PersistedResource<MaterialSample>[]) => Promisable<void>;
}

export function ExistingMaterialSampleBulkEditor({
  ids,
  onSaved
}: ExistingMaterialSampleBulkEditorProps) {
  const sampleQueries = ids.map(id => useMaterialSampleQuery(id));

  /** Whether any query is loading. */
  const isLoading = sampleQueries.reduce(
    (prev, current) => prev || current.loading,
    false
  );

  const errors = sampleQueries.map(query => query.error);

  if (isLoading) {
    return <LoadingSpinner loading={true} />;
  }

  if (errors.length) {
    return (
      <div>
        {errors.map((error, index) => (
          <div className="alert alert-danger" key={index}>
            {error?.errors?.map(e => e.detail).join("\n") ?? String(error)}
          </div>
        ))}
      </div>
    );
  }

  const samples = compact(sampleQueries.map(query => query.response?.data));

  if (samples.length) {
    return <MaterialSampleBulkEditor samples={samples} onSaved={onSaved} />;
  }

  return null;
}
