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
import { useSeqdbIntl } from "../../../intl/seqdb-intl";
import { LibraryPrepBatch } from "../../../types/seqdb-api";

const TABLE_COLUMNS: ColumnDefinition<LibraryPrepBatch>[] = [
  {
    cell: ({
      row: {
        original: { id, name }
      }
    }) => (
      <Link href={`/seqdb/library-prep-batch/view?id=${id}`}>{name || id}</Link>
    ),
    accessorKey: "name"
  },
  dateCell("dateUsed"),
  "group",
  "createdBy",
  dateCell("createdOn")
];

const FILTER_ATTRIBUTES: FilterAttribute[] = [
  "name",
  {
    name: "createdOn",
    type: "DATE"
  },
  "createdBy"
];

export default function LibraryPrepBatchListPage() {
  const { formatMessage } = useSeqdbIntl();

  return (
    <div>
      <Head title={formatMessage("libraryPrepBatchListTitle")} />
      <Nav />
      <main className="container-fluid">
        <h1 id="wb-cont">{formatMessage("libraryPrepBatchListTitle")}</h1>
        <ButtonBar>
          <CreateButton entityLink="/seqdb/library-prep-batch" />
        </ButtonBar>
        <ListPageLayout
          additionalFilters={(filterForm) => ({
            // Apply group filter:
            ...(filterForm.group && { rsql: `group==${filterForm.group}` })
          })}
          filterAttributes={FILTER_ATTRIBUTES}
          id="library-prep-batch-list"
          queryTableProps={{
            columns: TABLE_COLUMNS,
            path: "seqdb-api/library-prep-batch",
            include: ""
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
