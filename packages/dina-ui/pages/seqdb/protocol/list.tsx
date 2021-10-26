import {
  ButtonBar,
  ColumnDefinition,
  CreateButton,
  ListPageLayout
} from "common-ui";
import Link from "next/link";
import { groupCell, Head, Nav } from "../../../components";
import { SeqdbMessage, useSeqdbIntl } from "../../../intl/seqdb-intl";
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
  const { formatMessage } = useSeqdbIntl();

  return (
    <>
      <Head
        title={formatMessage("protocolListTitle")}
        lang={formatMessage("languageOfPage")}
        creator={formatMessage("agricultureCanada")}
        subject={formatMessage("subjectTermsForPage")}
      />
      <Nav />
      <ButtonBar>
        <CreateButton entityLink="/seqdb/protocol" />
      </ButtonBar>
      <main className="container-fluid">
        <h1 id="wb-cont">
          <SeqdbMessage id="protocolListTitle" />
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
