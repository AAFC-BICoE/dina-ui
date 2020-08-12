import { ColumnDefinition, ListPageLayout } from "common-ui";
import Link from "next/link";
import { ButtonBar, CreateButton, Head, Nav } from "../../components";
import { SeqdbMessage, useSeqdbIntl } from "../../intl/seqdb-intl";
import { PcrProfile } from "../../types/seqdb-api/resources/PcrProfile";

const PCRPROFILE_TABLE_COLUMNS: ColumnDefinition<PcrProfile>[] = [
  {
    Cell: ({ original: { region } }) =>
      region ? (
        <Link href={`/region/view?id=${region.id}`}>
          <a>{region.name}</a>
        </Link>
      ) : null,
    accessor: "region.name"
  },
  {
    Cell: ({ original: { id, name } }) => (
      <Link href={`/pcr-profile/view?id=${id}`}>
        <a>{name}</a>
      </Link>
    ),
    accessor: "name"
  },
  "application",
  "step3"
];

const PCRPROFILE_FILTER_ATTRIBUTES = ["name", "application"];

export default function PcrProfileListPage() {
  const { formatMessage } = useSeqdbIntl();

  return (
    <>
      <Head title={formatMessage("pcrProfileListTitle")} />
      <Nav />
      <ButtonBar>
        <CreateButton entityLink="pcr-profile" />
      </ButtonBar>
      <div className="container-fluid">
        <h1>
          <SeqdbMessage id="pcrProfileListTitle" />
        </h1>
        <ListPageLayout
          filterAttributes={PCRPROFILE_FILTER_ATTRIBUTES}
          id="pcr-profile-list"
          queryTableProps={{
            columns: PCRPROFILE_TABLE_COLUMNS,
            include: "region",
            path: "seqdb-api/thermocyclerprofile"
          }}
        />
      </div>
    </>
  );
}
