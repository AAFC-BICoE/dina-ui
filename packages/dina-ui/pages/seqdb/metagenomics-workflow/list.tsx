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
import { SeqdbMessage } from "../../../intl/seqdb-intl";
import { useDinaIntl } from "packages/dina-ui/intl/dina-ui-intl";
import { MetagenomicsBatch } from "packages/dina-ui/types/seqdb-api/resources/metagenomics/MetagenomicsBatch";

const TABLE_COLUMNS: ColumnDefinition<MetagenomicsBatch>[] = [
  {
    cell: ({
      row: {
        original: { id, name }
      }
    }) => (
      <Link href={`/seqdb/metagenomics-workflow/run?metagenomicsBatchId=${id}`}>
        {name || id}
      </Link>
    ),
    accessorKey: "name",
    header: () => <SeqdbMessage id="metagenomicsWorkflowName" />
  },
  "analysisType",
  groupCell("group"),
  "createdBy",
  dateCell("createdOn")
];

const FILTER_ATTRIBUTES: FilterAttribute[] = [
  "name",
  "analysisType",
  {
    name: "createdOn",
    type: "DATE"
  },
  "createdBy"
];

export default function MetagenomicsWorkflowListPage() {
  const { formatMessage } = useDinaIntl();

  return (
    <div>
      <Head title={formatMessage("metagenomicsWorkflowTitle")} />
      <Nav marginBottom={false} />
      <ButtonBar>
        <div className="flex d-flex">
          <Link href={`/seqdb/metagenomics-workflow/run`}>
            <a className="btn btn-primary ms-auto">
              <SeqdbMessage id="startNewWorkflow" />
            </a>
          </Link>
        </div>
      </ButtonBar>
      <main className="container-fluid">
        <h1 id="wb-cont">{formatMessage("metagenomicsWorkflowTitle")}</h1>
        <ListPageLayout
          additionalFilters={(filterForm) => ({
            isCompleted: false,
            // Apply group filter:
            ...(filterForm.group && { rsql: `group==${filterForm.group}` })
          })}
          filterAttributes={FILTER_ATTRIBUTES}
          id="metagenomics-workflow-list"
          queryTableProps={{
            columns: TABLE_COLUMNS,
            path: "seqdb-api/metagenomics-batch"
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
