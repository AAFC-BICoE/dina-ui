import { ColumnDefinition } from "common-ui";
import Link from "next/link";
import {
  ButtonBar,
  CreateButton,
  Head,
  ListPageLayout,
  Nav
} from "../../components";
import { SeqdbMessage, useSeqdbIntl } from "../../intl/seqdb-intl";
import {
  Protocol,
  protocolTypeLabels
} from "../../types/seqdb-api/resources/Protocol";

const PROTOCOL_TABLE_COLUMNS: Array<ColumnDefinition<Protocol>> = [
  {
    Cell: ({ original: { id, name } }) => (
      <Link href={`/protocol/view?id=${id}`}>
        <a>{name}</a>
      </Link>
    ),
    Header: "Name",
    accessor: "name"
  },
  {
    Header: "Group Name",
    accessor: "group.groupName"
  },
  {
    Header: "Type",
    accessor: row => protocolTypeLabels[row.type],
    id: "type"
  },
  "version",
  "description",
  "equipment",
  {
    Header: "Kit Group Name",
    accessor: "kit.group.groupname"
  },
  "kit.name"
];

const PROTOCOL_FILTER_ATTRIBUTES = [
  "name",
  "group.groupName",
  "type",
  "version",
  "description",
  "equipment",
  "kit.group.groupName",
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
            include: "group,kit",
            path: "protocol"
          }}
        />
      </div>
    </>
  );
}
