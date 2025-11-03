import React from "react";
import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import { GenericMolecularAnalysis } from "packages/dina-ui/types/seqdb-api/resources/GenericMolecularAnalysis";
import { DinaMessage } from "../../../intl/dina-ui-intl";
import { SeqdbMessage } from "../../../intl/seqdb-intl";
import {
  dateCell,
  LoadingSpinner,
  ReactTable,
  ReadOnlyValue,
  FieldSet
} from "common-ui";
import { groupCell } from "../../../components";
import useVocabularyOptions from "packages/dina-ui/components/collection/useVocabularyOptions";
import { WORKFLOWS_COMPONENT_NAME } from "packages/dina-ui/types/collection-api/resources/form-legends/MaterialSampleForm";

export function MaterialSampleWorkflows({
  materialSampleQuery
}: {
  materialSampleQuery: any;
}) {
  const { vocabOptions, loading } = useVocabularyOptions({
    path: "seqdb-api/vocabulary/molecularAnalysisType"
  });

  const WORKFLOW_TABLE_COLUMNS: ColumnDef<GenericMolecularAnalysis>[] = [
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
    {
      cell: ({
        row: {
          original: { createdBy }
        }
      }) => <ReadOnlyValue value={createdBy} />,
      accessorKey: "createdBy",
      header: () => <DinaMessage id="field_createdBy" />
    },
    dateCell("createdOn")
  ];

  return (
    <FieldSet
      legend={<DinaMessage id="workflowsLegend" />}
      id={WORKFLOWS_COMPONENT_NAME}
      componentName={WORKFLOWS_COMPONENT_NAME}
    >
      <ReactTable<GenericMolecularAnalysis>
        columns={WORKFLOW_TABLE_COLUMNS}
        data={materialSampleQuery.response?.data.workflows || []}
      />
    </FieldSet>
  );
}
