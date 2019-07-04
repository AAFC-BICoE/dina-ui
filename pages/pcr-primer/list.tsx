import Link from "next/link";
import { ColumnDefinition, Head, ListPageLayout, Nav } from "../../components";
import { PcrPrimer } from "../../types/seqdb-api/resources/PcrPrimer";

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
  "region.name",
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
      <div className="container-fluid">
        <h1>PCR Primers</h1>
        <Link href="/pcr-primer/edit" prefetch={true}>
          <a>Add PCR Primer</a>
        </Link>
        <ListPageLayout
          filterAttributes={PCR_PRIMER_FILTER_ATTRIBUTES}
          queryTableProps={{
            columns: PCRPRIMER_TABLE_COLUMNS,
            include: "group,region",
            path: "pcrPrimer"
          }}
        />
      </div>
    </div>
  );
}
