import { DinaMessage } from "../../../intl/dina-ui-intl";
import { VocabularyOption } from "../../collection/VocabularySelectField";
import { QualityControl } from "../../../types/seqdb-api/resources/QualityControl";
import { Button } from "react-bootstrap";
import { FaTrash } from "react-icons/fa";
import { useIntl } from "react-intl";
import Select from "react-select";
import DataPasteZone from "../../molecular-analysis/DataPasteZone";
import { CollapsibleSection } from "../../../../common-ui/lib";
import { AddAttachmentsButton } from "../../object-store";

interface QualityControlSectionProps {
  editMode?: boolean;
  qualityControls: QualityControl[];
  qualityControlTypes: VocabularyOption[];
  createNewQualityControl?: (name?: string) => void;
  updateQualityControl?: (
    index: number,
    newQualityControl: QualityControl
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
    const names = clipboardData.trim().split("\n");
    names.forEach((name) => createNewQualityControl?.(name));
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
                          onChange={() => {}}
                          value={[]}
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
