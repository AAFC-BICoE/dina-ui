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
import { ThermocyclerProfile } from "../../../types/seqdb-api/resources/ThermocyclerProfile";

const THEROMOCYCLERPROFILE_TABLE_COLUMNS: ColumnDefinition<ThermocyclerProfile>[] =
  [
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
    {
      cell: ({
        row: {
          original: { id, name }
        }
      }) => (
        <Link href={`/seqdb/thermocycler-profile/view?id=${id}`}>{name}</Link>
      ),
      accessorKey: "name"
    },
    "application",
    "step3",
    groupCell("group"),
    "createdBy",
    dateCell("createdOn")
  ];

const THERMOCYCLERPROFILE_FILTER_ATTRIBUTES = ["name", "application"];

export default function ThermocyclerProfileListPage() {
  const { formatMessage } = useSeqdbIntl();

  return (
    <>
      <Head title={formatMessage("thermocyclerProfileListTitle")} />
      <Nav marginBottom={false} />
      <ButtonBar>
        <div className="flex d-flex ms-auto">
          <CreateButton entityLink="/seqdb/thermocycler-profile" />
        </div>
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
      <Footer />
    </>
  );
}
