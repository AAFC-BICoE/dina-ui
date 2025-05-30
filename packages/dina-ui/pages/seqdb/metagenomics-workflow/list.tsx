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
import { useDinaIntl } from "../../../intl/dina-ui-intl";
import { MetagenomicsBatch } from "../../../types/seqdb-api/resources/metagenomics/MetagenomicsBatch";

const TABLE_COLUMNS: ColumnDefinition<MetagenomicsBatch>[] = [
  {
    cell: ({
      row: {
        original: { id, name }
      }
    }) => (
      <Link
        href={`/seqdb/metagenomics-workflow/run?pcrBatchId=${id}`}
        legacyBehavior
      >
        {name || id}
      </Link>
    ),
    accessorKey: "name"
  },
  "primerForward.name",
  "primerReverse.name",
  groupCell("group"),
  "createdBy",
  dateCell("createdOn")
];

const FILTER_ATTRIBUTES: FilterAttribute[] = [
  "name",
  "primerForward.name",
  "primerReverse.name",
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
          <Link
            href={`/seqdb/metagenomics-workflow/run`}
            className="btn btn-primary ms-auto"
          >
            <SeqdbMessage id="startNewWorkflow" />
          </Link>
        </div>
      </ButtonBar>
      <main className="container-fluid">
        <h1 id="wb-cont">{formatMessage("metagenomicsWorkflowTitle")}</h1>
        <ListPageLayout
          additionalFilters={(filterForm) => ({
            // Apply group filter:
            ...(filterForm.group && { rsql: `group==${filterForm.group}` })
          })}
          filterAttributes={FILTER_ATTRIBUTES}
          id="metagenomics-workflow-list"
          queryTableProps={{
            columns: TABLE_COLUMNS,
            path: "seqdb-api/pcr-batch",
            include: "primerForward,primerReverse",
            filter: {
              batchType: "illumina_metagenomics"
            }
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
