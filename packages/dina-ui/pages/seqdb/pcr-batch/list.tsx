import {
  ButtonBar,
  ColumnDefinition8,
  CreateButton,
  dateCell8,
  FilterAttribute,
  ListPageLayout
} from "common-ui";
import Link from "next/link";
import { GroupSelectField, Head, Nav } from "../../../components";
import { useSeqdbIntl } from "../../../intl/seqdb-intl";
import { PcrBatch } from "../../../types/seqdb-api";

const TABLE_COLUMNS: ColumnDefinition8<PcrBatch>[] = [
  {
    cell: ({
      row: {
        original: { id, name }
      }
    }) => <Link href={`/seqdb/pcr-batch/view?id=${id}`}>{name || id}</Link>,
    accessorKey: "name"
  },
  "group",
  "primerForward.name",
  "primerReverse.name",
  "createdBy",
  dateCell8("createdOn")
];

const FILTER_ATTRIBUTES: FilterAttribute[] = [
  "name",
  "primerForward.name",
  "primerReverse.name",
  {
    name: "createdOn",
    type: "DATE"
  },
  "createdBy"
];

export default function PcrBatchListPage() {
  const { formatMessage } = useSeqdbIntl();

  return (
    <div>
      <Head title={formatMessage("pcrBatchListTitle")} />
      <Nav />
      <main className="container-fluid">
        <h1 id="wb-cont">{formatMessage("pcrBatchListTitle")}</h1>
        <ButtonBar>
          <CreateButton entityLink="/seqdb/pcr-batch" />
        </ButtonBar>
        <ListPageLayout
          additionalFilters={(filterForm) => ({
            // Apply group filter:
            ...(filterForm.group && { rsql: `group==${filterForm.group}` })
          })}
          filterAttributes={FILTER_ATTRIBUTES}
          id="pcr-batch-list"
          queryTableProps={{
            columns: TABLE_COLUMNS,
            path: "seqdb-api/pcr-batch",
            include: "primerForward,primerReverse"
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
