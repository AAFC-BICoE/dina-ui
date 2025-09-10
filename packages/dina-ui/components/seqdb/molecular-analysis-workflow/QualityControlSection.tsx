import { DinaMessage } from "../../../intl/dina-ui-intl";
import { VocabularyOption } from "../../collection/VocabularySelectField";
import { Button } from "react-bootstrap";
import { FaTrash } from "react-icons/fa";
import { useIntl } from "react-intl";
import Select from "react-select";
import DataPasteZone from "../../molecular-analysis/DataPasteZone";
import { CollapsibleSection } from "../../../../common-ui/lib";
import { AddAttachmentsButton, AttachmentsEditor } from "../../object-store";
import { QualityControlWithAttachment } from "./useGenericMolecularAnalysisRun";
import React from "react";

interface QualityControlSectionProps {
  editMode?: boolean;
  qualityControls: QualityControlWithAttachment[];
  qualityControlTypes: VocabularyOption[];
  createNewQualityControl?: (name?: string, qcType?: string) => void;
  updateQualityControl?: (
    index: number,
    newQualityControl: QualityControlWithAttachment
  ) => void;
  deleteQualityControl?: (index: number) => void;
  loading?: boolean;
}

export function QualityControlSection({
  editMode,
  qualityControls,
  qualityControlTypes,
  loading,
  createNewQualityControl,
  updateQualityControl,
  deleteQualityControl
}: QualityControlSectionProps) {
  const { formatMessage } = useIntl();

  const onDataPaste = (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const clipboardData = event.clipboardData.getData("text/plain");
    const rows = clipboardData
      .trim()
      .split("\n")
      .map((row) =>
        row.split("\t").map((cell) => cell.replace(/\r/g, "").trim())
      );
    rows.forEach((row) => {
      createNewQualityControl?.(
        row.at(0),
        row.at(1)?.replaceAll(" ", "_")?.toLowerCase()
      );
    });
  };

  return editMode || qualityControls.length > 0 ? (
    <div className="col-12 mt-3 mb-3">
      <div className="card p-3">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h2 className="fieldset-h2-adjustment">
            <DinaMessage id="molecularAnalysisRunStep_sequencingQualityControl" />
          </h2>
          {editMode && (
            <Button
              onClick={() => createNewQualityControl?.()}
              className="add-datablock"
            >
              <DinaMessage id="addButtonText" />
            </Button>
          )}
        </div>
        {qualityControls.map((qualityControl, index) => {
          return (
            <div className="card p-3 mb-3" key={index}>
              <div className="row">
                <div className="col-4">
                  <strong>
                    {formatMessage({
                      id: "qualityControlName"
                    })}
                  </strong>
                  {editMode ? (
                    <input
                      className="form-control mt-1"
                      name={`qualityControl-name-${index}`}
                      data-testid={`qualityControl-name-${index}`}
                      value={qualityControl.name}
                      onChange={(newValue) =>
                        updateQualityControl?.(index, {
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
                  <strong>
                    {formatMessage({
                      id: "qualityControlType"
                    })}
                  </strong>
                  {editMode ? (
                    <Select<VocabularyOption>
                      options={qualityControlTypes}
                      value={qualityControlTypes.find(
                        (option) => option.value === qualityControl?.qcType
                      )}
                      isLoading={loading}
                      placeholder={formatMessage({
                        id: "queryBuilder_identifier_placeholder"
                      })}
                      onChange={(newValue) => {
                        updateQualityControl?.(index, {
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
                          (type) => type.value === qualityControl.qcType
                        )?.label
                      }
                    </p>
                  )}
                </div>
                <div className="col-3">
                  {editMode && (
                    <>
                      <strong>
                        {formatMessage({
                          id: "actions"
                        })}
                        {":"}
                      </strong>
                      <div className="d-flex align-items-center">
                        <AddAttachmentsButton
                          onChange={(newMetadatas) => {
                            updateQualityControl?.(index, {
                              ...qualityControl,
                              attachments: [...newMetadatas]
                            });
                          }}
                          value={qualityControl.attachments}
                          className="mb-0 me-4 mt-1"
                        />
                        <Button
                          onClick={() => deleteQualityControl?.(index)}
                          variant="danger"
                          className="delete-datablock"
                          style={{ marginTop: "-10px" }}
                          data-testid={`delete-quality-control-${index}`}
                        >
                          <FaTrash />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Existing Attachments */}
              {qualityControl?.attachments?.length > 0 && (
                <div style={{ marginTop: "15px" }}>
                  <AttachmentsEditor
                    attachmentParentBaseApi="seqdb-api"
                    attachmentParentType="quality-control"
                    attachmentParentId={""}
                    name={`qualityControlAttachments_${index}}`}
                    onChange={(newMetadatas) => {
                      updateQualityControl?.(index, {
                        ...qualityControl,
                        attachments: [
                          // Override everything since it can be deleting it.
                          ...newMetadatas
                        ]
                      });
                    }}
                    hideAddAttchmentBtn={true}
                    hideAttachmentForm={true}
                    hideTitle={true}
                    hideRemoveBtn={!editMode}
                    hideCard={true}
                    value={qualityControl.attachments}
                  />
                </div>
              )}
            </div>
          );
        })}
        {editMode && (
          <div className="mt-3">
            <CollapsibleSection
              id={"pasteQualityControlName"}
              headerKey={"pasteQualityControlName"}
            >
              <DataPasteZone onDataPaste={onDataPaste} />
            </CollapsibleSection>
          </div>
        )}
      </div>
    </div>
  ) : null;
}
