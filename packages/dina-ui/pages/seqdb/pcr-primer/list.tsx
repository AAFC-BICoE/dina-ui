import {
  ButtonBar,
  ColumnDefinition,
  CreateButton,
  ListPageLayout
} from "common-ui";
import Link from "next/link";
import { groupCell8, Head, Nav } from "../../../components";
import { SeqdbMessage, useSeqdbIntl } from "../../../intl/seqdb-intl";
import { PcrPrimer } from "../../../types/seqdb-api/resources/PcrPrimer";

const PCRPRIMER_TABLE_COLUMNS: ColumnDefinition<PcrPrimer>[] = [
  {
    cell: ({
      row: {
        original: { id, name }
      }
    }) => (
      <Link href={`/seqdb/pcr-primer/view?id=${id}`}>
        <a>{name}</a>
      </Link>
    ),
    accessorKey: "name"
  },
  groupCell8("group"),
  {
    cell: ({
      row: {
        original: { region }
      }
    }) =>
      region ? (
        <Link href={`/seqdb/region/view?id=${region.id}`}>
          <a>{region.name}</a>
        </Link>
      ) : null,
    accessorKey: "region.name"
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
  "region.name"
];

export default function PcrPrimerListPage() {
  const { formatMessage } = useSeqdbIntl();

  return (
    <div>
      <Head title={formatMessage("pcrPrimerListTitle")} />
      <Nav />
      <ButtonBar>
        <CreateButton entityLink="/seqdb/pcr-primer" />
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
    </div>
  );
}
