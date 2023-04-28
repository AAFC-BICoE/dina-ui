import {
  ButtonBar,
  ColumnDefinition,
  dateCell,
  FilterAttribute,
  ListPageLayout
} from "common-ui";
import Link from "next/link";
import { Footer, GroupSelectField, Head, Nav } from "../../../components";
import { SeqdbMessage, useSeqdbIntl } from "../../../intl/seqdb-intl";
import { SeqBatch } from "../../../types/seqdb-api";

const TABLE_COLUMNS: ColumnDefinition<SeqBatch>[] = [
  {
    Cell: ({ original: { id, name } }) => (
      <Link href={`/seqdb/sanger-workflow-sequencing/run?seqBatchId=${id}`}>
        {name || id}
      </Link>
    ),
    accessor: "name",
    Header: () => <SeqdbMessage id="seqBatchName" />
  },
  "group",
  "createdBy",
  dateCell("createdOn")
];

const FILTER_ATTRIBUTES: FilterAttribute[] = [
  "name",
  {
    name: "createdOn",
    type: "DATE"
  },
  "createdBy"
];

export default function SangerWorkflowSequencingListPage() {
  const { formatMessage } = useSeqdbIntl();

  const title = formatMessage("sangerWorkflowSequencingListTitle");

  return (
    <div>
      <Head title={title} />
      <Nav />
      <main className="container-fluid">
        <h1 id="wb-cont">
          <SeqdbMessage id="sangerWorkflowSequencingListTitle" />
        </h1>
        <ButtonBar>
          <Link href={`/seqdb/sanger-workflow-sequencing/run`}>
            <a className="btn btn-primary">
              <SeqdbMessage id="startNewWorkflow" />
            </a>
          </Link>
        </ButtonBar>
        <ListPageLayout
          additionalFilters={(filterForm) => ({
            // Apply group filter:
            ...(filterForm.group && { rsql: `group==${filterForm.group}` })
          })}
          filterAttributes={FILTER_ATTRIBUTES}
          id="sanger-workflow-sequencing-list"
          queryTableProps={{
            columns: TABLE_COLUMNS,
            path: "seqdb-api/seq-batch",
            filter: { isCompleted: false }
          }}
          filterFormchildren={({ submitForm }) => (
            <div className="mb-3">
              <div style={{ width: "300px" }}>
                <GroupSelectField
                  onChange={() => setImmediate(submitForm)}
                  name="group"
                  showAnyOption={true}
                />
              </div>
            </div>
          )}
        />
      </main>
      <Footer />
    </div>
  );
}
