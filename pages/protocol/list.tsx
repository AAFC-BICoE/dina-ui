import Link from "next/link";
import { ButtonBar, ColumnDefinition, Head, } from "../../components";
import { Nav } from "../../components/nav/nav";
import { Protocol, protocolTypeLabels } from "../../types/seqdb-api/resources/Protocol";
import { ListPageLayout } from "../../components/list-page-layout/ListPageLayout";

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
    <div>
      <Head title="Protocols" />
      <Nav />
      <ButtonBar>
        <Link href="/protocol/edit" prefetch={true}>
          <button className="btn btn-primary">Create Protocol</button>
        </Link>
      </ButtonBar>
        <ListPageLayout
          filterAttributes={PROTOCOL_FILTER_ATTRIBUTES}
          queryTableProps={{
            columns: PROTOCOL_TABLE_COLUMNS,
            include: "group,kit",
            path: "protocol"
          }}
        />
      
    </div>
  );
}
