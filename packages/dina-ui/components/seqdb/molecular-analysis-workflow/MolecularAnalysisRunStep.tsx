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
    sequencingRunId
  } = useGenericMolecularAnalysisRun({
    editMode,
    setEditMode,
    performSave,
    setPerformSave,
    molecularAnalysis,
    molecularAnalysisId
  });

  // Table columns to display for the sequencing run.
  const COLUMNS: ColumnDef<SequencingRunItem>[] = [
    {
      id: "wellCoordinates",
      cell: ({ row }) => {
        return (
          <>
            {!row.original?.storageUnitUsage ||
            row.original?.storageUnitUsage?.wellRow === null ||
            row.original?.storageUnitUsage?.wellColumn === null
              ? ""
              : `${row.original.storageUnitUsage?.wellRow}${row.original.storageUnitUsage?.wellColumn}`}
          </>
        );
      },
      header: () => <FieldHeader name={"wellCoordinates"} />,
      accessorKey: "wellCoordinates",
      sortingFn: (a: any, b: any): number => {
        const aString =
          !a.original?.storageUnitUsage ||
          a.original?.storageUnitUsage?.wellRow === null ||
          a.original?.storageUnitUsage?.wellColumn === null
            ? ""
            : `${a.original.storageUnitUsage?.wellRow}${a.original.storageUnitUsage?.wellColumn}`;
        const bString =
          !b.original?.storageUnitUsage ||
          b.original?.storageUnitUsage?.wellRow === null ||
          b.original?.storageUnitUsage?.wellColumn === null
            ? ""
            : `${b.original.storageUnitUsage?.wellRow}${b.original.storageUnitUsage?.wellColumn}`;
        return compareByStringAndNumber(aString, bString);
      }
    },
    {
      id: "tubeNumber",
      cell: ({ row: { original } }) =>
        original?.storageUnitUsage?.cellNumber === undefined ? (
          <></>
        ) : (
          <>{original.storageUnitUsage?.cellNumber}</>
        ),
      header: () => <FieldHeader name={"tubeNumber"} />,
      accessorKey: "tubeNumber",
      sortingFn: (a: any, b: any): number =>
        compareByStringAndNumber(
          a?.original?.storageUnitUsage?.cellNumber?.toString(),
          b?.original?.storageUnitUsage?.cellNumber?.toString()
        )
    },
    {
      id: "materialSampleName",
      cell: ({ row: { original } }) => {
        const materialSampleName =
          original?.materialSampleSummary?.materialSampleName;
        return (
          <>
            <Link
              href={`/collection/material-sample/view?id=${original.materialSampleId}`}
            >
              <a>{materialSampleName || original.materialSampleId}</a>
            </Link>
          </>
        );
      },
      header: () => <FieldHeader name="materialSampleName" />,
      accessorKey: "materialSampleSummary.materialSampleName",
      sortingFn: (a: any, b: any): number =>
        compareByStringAndNumber(
          a?.original?.materialSampleSummary?.materialSampleName,
          b?.original?.materialSampleSummary?.materialSampleName
        ),
      enableSorting: true
    }
  ];

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
                          <p>{qualityControl.name}</p>
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
                          <p>
                            {
                              qualityControlTypes.find(
                                (type) => type.value === qualityControl.qcType
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

          {/* Attachments */}
          <div className="col-12 mt-3">
            <DinaForm initialValues={{}}>
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
