import {
  ButtonBar,
  ColumnDefinition,
  dateCell,
  FilterAttribute,
  ListPageLayout
} from "common-ui";
import Link from "next/link";
import {
  Footer,
  groupCell,
  GroupSelectField,
  Head,
  Nav
} from "../../../components";
import { SeqdbMessage, useSeqdbIntl } from "../../../intl/seqdb-intl";
import { LibraryPool } from "../../../types/seqdb-api";

const TABLE_COLUMNS: ColumnDefinition<LibraryPool>[] = [
  {
    cell: ({
      row: {
        original: { id, name }
      }
    }) => (
      <Link href={`/seqdb/ngs-workflow-pooling/run?id=${id}`} legacyBehavior>
        {name || id}
      </Link>
    ),
    accessorKey: "name",
    header: () => <SeqdbMessage id="libraryPoolingName" />
  },
  dateCell("dateUsed"),
  groupCell("group"),
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

export default function NgsWorkflowPoolingListPage() {
  const { formatMessage } = useSeqdbIntl();

  return (
    <div>
      <Head title={formatMessage("ngsWorkflowWholeGenomeSeqPoolingTitle")} />
      <Nav marginBottom={false} />
      <ButtonBar>
        <div className="flex d-flex">
          <Link
            href={`/seqdb/ngs-workflow-pooling/run`}
            className="btn btn-primary ms-auto"
          >
            <SeqdbMessage id="startNewWorkflow" />
          </Link>
        </div>
      </ButtonBar>
      <main className="container-fluid">
        <h1 id="wb-cont">
          {formatMessage("ngsWorkflowWholeGenomeSeqPoolingTitle")}
        </h1>
        <ListPageLayout
          additionalFilters={(filterForm) => ({
            // Apply group filter:
            ...(filterForm.group && { rsql: `group==${filterForm.group}` })
          })}
          filterAttributes={FILTER_ATTRIBUTES}
          id="ngs-workflow-pooling-list"
          queryTableProps={{
            columns: TABLE_COLUMNS,
            path: "seqdb-api/library-pool",
            include: ""
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
