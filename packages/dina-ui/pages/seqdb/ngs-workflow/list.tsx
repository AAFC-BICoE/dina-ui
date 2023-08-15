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
import { LibraryPrepBatch } from "../../../types/seqdb-api";

const TABLE_COLUMNS: ColumnDefinition<LibraryPrepBatch>[] = [
  {
    id: "name",
    cell: ({
      row: {
        original: { id, name }
      }
    }) => (
      <Link href={`/seqdb/ngs-workflow/run?libraryPrepBatchId=${id}`}>
        {name || id}
      </Link>
    ),
    header: () => <SeqdbMessage id="name" />
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

export default function NgsWorkflowListPage() {
  const { formatMessage } = useSeqdbIntl();

  return (
    <div>
      <Head title={formatMessage("ngsWorkflowListTitle")} />
      <Nav />
      <main className="container-fluid">
        <h1 id="wb-cont">{formatMessage("ngsWorkflowListTitle")}</h1>
        <ButtonBar>
          <Link href={`/seqdb/ngs-workflow/run`}>
            <a className="btn btn-primary">
              <SeqdbMessage id="startNewWorkflow" />
            </a>
          </Link>
        </ButtonBar>
        <ListPageLayout
          additionalFilters={(filterForm) => ({
            isCompleted: false,
            // Apply group filter:
            ...(filterForm.group && { rsql: `group==${filterForm.group}` })
          })}
          filterAttributes={FILTER_ATTRIBUTES}
          id="pcr-workflow-list"
          queryTableProps={{
            columns: TABLE_COLUMNS,
            path: "seqdb-api/library-prep-batch",
            include: "protocol,containerType,thermocyclerProfile"
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
