import {
  ButtonBar,
  ColumnDefinition,
  CreateButton,
  ListPageLayout
} from "common-ui";
import Link from "next/link";
import { groupCell, Head, Nav } from "../../../components";
import { SeqdbMessage, useSeqdbIntl } from "../../../intl/seqdb-intl";
import { ThermocyclerProfile } from "../../../types/seqdb-api/resources/ThermocyclerProfile";

const PCRPROFILE_TABLE_COLUMNS: ColumnDefinition<ThermocyclerProfile>[] = [
  {
    Cell: ({ original: { region } }) =>
      region ? (
        <Link href={`/seqdb/region/view?id=${region.id}`}>
          <a>{region.name}</a>
        </Link>
      ) : null,
    accessor: "region.name"
  },
  groupCell("group"),
  {
    Cell: ({ original: { id, name } }) => (
      <Link href={`/seqdb/thermocycler-profile/view?id=${id}`}>
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
        <CreateButton entityLink="/seqdb/thermocycler-profile" />
      </ButtonBar>
      <main className="container-fluid">
        <h1 id="wb-cont">
          <SeqdbMessage id="pcrProfileListTitle" />
        </h1>
        <ListPageLayout
          filterAttributes={PCRPROFILE_FILTER_ATTRIBUTES}
          id="thermocycler-profile-list"
          queryTableProps={{
            columns: PCRPROFILE_TABLE_COLUMNS,
            include: "region",
            path: "seqdb-api/thermocycler-profile"
          }}
        />
      </main>
    </>
  );
}
