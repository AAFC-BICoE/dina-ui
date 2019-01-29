import Head from "../components/head";
import Nav from "../components/nav";
import { QueryTable } from "../components/table/QueryTable";
import { PcrPrimer } from "../types/seqdb-api/resources/PcrPrimer";

const PCRPRIMER_TABLE_COLUMNS = [
  "group.groupName",
  "region.name",
  "type",
  "name",
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
        <QueryTable<PcrPrimer[]>
          columns={PCRPRIMER_TABLE_COLUMNS}
          include="group,region"
          path="pcrPrimer"
        />
      </div>
    </div>
  );
}
