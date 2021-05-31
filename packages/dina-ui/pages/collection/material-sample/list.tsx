import {
  ButtonBar,
  ColumnDefinition,
  CreateButton,
  dateCell,
  FilterAttribute,
  ListPageLayout,
  stringArrayCell
} from "common-ui";
import Link from "next/link";
import { GroupSelectField, Head, Nav } from "../../../components";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { MaterialSample } from "../../../types/collection-api";

const MATERIAL_SAMPLE_FILTER_ATTRIBUTES: FilterAttribute[] = [
  "createdBy",
  "dwcCatalogNumber",
  {
    name: "createdOn",
    type: "DATE"
  }
];

const MATERIAL_SAMPLE_TABLE_COLUMNS: ColumnDefinition<MaterialSample>[] = [
  {
    Cell: ({
      original: { id, materialSampleName, dwcOtherCatalogNumbers }
    }) => (
      <Link href={`/collection/material-sample/view?id=${id}`}>
        {materialSampleName || dwcOtherCatalogNumbers?.join?.(", ") || id}
      </Link>
    ),
    accessor: "materialSampleName"
  },
  "dwcCatalogNumber",
  stringArrayCell("dwcOtherCatalogNumbers"),
  "createdBy",
  dateCell("createdOn")
];

export default function MaterialSampleListPage() {
  const { formatMessage } = useDinaIntl();

  return (
    <div>
      <Head title={formatMessage("materialSampleListTitle")} />
      <Nav />
      <main className="container-fluid">
        <h1>
          <DinaMessage id="materialSampleListTitle" />
        </h1>
        <ButtonBar>
          <CreateButton entityLink="/collection/material-sample" />
        </ButtonBar>
        <ListPageLayout
          additionalFilters={filterForm => ({
            // Apply group filter:
            ...(filterForm.group && { rsql: `group==${filterForm.group}` })
          })}
          filterAttributes={MATERIAL_SAMPLE_FILTER_ATTRIBUTES}
          id="material-sample-list"
          queryTableProps={{
            columns: MATERIAL_SAMPLE_TABLE_COLUMNS,
            path: "collection-api/material-sample"
          }}
          filterFormchildren={({ submitForm }) => (
            <div className="mb-3">
              <div style={{ width: "300px" }}>
                <GroupSelectField
                  onChange={() => setImmediate(submitForm)}
                  name="group"
                  showAnyOption={true}
                />
              </div>
            </div>
          )}
        />
      </main>
    </div>
  );
}
