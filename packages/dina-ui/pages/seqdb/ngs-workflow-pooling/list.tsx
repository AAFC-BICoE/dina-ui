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
import { LibraryPool2 } from "../../../types/seqdb-api";

const TABLE_COLUMNS: ColumnDefinition<LibraryPool2>[] = [
  {
    cell: ({
      row: {
        original: { id, name }
      }
    }) => (
      <Link href={`/seqdb/ngs-workflow-pooling/run?id=${id}`}>
        {name || id}
      </Link>
    ),
    accessorKey: "name",
    header: () => <SeqdbMessage id="libraryPoolingName" />
  },
  dateCell("dateUsed"),
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

export default function NgsWorkflowPoolingListPage() {
  const { formatMessage } = useSeqdbIntl();

  return (
    <div>
      <Head title={formatMessage("ngsWorkflowWholeGenomeSeqPoolingTitle")} />
      <Nav />
      <main className="container-fluid">
        <h1 id="wb-cont">
          {formatMessage("ngsWorkflowWholeGenomeSeqPoolingTitle")}
        </h1>
        <ButtonBar>
          <Link href={`/seqdb/ngs-workflow-pooling/run`}>
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
