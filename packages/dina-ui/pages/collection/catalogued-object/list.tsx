import {
  ButtonBar,
  ColumnDefinition,
  CreateButton,
  dateCell,
  FilterAttribute,
  ListPageLayout
} from "common-ui";
import Link from "next/link";
import { GroupSelectField, Head, Nav } from "../../../components";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { MaterialSample } from "../../../types/collection-api";

const CATALOGUED_OBJECT_FILTER_ATTRIBUTES: FilterAttribute[] = [
  "dwcCatalogNumber",
  "createdBy",
  {
    name: "createdOn",
    type: "DATE"
  }
];

const CATALOGUED_OBJECT_TABLE_COLUMNS: ColumnDefinition<MaterialSample>[] = [
  {
    Cell: ({ original: { id, dwcCatalogNumber } }) => (
      <Link href={`/collection/catalogued-object/view?id=${id}`}>
        {dwcCatalogNumber || id}
      </Link>
    ),
    accessor: "dwcCatalogNumber"
  },
  "createdBy",
  dateCell("createdOn")
];

export default function CataloguedObjectListPage() {
  const { formatMessage } = useDinaIntl();

  return (
    <div>
      <Head title={formatMessage("cataloguedObjectListTitle")} />
      <Nav />
      <main className="container-fluid">
        <h1>
          <DinaMessage id="cataloguedObjectListTitle" />
        </h1>
        <ButtonBar>
          <CreateButton entityLink="/collection/catalogued-object" />
        </ButtonBar>
        <ListPageLayout
          additionalFilters={filterForm => ({
            // Apply group filter:
            ...(filterForm.group && { rsql: `group==${filterForm.group}` })
          })}
          filterAttributes={CATALOGUED_OBJECT_FILTER_ATTRIBUTES}
          id="material-sample-list"
          queryTableProps={{
            columns: CATALOGUED_OBJECT_TABLE_COLUMNS,
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
