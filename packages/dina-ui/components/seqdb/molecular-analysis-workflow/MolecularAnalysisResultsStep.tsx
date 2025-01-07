import {
  SequencingRunItem,
  useGenericMolecularAnalysisRun
} from "./useGenericMolecularAnalysisRun";
import {
  DinaForm,
  FieldHeader,
  LoadingSpinner,
  ReactTable,
  useStringComparator
} from "common-ui";
import { Alert, Dropdown, DropdownButton } from "react-bootstrap";
import { ColumnDef } from "@tanstack/react-table";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { GenericMolecularAnalysis } from "packages/dina-ui/types/seqdb-api/resources/GenericMolecularAnalysis";
import { AttachmentsEditor } from "../../object-store/attachment-list/AttachmentsField";
import { AttachmentReadOnlySection } from "../../object-store/attachment-list/AttachmentReadOnlySection";
import { getMolecularAnalysisRunColumns } from "../../molecular-analysis/useMolecularAnalysisRun";
import { useIntl } from "react-intl";
import { QualityControlSection } from "./QualityControlSection";
import { useMemo, useState } from "react";

export interface MolecularAnalysisResultsStepProps {
  molecularAnalysisId: string;
  molecularAnalysis: GenericMolecularAnalysis;
  editMode: boolean;
  setEditMode: (newValue: boolean) => void;
  performSave: boolean;
  setPerformSave: (newValue: boolean) => void;
}

export function MolecularAnalysisResultsStep({
  molecularAnalysisId,
  molecularAnalysis,
  editMode,
  setEditMode,
  performSave,
  setPerformSave
}: MolecularAnalysisResultsStepProps) {
  const { compareByStringAndNumber } = useStringComparator();
  const { formatMessage } = useDinaIntl();
  const [performAttachRunItemResult, setPerformAttachRunItemResult] =
    useState<boolean>(false);

  const {
    loading,
    errorMessage,
    multipleRunWarning,
    setSequencingRunName,
    sequencingRunName,
    sequencingRunItems,
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
    molecularAnalysisId
  });

  // Table columns to display for the sequencing run.
  const COLUMNS: ColumnDef<SequencingRunItem>[] = useMemo(
    () =>
      getMolecularAnalysisRunColumns(
        compareByStringAndNumber,
        "generic-molecular-analysis-results",
        undefined,
        true,
        performAttachRunItemResult
      ),
    [editMode, performAttachRunItemResult]
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
          <div className="col-12 d-flex justify-content-end">
            <DropdownButton title={formatMessage("autoSelectButtonTitle")}>
              <Dropdown.Item
                onClick={() => {
                  setPerformAttachRunItemResult(true);
                }}
              >
                <DinaMessage id="attachmentsBasedOnItemNameButton" />
              </Dropdown.Item>
            </DropdownButton>
          </div>
          <div className="col-12 mt-3">
            <DinaForm initialValues={{}} readOnly={!editMode}>
              {/* Sequencing Run Content */}
              <div className="col-12 mb-3">
                <ReactTable<SequencingRunItem>
                  className="-striped mt-2"
                  columns={COLUMNS}
                  data={sequencingRunItems ?? []}
                  sort={[{ id: "wellCoordinates", desc: false }]}
                />
              </div>
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
