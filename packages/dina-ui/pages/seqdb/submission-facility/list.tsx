import {
  ButtonBar,
  ColumnDefinition,
  CreateButton,
  ListPageLayout
} from "common-ui";
import Link from "next/link";
import { groupCell, Head, Nav } from "../../../components";
import { SeqdbMessage, useSeqdbIntl } from "../../../intl/seqdb-intl";
import { SubmissionFacility } from "../../../types/seqdb-api/resources/SubmissionFacility";

const SUBMISSION_FACILITY_TABLE_COLUMNS: ColumnDefinition<SubmissionFacility>[] =
  [
    {
      Cell: ({ original: { id, name } }) => (
        <Link href={`/seqdb/submission-facility/view?id=${id}`}>
          <a>{name || id}</a>
        </Link>
      ),
      accessor: "name"
    },
    groupCell("group")
  ];

const SUBMISSION_FACILITY_FILTER_ATTRIBUTES = ["name"];

export default function RegionListPage() {
  const { formatMessage } = useSeqdbIntl();

  return (
    <>
      <Head title={formatMessage("submissionFacilityListTitle")} />
      <Nav />
      <ButtonBar>
        <CreateButton entityLink="/seqdb/submission-facility" />
      </ButtonBar>
      <main className="container-fluid">
        <h1 id="wb-cont">
          <SeqdbMessage id="submissionFacilityListTitle" />
        </h1>
        <ListPageLayout
          filterAttributes={SUBMISSION_FACILITY_FILTER_ATTRIBUTES}
          id="submission-facility-list"
          queryTableProps={{
            columns: SUBMISSION_FACILITY_TABLE_COLUMNS,
            path: "seqdb-api/sequencing-facility"
          }}
        />
      </main>
    </>
  );
}
