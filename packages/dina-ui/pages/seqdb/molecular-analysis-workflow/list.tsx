import {
  ButtonBar,
  ColumnDefinition,
  dateCell,
  FilterAttribute,
  ListPageLayout,
  LoadingSpinner
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
import { DinaMessage, useDinaIntl } from "packages/dina-ui/intl/dina-ui-intl";
import useVocabularyOptions from "packages/dina-ui/components/collection/useVocabularyOptions";
import { useDeleteMolecularAnalysisWorkflows } from "packages/dina-ui/components/molecular-analysis/MolecularAnalysisUtils";

const FILTER_ATTRIBUTES: FilterAttribute[] = [
  "name",
  {
    name: "createdOn",
    type: "DATE"
  },
  "createdBy"
];

export default function MolecularAnalysisWorkflowListPage() {
  const { formatMessage } = useDinaIntl();

  const { vocabOptions, loading } = useVocabularyOptions({
    path: "seqdb-api/vocabulary/molecularAnalysisType"
  });

  const { handleDeleteMolecularAnalysisWorkflows, reloadResource } =
    useDeleteMolecularAnalysisWorkflows();

  const TABLE_COLUMNS: ColumnDefinition<GenericMolecularAnalysis>[] = [
    {
      cell: ({
        row: {
          original: { id, name }
        }
      }) => (
        <Link
          href={`/seqdb/molecular-analysis-workflow/run?genericMolecularAnalysisId=${id}`}
          legacyBehavior
        >
          {name || id}
        </Link>
      ),
      accessorKey: "name",
      header: () => <SeqdbMessage id="molecularAnalysisName" />
    },
    {
      cell: ({
        row: {
          original: { analysisType }
        }
      }) => (
        <>
          {loading ? (
            <LoadingSpinner loading={true} />
          ) : (
            <>
              {vocabOptions.find((option) => option.value === analysisType)
                ?.label ?? analysisType}
            </>
          )}
        </>
      ),
      accessorKey: "analysisType",
      header: () => <DinaMessage id="field_analysisType" />
    },
    groupCell("group"),
    "createdBy",
    dateCell("createdOn")
  ];

  return (
    <div>
      <Head title={formatMessage("molecularAnalysisWorkflowTitle")} />
      <Nav marginBottom={false} />
      <ButtonBar>
        <div className="flex d-flex">
          <Link
            href={`/seqdb/molecular-analysis-workflow/run`}
            className="btn btn-primary ms-auto"
          >
            <SeqdbMessage id="startNewWorkflow" />
          </Link>
        </div>
      </ButtonBar>
      <main className="container-fluid">
        <h1 id="wb-cont">{formatMessage("molecularAnalysisWorkflowTitle")}</h1>
        <ListPageLayout
          bulkDeleteButtonProps={{
            apiBaseUrl: "/seqdb",
            typeName: "molecular-analysis-workflow",
            onDelete: handleDeleteMolecularAnalysisWorkflows
          }}
          additionalFilters={(filterForm) => ({
            isCompleted: false,
            // Apply group filter:
            ...(filterForm.group && { rsql: `group==${filterForm.group}` })
          })}
          filterAttributes={FILTER_ATTRIBUTES}
          id="molecular-analysis-workflow-list"
          queryTableProps={{
            columns: TABLE_COLUMNS,
            path: "seqdb-api/generic-molecular-analysis",
            deps: [reloadResource]
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
