import Link from "next/link";
import {
  ButtonBar,
  ColumnDefinition,
  Head,
  Nav,
  QueryTable
} from "../../components";
import { PcrProfile } from "../../types/seqdb-api/resources/PcrProfile";

const PCRPROFILE_TABLE_COLUMNS: Array<ColumnDefinition<PcrProfile>> = [
  {
    Header: "Group Name",
    accessor: "group.groupName"
  },
  {
    Cell: ({ original: { region } }) =>
      region ? (
        <Link href={`/region/view?id=${region.id}`}>
          <a>{region.name}</a>
        </Link>
      ) : null,
    Header: "Region Name",
    accessor: "region.name"
  },
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
        <Link href="/pcr-profile/edit" prefetch={true}>
          <button className="btn btn-primary">
            Create Thermocycler Profile
          </button>
        </Link>
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
