import Link from "next/link";
import Head from "../components/head";
import Nav from "../components/nav";
import { ColumnDefinition, QueryTable } from "../components/table/QueryTable";
import { PcrPrimer } from "../types/seqdb-api/resources/PcrPrimer";

const PCRPRIMER_TABLE_COLUMNS: Array<ColumnDefinition<PcrPrimer>> = [
  {
    Cell: ({ original: { id, name } }) => (
      <Link href={`/pcr-primer?id=${id}`}>
        <a>{name}</a>
      </Link>
    ),
    Header: "Name",
    accessor: "name"
  },
  "group.groupName",
  "region.name",
  "type",
  "lotNumber",
  "application",
  "direction",
  "seq",
  "tmCalculated"
];

export default function PcrPrimerListPage() {
  return (
    <div>
      <Head title="PCR Primers" />
      <Nav />
      <div className="container-fluid">
        <h1>PCR Primers</h1>
        <Link href="/edit-pcr-primer">
          <a>Add PCR Primer</a>
        </Link>
        <QueryTable<PcrPrimer>
          columns={PCRPRIMER_TABLE_COLUMNS}
          include="group,region"
          path="pcrPrimer"
        />
      </div>
    </div>
  );
}
