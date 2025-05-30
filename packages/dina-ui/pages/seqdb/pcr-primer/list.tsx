import {
  ButtonBar,
  ColumnDefinition,
  CreateButton,
  ListPageLayout,
  dateCell
} from "common-ui";
import Link from "next/link";
import { Footer, groupCell, Head, Nav } from "../../../components";
import { SeqdbMessage, useSeqdbIntl } from "../../../intl/seqdb-intl";
import { PcrPrimer } from "../../../types/seqdb-api/resources/PcrPrimer";

const PCRPRIMER_TABLE_COLUMNS: ColumnDefinition<PcrPrimer>[] = [
  {
    cell: ({
      row: {
        original: { id, name }
      }
    }) => <Link href={`/seqdb/pcr-primer/view?id=${id}`}>{name}</Link>,
    accessorKey: "name"
  },
  {
    cell: ({
      row: {
        original: { region }
      }
    }) =>
      region ? (
        <Link href={`/seqdb/region/view?id=${region.id}`}>{region.name}</Link>
      ) : null,
    accessorKey: "region.name"
  },
  "type",
  "lotNumber",
  "application",
  "direction",
  "seq",
  "tmCalculated",
  groupCell("group"),
  "createdBy",
  dateCell("createdOn")
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
  "region.name"
];

export default function PcrPrimerListPage() {
  const { formatMessage } = useSeqdbIntl();

  return (
    <div>
      <Head title={formatMessage("pcrPrimerListTitle")} />
      <Nav marginBottom={false} />
      <ButtonBar>
        <div className="flex d-flex ms-auto">
          <CreateButton entityLink="/seqdb/pcr-primer" />
        </div>
      </ButtonBar>
      <main className="container-fluid">
        <h1 id="wb-cont">
          <SeqdbMessage id="pcrPrimerListTitle" />
        </h1>
        <ListPageLayout
          filterAttributes={PCR_PRIMER_FILTER_ATTRIBUTES}
          id="primer-list"
          queryTableProps={{
            columns: PCRPRIMER_TABLE_COLUMNS,
            include: "region",
            path: "seqdb-api/pcr-primer"
          }}
        />
      </main>
      <Footer />
    </div>
  );
}
