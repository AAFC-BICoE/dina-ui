import { ColumnDefinition8, ListPageLayout } from "common-ui";
import Link from "next/link";
import { Head, Nav, groupCell8 } from "../../../components";
import { SeqdbMessage, useSeqdbIntl } from "../../../intl/seqdb-intl";
import { IndexSet } from "../../../types/seqdb-api";

const INDEX_SET_FILTER_ATTRIBUTES = [
  "name",
  "forwardadapter",
  "reverseadapter"
];

const INDEX_SET_TABLE_COLUMNS: ColumnDefinition8<IndexSet>[] = [
  {
    cell: ({
      row: {
        original: { id, name }
      }
    }) => (
      <Link href={`/seqdb/index-set/view?id=${id}`}>
        <a>{name}</a>
      </Link>
    ),
    header: "Name",
    accessorKey: "name"
  },
  groupCell8("group"),
  "forwardAdapter",
  "reverseAdapter"
];

export default function IndexSetListPage() {
  const { formatMessage } = useSeqdbIntl();

  return (
    <>
      <Head title={formatMessage("indexSetListTitle")} />
      <Nav />
      <main className="container-fluid">
        <h1 id="wb-cont">
          <SeqdbMessage id="indexSetListTitle" />
        </h1>
        <ListPageLayout
          filterAttributes={INDEX_SET_FILTER_ATTRIBUTES}
          id="index-set-list"
          queryTableProps={{
            columns: INDEX_SET_TABLE_COLUMNS,
            path: "seqdb-api/index-set"
          }}
        />
      </main>
    </>
  );
}
