import {
  ButtonBar,
  ColumnDefinition,
  CreateButton,
  ListPageLayout
} from "common-ui";
import Link from "next/link";
import { Head, Nav } from "../../../components";
import { SeqdbMessage, useSeqdbIntl } from "../../../intl/seqdb-intl";
import { Protocol } from "../../../types/seqdb-api/resources/Protocol";

const PROTOCOL_TABLE_COLUMNS: ColumnDefinition<Protocol>[] = [
  {
    Cell: ({ original: { id, name } }) => (
      <Link href={`/protocol/view?id=${id}`}>
        <a>{name}</a>
      </Link>
    ),
    accessor: "name"
  },
  "group",
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
      <Head title={formatMessage("protocolListTitle")} />
      <Nav />
      <ButtonBar>
        <CreateButton entityLink="protocol" />
      </ButtonBar>
      <div className="container-fluid">
        <h1>
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
      </div>
    </>
  );
}
