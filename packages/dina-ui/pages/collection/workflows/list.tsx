import {
  ButtonBar,
  ColumnDefinition,
  CreateButton,
  dateCell,
  FilterAttribute,
  ListPageLayout
} from "common-ui";
import Link from "next/link";
import { PreparationProcess } from "packages/dina-ui/types/collection-api/resources/PreparationProcess";
import { GroupSelectField, Head, Nav } from "../../../components";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";

const PREPARATION_PROCESS_FILTER_ATTRIBUTES: FilterAttribute[] = [
  "name",
  "createdBy",
  {
    name: "createdOn",
    type: "DATE"
  }
];

const PREPARATION_PROCESS_TABLE_COLUMNS: ColumnDefinition<PreparationProcess>[] = [
  {
    Cell: ({ original: { id, name } }) => (
      <Link href={`/collection/workflows/view?id=${id}`}>{name || id}</Link>
    ),
    accessor: "name"
  },
  "createdBy",
  dateCell("createdOn")
];

export default function PreparationProcessListPage() {
  const { formatMessage } = useDinaIntl();

  return (
    <div>
      <Head title={formatMessage("preparationProcessListTitle")} />
      <Nav />
      <main className="container-fluid">
        <h1>
          <DinaMessage id="preparationProcessListTitle" />
        </h1>
        <ButtonBar>
          <CreateButton entityLink="/collection/workflows" />
        </ButtonBar>
        <ListPageLayout
          additionalFilters={filterForm => ({
            // Apply group filter:
            ...(filterForm.group && { rsql: `group==${filterForm.group}` })
          })}
          filterAttributes={PREPARATION_PROCESS_FILTER_ATTRIBUTES}
          id="preparation-process-list"
          queryTableProps={{
            columns: PREPARATION_PROCESS_TABLE_COLUMNS,
            path: "collection-api/preparation-process"
          }}
          filterFormchildren={({ submitForm }) => (
            <div className="form-group">
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
