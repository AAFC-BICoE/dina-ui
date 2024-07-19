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
import { SequencingFacility } from "../../../types/seqdb-api/resources/SequencingFacility";

const SUBMISSION_FACILITY_TABLE_COLUMNS: ColumnDefinition<SequencingFacility>[] =
  [
    {
      cell: ({
        row: {
          original: { id, name }
        }
      }) => (
        <Link href={`/seqdb/sequencing-facility/view?id=${id}`}>
          {name || id}
        </Link>
      ),
      accessorKey: "name"
    },
    groupCell("group"),
    "createdBy",
    dateCell("createdOn")
  ];

const SUBMISSION_FACILITY_FILTER_ATTRIBUTES = ["name"];

export default function RegionListPage() {
  const { formatMessage } = useSeqdbIntl();

  return (
    <>
      <Head title={formatMessage("sequencingFacilityListTitle")} />
      <Nav marginBottom={false} />
      <ButtonBar>
        <div className="flex d-flex ms-auto">
          <CreateButton entityLink="/seqdb/sequencing-facility" />
        </div>
      </ButtonBar>
      <main className="container-fluid">
        <h1 id="wb-cont">
          <SeqdbMessage id="sequencingFacilityListTitle" />
        </h1>
        <ListPageLayout
          filterAttributes={SUBMISSION_FACILITY_FILTER_ATTRIBUTES}
          id="sequencing-facility-list"
          queryTableProps={{
            columns: SUBMISSION_FACILITY_TABLE_COLUMNS,
            path: "seqdb-api/sequencing-facility"
          }}
        />
      </main>
      <Footer />
    </>
  );
}
