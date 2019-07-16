import Link from "next/link";
import { ColumnDefinition, Head, ButtonBar } from "../../components";
import { PcrProfile } from "../../types/seqdb-api/resources/PcrProfile";
import { Nav } from "../../components/nav/nav";
import { ListPageLayout } from "../../components/list-page-layout/ListPageLayout";

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

const PCRPROFILE_FILTER_ATTRIBUTES = ["name", "application"];

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
        <ListPageLayout
          filterAttributes={PCRPROFILE_FILTER_ATTRIBUTES}
          queryTableProps={{
            columns: PCRPROFILE_TABLE_COLUMNS,
            include: "group,region",
            path: "thermocyclerprofile"
          }}
        />
    </div>
  );
}
