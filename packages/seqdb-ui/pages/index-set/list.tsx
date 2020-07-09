import { ColumnDefinition, ListPageLayout } from "common-ui";
import Link from "next/link";
import { Head, Nav } from "../../components";
import { IndexSet } from "../../types/seqdb-api";

const INDEX_SET_FILTER_ATTRIBUTES = [
  "name",
  "forwardadapter",
  "reverseadapter"
];

const INDEX_SET_TABLE_COLUMNS: ColumnDefinition<IndexSet>[] = [
  {
    Cell: ({ original: { id, name } }) => (
      <Link href={`/index-set/view?id=${id}`}>
        <a>{name}</a>
      </Link>
    ),
    Header: "Name",
    accessor: "name"
  },
  "forwardAdapter",
  "reverseAdapter"
];

export default function IndexSetListPage() {
  return (
    <>
      <Head title="Index Sets" />
      <Nav />
      <div className="container-fluid">
        <h1>Index Sets</h1>
        <ListPageLayout
          filterAttributes={INDEX_SET_FILTER_ATTRIBUTES}
          id="index-set-list"
          queryTableProps={{
            columns: INDEX_SET_TABLE_COLUMNS,
            path: "indexSet"
          }}
        />
      </div>
    </>
  );
}
