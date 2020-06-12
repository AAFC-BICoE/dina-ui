import { ColumnDefinition, ListPageLayout } from "common-ui";
import Link from "next/link";
import { ButtonBar, CreateButton, Head, Nav } from "../../components";
import { SeqdbMessage, useSeqdbIntl } from "../../intl/seqdb-intl";
import { PcrPrimer } from "../../types/seqdb-api/resources/PcrPrimer";

const PCRPRIMER_TABLE_COLUMNS: Array<ColumnDefinition<PcrPrimer>> = [
  {
    Cell: ({ original: { id, name } }) => (
      <Link href={`/pcr-primer/view?id=${id}`}>
        <a>{name}</a>
      </Link>
    ),
    accessor: "name"
  },
  "group.groupName",
  {
    Cell: ({ original: { region } }) =>
      region ? (
        <Link href={`/region/view?id=${region.id}`}>
          <a>{region.name}</a>
        </Link>
      ) : null,
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
  const { formatMessage } = useSeqdbIntl();

  return (
    <>
      <Head title={formatMessage("pcrPrimerListTitle")} />
      <Nav />
      <ButtonBar>
        <CreateButton entityLink="pcr-primer" />
      </ButtonBar>
      <div className="container-fluid">
        <h1>
          <SeqdbMessage id="pcrPrimerListTitle" />
        </h1>
        <ListPageLayout
          filterAttributes={PCR_PRIMER_FILTER_ATTRIBUTES}
          id="primer-list"
          queryTableProps={{
            columns: PCRPRIMER_TABLE_COLUMNS,
            include: "group,region",
            path: "pcrPrimer"
          }}
        />
      </div>
    </>
  );
}
