import {
  ButtonBar,
  ColumnDefinition,
  CreateButton,
  ListPageLayout,
  dateCell
} from "common-ui";
import Link from "next/link";
import { Footer, Head, Nav, groupCell } from "../../../components";
import { SeqdbMessage, useSeqdbIntl } from "../../../intl/seqdb-intl";
import { IndexSet } from "../../../types/seqdb-api";

const INDEX_SET_FILTER_ATTRIBUTES = [
  "name",
  "forwardadapter",
  "reverseadapter"
];

const INDEX_SET_TABLE_COLUMNS: ColumnDefinition<IndexSet>[] = [
  {
    cell: ({
      row: {
        original: { id, name }
      }
    }) => <Link href={`/seqdb/index-set/view?id=${id}`}>{name}</Link>,
    header: "Name",
    accessorKey: "name"
  },
  "forwardAdapter",
  "reverseAdapter",
  groupCell("group"),
  "createdBy",
  dateCell("createdOn")
];

export default function IndexSetListPage() {
  const { formatMessage } = useSeqdbIntl();

  return (
    <>
      <Head title={formatMessage("indexSetListTitle")} />
      <Nav marginBottom={false} />
      <ButtonBar>
        <div className="flex d-flex ms-auto">
          <CreateButton entityLink="/seqdb/index-set" />
        </div>
      </ButtonBar>
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
      <Footer />
    </>
  );
}
