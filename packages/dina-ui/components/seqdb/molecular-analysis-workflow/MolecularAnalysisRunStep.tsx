import Link from "next/link";
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
import { Alert, Button } from "react-bootstrap";
import { ColumnDef } from "@tanstack/react-table";
import { DinaMessage } from "../../../intl/dina-ui-intl";
import { GenericMolecularAnalysis } from "packages/dina-ui/types/seqdb-api/resources/GenericMolecularAnalysis";
import { AttachmentsEditor } from "../../object-store/attachment-list/AttachmentsField";
import { AttachmentReadOnlySection } from "../../object-store/attachment-list/AttachmentReadOnlySection";
import { getMolecularAnalysisRunColumns } from "../../molecular-analysis/useMolecularAnalysisRun";
import { FaTrash } from "react-icons/fa";
import { VocabularyOption } from "../../collection/VocabularySelectField";
import Select from "react-select";
import { useIntl } from "react-intl";

export interface MolecularAnalysisRunStepProps {
  molecularAnalysisId: string;
  molecularAnalysis: GenericMolecularAnalysis;
  editMode: boolean;
  setEditMode: (newValue: boolean) => void;
  performSave: boolean;
  setPerformSave: (newValue: boolean) => void;
}

export function MolecularAnalysisRunStep({
  molecularAnalysisId,
  molecularAnalysis,
  editMode,
  setEditMode,
  performSave,
  setPerformSave
}: MolecularAnalysisRunStepProps) {
  const { compareByStringAndNumber } = useStringComparator();
  const { formatMessage } = useIntl();

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
  const COLUMNS: ColumnDef<SequencingRunItem>[] =
    getMolecularAnalysisRunColumns(
      compareByStringAndNumber,
      "generic-molecular-analysis-item",
      setMolecularAnalysisRunItemNames,
      !editMode
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
          <div className="col-12 mt-3">
            <DinaForm initialValues={{}} readOnly={!editMode}>
              {/* Sequencing Run Content */}
              <div className="col-12">
                <strong>
                  <DinaMessage id="molecularAnalysisRunStep_sequencingRunContent" />
                </strong>
                <ReactTable<SequencingRunItem>
                  className="-striped mt-2"
                  columns={COLUMNS}
                  data={sequencingRunItems ?? []}
                  sort={[{ id: "wellCoordinates", desc: false }]}
                />
              </div>

              {/* Sequencing Quality Control */}
              {(editMode || qualityControls.length > 0) && (
                <div className="col-12 mt-3">
                  <div className="card p-3">
                    <div className="d-flex align-items-center justify-content-between mb-3">
                      <h2 className="fieldset-h2-adjustment">
                        <DinaMessage id="molecularAnalysisRunStep_sequencingQualityControl" />
                      </h2>
                      {editMode && (
                        <Button
                          onClick={() => createNewQualityControl()}
                          className="add-datablock"
                        >
                          <DinaMessage id="addCustomPlaceName" />
                        </Button>
                      )}
                    </div>
                    {qualityControls.map((qualityControl, index) => {
                      return (
                        <div className="card p-3 mb-3" key={index}>
                          <div className="row">
                            <div className="col-6">
                              <strong>Name:</strong>
                              {editMode ? (
                                <input
                                  className="form-control mt-1"
                                  name={`qualityControl-name-${index}`}
                                  data-testid={`qualityControl-name-${index}`}
                                  value={qualityControl.name}
                                  onChange={(newValue) =>
                                    updateQualityControl(index, {
                                      ...qualityControl,
                                      name: newValue?.target?.value ?? ""
                                    })
                                  }
                                />
                              ) : (
                                <p className="mb-0">{qualityControl.name}</p>
                              )}
                            </div>
                            <div className="col-5">
                              <strong>Type:</strong>
                              {editMode ? (
                                <Select<VocabularyOption>
                                  options={qualityControlTypes}
                                  value={qualityControlTypes.find(
                                    (option) =>
                                      option.value === qualityControl?.qcType
                                  )}
                                  isLoading={loading}
                                  placeholder={formatMessage({
                                    id: "queryBuilder_identifier_placeholder"
                                  })}
                                  onChange={(newValue) => {
                                    updateQualityControl(index, {
                                      ...qualityControl,
                                      qcType: newValue?.value ?? ""
                                    });
                                  }}
                                  controlShouldRenderValue={true}
                                  isClearable={false}
                                  className={"col ps-0 mt-1"}
                                  captureMenuScroll={true}
                                  menuShouldScrollIntoView={false}
                                  minMenuHeight={600}
                                />
                              ) : (
                                <p className="mb-0">
                                  {
                                    qualityControlTypes.find(
                                      (type) =>
                                        type.value === qualityControl.qcType
                                    )?.label
                                  }
                                </p>
                              )}
                            </div>
                            <div className="col-1">
                              {editMode && (
                                <Button
                                  onClick={() => deleteQualityControl(index)}
                                  variant="danger"
                                  className="delete-datablock w-100 mt-4"
                                  data-testid={`delete-quality-control-${index}`}
                                >
                                  <FaTrash />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

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
