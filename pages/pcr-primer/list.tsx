import Link from "next/link";
import { ColumnDefinition, Head,ButtonBar } from "../../components";
import { PcrPrimer } from "../../types/seqdb-api/resources/PcrPrimer";
import { Nav } from "../../components/nav/nav";
import { ListPageLayout } from "../../components/list-page-layout/ListPageLayout";

const PCRPRIMER_TABLE_COLUMNS: Array<ColumnDefinition<PcrPrimer>> = [
  {
    Cell: ({ original: { id, name } }) => (
      <Link href={`/pcr-primer/view?id=${id}`}>
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
    Cell: ({ original: { region } }) =>
      region ? (
        <Link href={`/region/view?id=${region.id}`}>
          <a>{region.name}</a>
        </Link>
      ) : null,
    Header: "Region Name",
    accessor: "region.name"
  },
  "type",
  "lotNumber",
  "application",
  "direction",
  "seq",
  "tmCalculated"
];

const PCR_PRIMER_FILTER_ATTRIBUTES = [
  "name",
  "targetSpecies",
  "application",
  "purification",
  "direction",
  "seq",
  "tmCalculated",
  "reference",
  "supplier",
  "region.name",
  "group.groupName"
];

export default function PcrPrimerListPage() {
  return (
    <div>
      <Head title="PCR Primers" />
      <Nav />
      <ButtonBar>
        <Link href="/pcr-primer/edit" prefetch={true}>
          <button className="btn btn-primary">Create PCR Primer</button>
        </Link>
      </ButtonBar>        
      <ListPageLayout
        filterAttributes={PCR_PRIMER_FILTER_ATTRIBUTES}
        queryTableProps={{
          columns: PCRPRIMER_TABLE_COLUMNS,
          include: "group,region",
          path: "pcrPrimer"
        }}
      />
    </div>
  )
}
