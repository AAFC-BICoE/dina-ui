import {
  ButtonBar,
  ColumnDefinition,
  CreateButton,
  ListPageLayout,
  dateCell
} from "common-ui";
import Link from "next/link";
import { Footer, Head, Nav, groupCell } from "../../../components";
import { SeqdbMessage, useSeqdbIntl } from "../../../intl/seqdb-intl";
import { SeqSubmission } from "../../../types/seqdb-api/resources/SeqSubmission";

const SEQ_SUBMISSION_TABLE_COLUMNS: ColumnDefinition<SeqSubmission>[] = [
  {
    cell: ({
      row: {
        original: { id, name }
      }
    }) => <Link href={`/seqdb/seq-submission/view?id=${id}`}>{name}</Link>,
    accessorKey: "name"
  },
  groupCell("group"),
  "createdBy",
  dateCell("createdOn")
];

const SEQ_SUBMISSION_FILTER_ATTRIBUTES = ["name", "group"];

export default function SeqSubmissionListPage() {
  const { formatMessage } = useSeqdbIntl();

  return (
    <>
      <Head title={formatMessage("seqSubmissionListTitle")} />
      <Nav marginBottom={false} />
      <ButtonBar>
        <div className="flex d-flex ms-auto">
          <CreateButton entityLink="/seqdb/seq-submission" />
        </div>
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
      <Footer />
    </>
  );
}
