import Link from "next/link";
import { ColumnDefinition, Head, Nav, QueryTable, ButtonBar, CreateButton } from "../../components";
import { PcrProfile } from "../../types/seqdb-api/resources/PcrProfile";

const PCRPROFILE_TABLE_COLUMNS: Array<ColumnDefinition<PcrProfile>> = [
  {
    Header: "Group Name",
    accessor: "group.groupName"
  },
  "region.name",
  {
    Cell: ({ original: { id, name } }) => (
      <Link href={`/pcr-profile/view?id=${id}`}>
        <a>{name}</a>
      </Link>
    ),
    Header: "Name",
    accessor: "name"
  },
  "application",
  "step3"
];

export default function PcrProfileListPage() {
  return (
    <div>
      <Head title="PCR Profiles" />
      <Nav />
      <ButtonBar>
        <CreateButton entityLabel="Thermocycler Profile" entityLink="pcr-profile" />
      </ButtonBar>
      <div className="container-fluid">
        <h1>Thermocycler Profiles</h1>
        <QueryTable<PcrProfile>
          columns={PCRPROFILE_TABLE_COLUMNS}
          include="group,region"
          path="thermocyclerprofile"
        />
      </div>
    </div>
  );
}
