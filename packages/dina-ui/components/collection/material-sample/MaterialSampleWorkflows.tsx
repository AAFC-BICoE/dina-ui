import React from "react";
import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import { DinaMessage } from "../../../intl/dina-ui-intl";
import {
  dateCell,
  LoadingSpinner,
  ReactTable,
  ReadOnlyValue,
  FieldSet,
  ExternalLink
} from "common-ui";
import { groupCell } from "../../../components";
import useVocabularyOptions from "../useVocabularyOptions";
import { WORKFLOWS_COMPONENT_NAME } from "../../../types/collection-api";
import { GenericMolecularAnalysis } from "@dina-ui/types/seqdb-api/resources/GenericMolecularAnalysis";
import _ from "lodash";

export function MaterialSampleWorkflows({
  workflows
}: {
  workflows: GenericMolecularAnalysis[] | undefined;
}) {
  const { vocabOptions, loading } = useVocabularyOptions({
    path: "seqdb-api/vocabulary/molecularAnalysisType"
  });

  const WORKFLOW_TABLE_COLUMNS: ColumnDef<any>[] = [
    {
      cell: ({ row }) => {
        const id = _.get(row.original, "genericMolecularAnalysis.id");
        const name = _.get(row.original, "genericMolecularAnalysis.name");
        return (
          <Link
            href={`/seqdb/molecular-analysis-workflow/run?genericMolecularAnalysisId=${id}`}
          >
            {name || id}
          </Link>
        );
      },
      accessorKey: "name",
      header: () => <DinaMessage id="molecularAnalysisName" />
    },
    {
      cell: ({ row }) => {
        const analysisType = _.get(
          row.original,
          "genericMolecularAnalysis.analysisType"
        );
        return (
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
        );
      },
      accessorKey: "analysisType",
      header: () => <DinaMessage id="field_analysisType" />
    },
    {
      cell: ({ row }) => {
        const name = _.get(row.original, "molecularAnalysisRunItem.name");
        return <>{name}</>;
      },
      accessorKey: "runItemName",
      header: () => (
        <DinaMessage id="field_run-summary_items.genericMolecularAnalysisItemSummary.name" />
      )
    },
    {
      cell: ({ row }) => {
        const attachments = _.get(
          row.original,
          "molecularAnalysisRunItem.result.attachments"
        );

        if (!attachments || attachments.length === 0) {
          return <></>;
        }

        return (
          <>
            {attachments.map((metadata: any, index: number) => (
              <span key={metadata?.id ?? index}>
                <ExternalLink href={`#`}>
                  {metadata?.filename ?? metadata?.id}
                </ExternalLink>
                {index < attachments.length - 1 && ", "}
              </span>
            ))}
          </>
        );
      },
      accessorKey: "attachments",
      header: () => <DinaMessage id="molecularAnalysisRunItemAttachments" />
    },
    groupCell("genericMolecularAnalysis.group"),
    {
      cell: ({ row }) => {
        const createdBy = _.get(
          row.original,
          "genericMolecularAnalysis.createdBy"
        );
        return <ReadOnlyValue value={createdBy} />;
      },
      accessorKey: "createdBy",
      header: () => <DinaMessage id="field_createdBy" />
    },
    dateCell("createdOn", "genericMolecularAnalysis.createdOn")
  ];

  return (
    <FieldSet
      legend={<DinaMessage id="workflowsLegend" />}
      id={WORKFLOWS_COMPONENT_NAME}
      componentName={WORKFLOWS_COMPONENT_NAME}
    >
      <ReactTable<GenericMolecularAnalysis>
        columns={WORKFLOW_TABLE_COLUMNS as any}
        data={workflows || []}
      />
    </FieldSet>
  );
}
