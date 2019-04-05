import Link from "next/link";
import { ColumnDefinition, Head, Nav, QueryTable } from "../../components";
import { PcrProfile } from "../../types/seqdb-api/resources/PcrProfile";

const PCRPROFILE_TABLE_COLUMNS: Array<ColumnDefinition<PcrProfile>> = [
  {
    Cell: ({ original: { id, name } }) => (
      <Link href={`/pcr-profile/view?id=${id}`}>
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
  "region.name",
  "application",
  "step3"
];

export default function PcrProfileListPage() {
  return (
    <div>
      <Head title="PCR Profiles" />
      <Nav />
      <div className="container-fluid">
        <h1>PCR Profiles</h1>
        <Link href="/pcr-profile/edit" prefetch={true}>
          <a>Add PCR Profile</a>
        </Link>
        <QueryTable<PcrProfile>
          columns={PCRPROFILE_TABLE_COLUMNS}
          include="group,region"
          path="thermocyclerprofile"
        />
      </div>
    </div>
  );
}
