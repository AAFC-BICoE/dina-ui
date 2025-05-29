import {
  QualityControlWithAttachment,
  SequencingRunItem,
  useGenericMolecularAnalysisRun
} from "./useGenericMolecularAnalysisRun";
import {
  DinaForm,
  LoadingSpinner,
  ReactTable,
  SaveArgs,
  useAccount,
  useApiClient
} from "common-ui";
import { Alert, Dropdown, DropdownButton } from "react-bootstrap";
import { ColumnDef } from "@tanstack/react-table";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { GenericMolecularAnalysis } from "../../../types/seqdb-api/resources/GenericMolecularAnalysis";
import { Metadata } from "../../../types/objectstore-api";
import { MolecularAnalysisResult } from "../../../types/seqdb-api/resources/molecular-analysis/MolecularAnalysisResult";
import { MolecularAnalysisRunItem } from "../../../types/seqdb-api/resources/molecular-analysis/MolecularAnalysisRunItem";
import { useMolecularAnalysisRunColumns } from "../../molecular-analysis/useMolecularAnalysisRunColumns";
import { useState } from "react";

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
  const { formatMessage } = useDinaIntl();
  const { apiClient, save } = useApiClient();
  const { groupNames } = useAccount();
  const {
    loading,
    errorMessage,
    multipleRunWarning,
    sequencingRunItems,
    setReloadGenericMolecularAnalysisRun,
    qualityControls,
    qualityControlTypes,
    updateExistingQualityControls
  } = useGenericMolecularAnalysisRun({
    editMode,
    setEditMode,
    performSave,
    setPerformSave,
    molecularAnalysis,
    molecularAnalysisId
  });

  const [autoSelectAttachmentsClicked, setAutoSelectAttachmentsClicked] =
    useState<boolean>(false);
  const [numAttachmentsFound, setNumAttachmentsFound] = useState<number>(0);

  // Table columns to display for the sequencing run.
  const genericMolecularAnalysisResultsColumns: ColumnDef<SequencingRunItem>[] =
    useMolecularAnalysisRunColumns({
      type: "generic-molecular-analysis-results",
      readOnly: true,
      setReloadGenericMolecularAnalysisRun
    });

  const qualityControlColumns: ColumnDef<QualityControlWithAttachment>[] =
    useMolecularAnalysisRunColumns({
      type: "quality-control",
      readOnly: true,
      setReloadGenericMolecularAnalysisRun,
      qualityControls,
      updateExistingQualityControls,
      qualityControlTypes
    });

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

      {/* Number of attachments found message */}
      {autoSelectAttachmentsClicked && (
        <div className="row">
          <div className="col-12">
            <Alert variant="info" className="mb-2">
              {formatMessage("attachmentsFoundBannerText", {
                numAttachmentsFound: numAttachmentsFound
              })}
            </Alert>
          </div>
        </div>
      )}

      {/* Run Information */}
      {editMode ||
      sequencingRunItems?.some((item) => item.molecularAnalysisRunItemId) ? (
        <div className="row mt-4">
          <div className="col-12 d-flex justify-content-between align-items-end">
            <strong>
              <DinaMessage id="molecularAnalysisRunStep_sequencingRunContent" />
            </strong>
            <DropdownButton title={formatMessage("autoSelectButtonTitle")}>
              <Dropdown.Item
                onClick={async () => {
                  if (sequencingRunItems) {
                    try {
                      for (const sequencingRunItem of sequencingRunItems) {
                        if (sequencingRunItem.molecularAnalysisRunItem?.name) {
                          const metadataResp = await apiClient.get<Metadata[]>(
                            `objectstore-api/metadata`,
                            {
                              filter: {
                                rsql: `originalFilename=="${sequencingRunItem.molecularAnalysisRunItem?.name}*"`
                              }
                            }
                          );
                          if (metadataResp.data.length > 0) {
                            const molecularAnalysisRunResultSaveArgs: SaveArgs<MolecularAnalysisResult>[] =
                              [
                                {
                                  type: "molecular-analysis-result",
                                  resource: {
                                    type: "molecular-analysis-result",
                                    group: groupNames?.[0],
                                    relationships: {
                                      attachments: {
                                        data: metadataResp.data as Metadata[]
                                      }
                                    }
                                  }
                                } as any
                              ];

                            const savedMolecularAnalysisResult =
                              await save?.<MolecularAnalysisResult>(
                                molecularAnalysisRunResultSaveArgs,
                                {
                                  apiBaseUrl:
                                    "seqdb-api/molecular-analysis-result"
                                }
                              );
                            const molecularAnalysisRunItemSaveArgs: SaveArgs<MolecularAnalysisRunItem>[] =
                              [
                                {
                                  type: "molecular-analysis-run-item",
                                  resource: {
                                    ...sequencingRunItem.molecularAnalysisRunItem,
                                    relationships: {
                                      result: {
                                        data: {
                                          id: savedMolecularAnalysisResult?.[0]
                                            .id,
                                          type: "molecular-analysis-result"
                                        }
                                      }
                                    }
                                  }
                                } as any
                              ];
                            await save?.<MolecularAnalysisRunItem>(
                              molecularAnalysisRunItemSaveArgs,
                              {
                                apiBaseUrl:
                                  "seqdb-api/molecular-analysis-run-item"
                              }
                            );
                            setNumAttachmentsFound(numAttachmentsFound + 1);
                          }
                        }
                      }

                      setReloadGenericMolecularAnalysisRun(Date.now());
                    } catch (error) {
                      console.error(error);
                    }
                  }
                  setAutoSelectAttachmentsClicked(true);
                }}
              >
                <DinaMessage id="attachmentsBasedOnItemNameButton" />
              </Dropdown.Item>
            </DropdownButton>
          </div>
          <div className="col-12 mt-1">
            <DinaForm initialValues={{}} readOnly={!editMode}>
              {/* Sequencing Run Content */}
              <div className="col-12 mb-3">
                <ReactTable<SequencingRunItem>
                  className="-striped mt-2"
                  columns={genericMolecularAnalysisResultsColumns}
                  data={sequencingRunItems ?? []}
                  sort={[{ id: "materialSampleName", desc: false }]}
                  showPagination={true}
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
      {editMode || qualityControls?.some((item) => item.id) ? (
        <div className="row mt-4">
          <div className="col-12 d-flex justify-content-between align-items-end">
            <strong>
              <DinaMessage id="molecularAnalysisRunStep_sequencingQualityControl" />
            </strong>

            <DropdownButton title={formatMessage("autoSelectButtonTitle")}>
              <Dropdown.Item
                onClick={async () => {
                  if (qualityControls) {
                    try {
                      const updatedQualityControlsCopy = [...qualityControls];

                      for (let i = 0; i < qualityControls.length; i++) {
                        const qualityControl = qualityControls[i];

                        if (qualityControl.name) {
                          const metadataResp = await apiClient.get<Metadata[]>(
                            `objectstore-api/metadata`,
                            {
                              filter: {
                                rsql: `originalFilename=="${qualityControl.name}*"`
                              }
                            }
                          );

                          if (metadataResp.data.length > 0) {
                            const existing = qualityControl.attachments ?? [];
                            const incoming = metadataResp.data as any[];

                            const combined = [...existing, ...incoming];
                            const uniqueById = Array.from(
                              new Map(
                                combined.map((item) => [item.id, item])
                              ).values()
                            );

                            updatedQualityControlsCopy[i] = {
                              ...qualityControl,
                              attachments: uniqueById
                            };
                            uniqueById.forEach(() => {
                              setNumAttachmentsFound((prev) => prev + 1);
                            });
                          }
                        }
                      }

                      // Now this will reflect the correct state
                      await updateExistingQualityControls?.(
                        updatedQualityControlsCopy
                      );

                      setReloadGenericMolecularAnalysisRun(Date.now());
                    } catch (error) {
                      console.error(error);
                    }
                  }
                  setAutoSelectAttachmentsClicked(true);
                }}
              >
                <DinaMessage id="attachmentsBasedOnItemNameButton" />
              </Dropdown.Item>
            </DropdownButton>
          </div>
          <div className="col-12 mt-1">
            <DinaForm initialValues={{}} readOnly={!editMode}>
              {/* Quality Control Content */}
              <div className="col-12 mb-3">
                <ReactTable<QualityControlWithAttachment>
                  className="-striped mt-2"
                  columns={qualityControlColumns}
                  data={qualityControls ?? []}
                  sort={[{ id: "name", desc: false }]}
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
