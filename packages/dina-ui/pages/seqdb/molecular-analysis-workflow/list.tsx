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
import { GenericMolecularAnalysis } from "packages/dina-ui/types/seqdb-api/resources/GenericMolecularAnalysis";
import { useDinaIntl } from "packages/dina-ui/intl/dina-ui-intl";

const TABLE_COLUMNS: ColumnDefinition<GenericMolecularAnalysis>[] = [
  {
    cell: ({
      row: {
        original: { id, name }
      }
    }) => (
      <Link
        href={`/seqdb/molecular-analysis-workflow/run?genericMolecularAnalysisId=${id}`}
      >
        {name || id}
      </Link>
    ),
    accessorKey: "name",
    header: () => <SeqdbMessage id="molecularAnalysisName" />
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

export default function MolecularAnalysisWorkflowListPage() {
  const { formatMessage } = useDinaIntl();

  return (
    <div>
      <Head title={formatMessage("molecularAnalysisWorkflowTitle")} />
      <Nav marginBottom={false} />
      <ButtonBar>
        <div className="flex d-flex">
          <Link href={`/seqdb/molecular-analysis-workflow/run`}>
            <a className="btn btn-primary ms-auto">
              <SeqdbMessage id="startNewWorkflow" />
            </a>
          </Link>
        </div>
      </ButtonBar>
      <main className="container-fluid">
        <h1 id="wb-cont">{formatMessage("molecularAnalysisWorkflowTitle")}</h1>
        <ListPageLayout
          additionalFilters={(filterForm) => ({
            isCompleted: false,
            // Apply group filter:
            ...(filterForm.group && { rsql: `group==${filterForm.group}` })
          })}
          filterAttributes={FILTER_ATTRIBUTES}
          id="molecular-analysis-workflow-list"
          queryTableProps={{
            columns: TABLE_COLUMNS,
            path: "seqdb-api/generic-molecular-analysis"
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
