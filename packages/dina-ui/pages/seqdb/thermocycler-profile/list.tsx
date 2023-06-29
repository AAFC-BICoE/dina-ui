import {
  ButtonBar,
  ColumnDefinition8,
  CreateButton,
  ListPageLayout
} from "common-ui";
import Link from "next/link";
import { groupCell8, Head, Nav } from "../../../components";
import { SeqdbMessage, useSeqdbIntl } from "../../../intl/seqdb-intl";
import { ThermocyclerProfile } from "../../../types/seqdb-api/resources/ThermocyclerProfile";

const THEROMOCYCLERPROFILE_TABLE_COLUMNS: ColumnDefinition8<ThermocyclerProfile>[] =
  [
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
    groupCell8("group"),
    {
      cell: ({
        row: {
          original: { id, name }
        }
      }) => (
        <Link href={`/seqdb/thermocycler-profile/view?id=${id}`}>
          <a>{name}</a>
        </Link>
      ),
      accessorKey: "name"
    },
    "application",
    "step3"
  ];

const THERMOCYCLERPROFILE_FILTER_ATTRIBUTES = ["name", "application"];

export default function ThermocyclerProfileListPage() {
  const { formatMessage } = useSeqdbIntl();

  return (
    <>
      <Head title={formatMessage("thermocyclerProfileListTitle")} />
      <Nav />
      <ButtonBar>
        <CreateButton entityLink="/seqdb/thermocycler-profile" />
      </ButtonBar>
      <main className="container-fluid">
        <h1 id="wb-cont">
          <SeqdbMessage id="thermocyclerProfileListTitle" />
        </h1>
        <ListPageLayout
          filterAttributes={THERMOCYCLERPROFILE_FILTER_ATTRIBUTES}
          id="thermocycler-profile-list"
          queryTableProps={{
            columns: THEROMOCYCLERPROFILE_TABLE_COLUMNS,
            include: "region",
            path: "seqdb-api/thermocycler-profile"
          }}
        />
      </main>
    </>
  );
}
