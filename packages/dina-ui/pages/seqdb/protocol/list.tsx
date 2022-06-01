import {
  ButtonBar,
  ColumnDefinition,
  CreateButton,
  ListPageLayout
} from "common-ui";
import Link from "next/link";
import { groupCell, Head, Nav } from "../../../components";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { Protocol } from "../../../types/seqdb-api/resources/Protocol";

const PROTOCOL_TABLE_COLUMNS: ColumnDefinition<Protocol>[] = [
  {
    Cell: ({ original: { id, name } }) => (
      <Link href={`/seqdb/protocol/view?id=${id}`}>
        <a>{name}</a>
      </Link>
    ),
    accessor: "name"
  },
  groupCell("group"),
  "type",
  "version",
  "description",
  "equipment",
  "kit.name"
];

const PROTOCOL_FILTER_ATTRIBUTES = [
  "name",
  "type",
  "version",
  "description",
  "equipment",
  "kit.name"
];

export default function ProtocolListPage() {
  const { formatMessage } = useDinaIntl();

  return (
    <>
      <Head title={formatMessage("protocolListTitle")} />
      <Nav />
      <ButtonBar>
        <CreateButton entityLink="/seqdb/protocol" />
      </ButtonBar>
      <main className="container-fluid">
        <h1 id="wb-cont">
          <DinaMessage id="protocolListTitle" />
        </h1>
        <ListPageLayout
          id="protocol-list"
          filterAttributes={PROTOCOL_FILTER_ATTRIBUTES}
          queryTableProps={{
            columns: PROTOCOL_TABLE_COLUMNS,
            include: "kit",
            path: "seqdb-api/protocol"
          }}
        />
      </main>
    </>
  );
}
