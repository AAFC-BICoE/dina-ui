import Link from "next/link";
import Head from "../components/head";
import Nav from "../components/nav";
import { ColumnDefinition, QueryTable } from "../components/table/QueryTable";
import { PcrPrimer } from "../types/seqdb-api/resources/PcrPrimer";

const PCRPRIMER_TABLE_COLUMNS: Array<ColumnDefinition<PcrPrimer>> = [
  "group.groupName",
  "region.name",
  "type",
  { Header: "Name", Cell: ({ value }) => <div>{value}</div> },
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
        <Link href="/add-pcr-primer">
          <a>Add PCR Primer</a>
        </Link>
        <QueryTable<PcrPrimer>
          columns={PCRPRIMER_TABLE_COLUMNS}
          include="region"
          path="pcrPrimer"
        />
      </div>
    </div>
  );
}
