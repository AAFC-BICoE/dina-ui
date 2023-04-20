import {
  ButtonBar,
  ColumnDefinition,
  CreateButton,
  ListPageLayout
} from "common-ui";
import Link from "next/link";
import { groupCell, Head, Nav } from "../../../components";
import { SeqdbMessage, useSeqdbIntl } from "../../../intl/seqdb-intl";
import { SeqSubmission } from "../../../types/seqdb-api/resources/SeqSubmission";

const SEQ_SUBMISSION_TABLE_COLUMNS: ColumnDefinition<SeqSubmission>[] = [
  {
    Cell: ({ original: { id, name } }) => (
      <Link href={`/seqdb/seq-submission/view?id=${id}`}>
        <a>{name}</a>
      </Link>
    ),
    accessor: "name"
  },
  groupCell("group")
];

const SEQ_SUBMISSION_FILTER_ATTRIBUTES = ["name", "group"];

export default function SeqSubmissionListPage() {
  const { formatMessage } = useSeqdbIntl();

  return (
    <>
      <Head title={formatMessage("seqSubmissionListTitle")} />
      <Nav />
      <ButtonBar>
        <CreateButton entityLink="/seqdb/seq-submission" />
      </ButtonBar>
      <main className="container-fluid">
        <h1 id="wb-cont">
          <SeqdbMessage id="seqSubmissionListTitle" />
        </h1>
        <ListPageLayout
          filterAttributes={SEQ_SUBMISSION_FILTER_ATTRIBUTES}
          id="seq-submission-list"
          queryTableProps={{
            columns: SEQ_SUBMISSION_TABLE_COLUMNS,
            path: "seqdb-api/seq-submission"
          }}
        />
      </main>
    </>
  );
}
