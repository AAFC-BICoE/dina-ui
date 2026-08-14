import React from "react";
import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import { DinaMessage } from "../../../intl/dina-ui-intl";
import { SeqdbMessage } from "../../../intl/seqdb-intl";
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
import { GenericMolecularAnalysisItem } from "@dina-ui/types/seqdb-api/resources/GenericMolecularAnalysisItem";

export function MaterialSampleWorkflows({
  workflows
}: {
  workflows: GenericMolecularAnalysisItem[] | undefined;
}) {
  const { vocabOptions, loading } = useVocabularyOptions({
    path: "seqdb-api/vocabulary/molecularAnalysisType"
  });

  const WORKFLOW_TABLE_COLUMNS: ColumnDef<any>[] = [
    {
      cell: ({
        row: {
          original: {
            genericMolecularAnalysis: { id, name }
          }
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
    {
      cell: ({
        row: {
          original: {
            genericMolecularAnalysis: { analysisType }
          }
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
    {
      cell: ({
        row: {
          original: {
            molecularAnalysisRunItem: { name }
          }
        }
      }) => <>{name}</>,
      accessorKey: "runItemName",
      header: () => (
        <DinaMessage id="field_run-summary_items.genericMolecularAnalysisItemSummary.name" />
      )
    },
    {
      cell: ({
        row: {
          original: { molecularAnalysisRunItem }
        }
      }) => {
        const attachments = molecularAnalysisRunItem?.result?.attachments;

        if (!attachments || attachments.length === 0) {
          return <></>;
        }

        return (
          <>
            {attachments.map((metadata: any, index: number) => (
              <>
                <ExternalLink
                  href={`/object-store/object/view?id=${metadata.id}`}
                >
                  {(metadata as any)?.filename ?? metadata.id}
                </ExternalLink>
                {index < attachments.length - 1 && ", "}
              </>
            ))}
          </>
        );
      },
      accessorKey: "attachments",
      header: () => <DinaMessage id="molecularAnalysisRunItemAttachments" />
    },
    groupCell("genericMolecularAnalysis.group"),
    {
      cell: ({
        row: {
          original: {
            genericMolecularAnalysis: { createdBy }
          }
        }
      }) => <ReadOnlyValue value={createdBy} />,
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
      <ReactTable<GenericMolecularAnalysisItem>
        columns={WORKFLOW_TABLE_COLUMNS as any}
        data={workflows || []}
      />
    </FieldSet>
  );
}
