import { BULK_EDIT_IDS_KEY, useBulkGet, withResponse } from "common-ui";
import { useLocalStorage } from "@rehooks/local-storage";
import { PersistedResource } from "kitsu";
import Link from "next/link";
import React from "react";
import { Footer, Nav } from "../../../components/button-bar/nav/nav";
import { Head } from "../../../components/head";
import { useDinaIntl } from "../../../intl/dina-ui-intl";
import { StorageUnit } from "../../../types/collection-api";

export default function StorageUnitBulkResult() {
  const { formatMessage } = useDinaIntl();

  const [ids] = useLocalStorage<string[]>(BULK_EDIT_IDS_KEY, []);

  const unitsQuery = useBulkGet<StorageUnit>({
    ids,
    listPath: "collection-api/storage-unit?include=storageUnitType"
  });

  return (
    <div>
      <Head title={formatMessage("bulkOperationCompleteTitle")} />
      <Nav />
      <main className="container-fluid">
        <h1 id="wb-cont">{formatMessage("bulkOperationCompleteTitle")}</h1>
        <div>
          <h3>{formatMessage("results")}:</h3>
          {withResponse(
            {
              loading: unitsQuery.loading,
              response: { data: unitsQuery.data ?? [], meta: undefined }
            },
            ({ data: units }) => (
              <div>
                {(units as PersistedResource<StorageUnit>[]).map((unit) => (
                  <div className="d-flex flex-row mx-3" key={unit.id}>
                    <Link href={`/collection/storage-unit/view?id=${unit.id}`}>
                      {unit["storageUnitType"]?.["name"] + " " + unit["name"]}
                    </Link>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
