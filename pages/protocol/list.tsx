import Link from "next/link";
import {
  ButtonBar,
  ColumnDefinition,
  Head,
  ListPageLayout,
  Nav
} from "../../components";
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
  return (
    <>
      <Head title="Protocols" />
      <Nav />
      <ButtonBar>
        <Link href="/protocol/edit" prefetch={true}>
          <button className="btn btn-primary">Create Protocol</button>
        </Link>
      </ButtonBar>
      <div className="container-fluid">
        <h1>Protocols</h1>
        <ListPageLayout
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
