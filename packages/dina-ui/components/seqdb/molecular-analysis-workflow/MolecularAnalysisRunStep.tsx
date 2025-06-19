import {
  SequencingRunItem,
  useGenericMolecularAnalysisRun
} from "./useGenericMolecularAnalysisRun";
import { DinaForm, LoadingSpinner } from "common-ui";
import { Alert } from "react-bootstrap";
import { ColumnDef } from "@tanstack/react-table";
import { DinaMessage } from "../../../intl/dina-ui-intl";
import { GenericMolecularAnalysis } from "packages/dina-ui/types/seqdb-api/resources/GenericMolecularAnalysis";
import { AttachmentsEditor } from "../../object-store/attachment-list/AttachmentsField";
import { AttachmentReadOnlySection } from "../../object-store/attachment-list/AttachmentReadOnlySection";
import { QualityControlSection } from "./QualityControlSection";
import { PersistedResource } from "kitsu";
import { useMolecularAnalysisRunColumns } from "../../molecular-analysis/useMolecularAnalysisRunColumns";
import SequencingRunContentSection from "./SequencingRunContentSection";
import { useMemo } from "react";

export interface MolecularAnalysisRunStepProps {
  molecularAnalysisId: string;
  molecularAnalysis: GenericMolecularAnalysis;
  editMode: boolean;
  setEditMode: (newValue: boolean) => void;
  performSave: boolean;
  setPerformSave: (newValue: boolean) => void;
  onSaved?: (
    nextStep: number,
    molecularAnalysisSaved?: PersistedResource<GenericMolecularAnalysis>
  ) => Promise<void>;
}

export function MolecularAnalysisRunStep({
  molecularAnalysisId,
  molecularAnalysis,
  editMode,
  setEditMode,
  performSave,
  setPerformSave,
  onSaved
}: MolecularAnalysisRunStepProps) {
  const {
    loading,
    errorMessage,
    multipleRunWarning,
    setSequencingRunName,
    sequencingRunName,
    sequencingRunItems,
    setSequencingRunItems,
    qualityControls,
    qualityControlTypes,
    createNewQualityControl,
    deleteQualityControl,
    updateQualityControl,
    attachments,
    setAttachments,
    sequencingRunId,
    setMolecularAnalysisRunItemNames
  } = useGenericMolecularAnalysisRun({
    editMode,
    setEditMode,
    performSave,
    setPerformSave,
    molecularAnalysis,
    molecularAnalysisId,
    onSaved
  });

  // Table columns to display for the sequencing run.
  const columns: ColumnDef<SequencingRunItem>[] = useMemo(
    () =>
      useMolecularAnalysisRunColumns({
        type: "generic-molecular-analysis-item",
        setMolecularAnalysisRunItemNames,
        readOnly: !editMode,
        setSequencingRunItems: setSequencingRunItems
      }),
    [setMolecularAnalysisRunItemNames, editMode]
  );

  // Display loading if network requests from hook are still loading in...
  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center">
        <LoadingSpinner loading={true} />
      </div>
    );
  }

  return (
    <>
      {/* Multiple Runs Exist Warning */}
      {multipleRunWarning && (
        <div className="row">
          <div className="col-12">
            <Alert variant="warning" className="mb-0">
              <Alert.Heading>
                <DinaMessage id="molecularAnalysisRunStep_multipleRunWarning_title" />
              </Alert.Heading>
              <p>
                <DinaMessage id="molecularAnalysisRunStep_multipleRunWarning_description" />
              </p>
            </Alert>
          </div>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="row">
          <div className="col-12">
            <Alert variant="danger" className="mb-2">
              {errorMessage}
            </Alert>
          </div>
        </div>
      )}

      {/* Run Information */}
      {editMode ||
      sequencingRunItems?.some((item) => item.molecularAnalysisRunItemId) ? (
        <div className="row mt-4">
          <div className="col-4 mb-3">
            <strong>
              <DinaMessage id="molecularAnalysisRunStep_sequencingRun" />
            </strong>
            {editMode ? (
              <input
                className="form-control mt-1"
                name="sequencingRunName"
                value={sequencingRunName}
                onChange={(newValue) =>
                  setSequencingRunName(newValue.target.value ?? "")
                }
              />
            ) : (
              <p>{sequencingRunName}</p>
            )}
          </div>
          <div className="col-12">
            <DinaForm initialValues={{}} readOnly={!editMode}>
              {/* Sequencing Run Content */}
              <SequencingRunContentSection
                columns={columns}
                sequencingRunItems={sequencingRunItems}
                editMode={editMode}
                setMolecularAnalysisRunItemNames={
                  setMolecularAnalysisRunItemNames
                }
              />

              {/* Sequencing Quality Control */}
              <QualityControlSection
                qualityControls={qualityControls}
                qualityControlTypes={qualityControlTypes}
                editMode={editMode}
                loading={loading}
                updateQualityControl={updateQualityControl}
                createNewQualityControl={createNewQualityControl}
                deleteQualityControl={deleteQualityControl}
              />

              {/* Attachments */}
              {editMode ? (
                <AttachmentsEditor
                  attachmentPath={``}
                  name="attachments"
                  onChange={setAttachments}
                  value={attachments}
                  title={
                    <DinaMessage id="molecularAnalysisRunStep_attachments" />
                  }
                />
              ) : (
                <>
                  {sequencingRunId && (
                    <AttachmentReadOnlySection
                      attachmentPath={`seqdb-api/molecular-analysis-run/${sequencingRunId}/attachments`}
                      title={
                        <DinaMessage id="molecularAnalysisRunStep_attachments" />
                      }
                    />
                  )}
                </>
              )}
            </DinaForm>
          </div>
        </div>
      ) : (
        <div className="row">
          <div className="col-12">
            <Alert variant="info" className="mb-0">
              <DinaMessage id="molecularAnalysisRunStep_noRunExists" />
            </Alert>
          </div>
        </div>
      )}
    </>
  );
}
