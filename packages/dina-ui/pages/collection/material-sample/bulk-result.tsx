import { useBulkGet, useQuery, withResponse } from "common-ui";
import { PersistedResource } from "kitsu";
import Link from "next/link";
import { useRouter } from "next/router";
import React from "react";
import { Nav } from "../../../components/button-bar/nav/nav";
import { Head } from "../../../components/head";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { MaterialSample } from "../../../types/collection-api";

export default function MaterialSampleBulkResult() {
  const { formatMessage } = useDinaIntl();
  const router = useRouter();

  const parentSampleId = router.query.parentSampleId?.toString?.();
  const ids = router.query.ids?.toString?.()?.split?.(",") ?? [];
  const actionType =
    router.query.actionType?.toString?.() === "edited" ? "edited" : "created";

  const parentSampleQuery = useQuery<MaterialSample>(
    {
      path: `collection-api/material-sample/${parentSampleId}`
    },
    { disabled: !parentSampleId }
  );

  const samplesQuery = useBulkGet<MaterialSample>({
    ids,
    listPath: "collection-api/material-sample"
  });

  return (
    <div>
      <Head title={formatMessage("bulkOperationCompleteTitle")} />
      <Nav />
      <main className="container ">
        <h1 id="wb-cont">{formatMessage("bulkOperationCompleteTitle")}</h1>
        <div>
          <h3>{formatMessage("results")}:</h3>
          {parentSampleId &&
            withResponse(parentSampleQuery, ({ data: parentSample }) => (
              <div>
                <div className="fw-bold">
                  {formatMessage("originalMaterialSampleLabel")}:
                </div>
                <div className="d-flex flex-row mx-3">
                  <Link
                    href={`/collection/material-sample/view?id=${parentSampleId}`}
                  >
                    <a target="_blank">{parentSample.materialSampleName}</a>
                  </Link>
                </div>
              </div>
            ))}
          {withResponse(
            {
              loading: samplesQuery.loading,
              response: { data: samplesQuery.data ?? [], meta: undefined }
            },
            ({ data: samples }) => (
              <div>
                <div className="fw-bold">
                  <DinaMessage
                    id="materialSamplesBulkFinishLabel"
                    values={{ actionType: formatMessage(actionType) }}
                  />
                  :
                </div>
                {(samples as PersistedResource<MaterialSample>[]).map(
                  sample => (
                    <div className="d-flex flex-row mx-3" key={sample.id}>
                      <Link
                        href={`/collection/material-sample/view?id=${sample.id}`}
                      >
                        <a target="_blank">{sample.materialSampleName}</a>
                      </Link>
                    </div>
                  )
                )}
              </div>
            )
          )}
        </div>
      </main>
    </div>
  );
}
