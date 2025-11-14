import {
  DinaForm,
  useAccount,
  useModal,
  AreYouSureModal,
  BULK_EDIT_IDS_KEY,
  useApiClient,
  LoadingSpinner
} from "common-ui";
import { useRouter } from "next/router";
import { Footer, Head, Nav } from "../../components";
import { GroupSelectField } from "../../components/group-select/GroupSelectField";
import {
  FileUploader,
  FileUploaderOnSubmitArgs
} from "../../components/object-store";
import { useFileUpload } from "../../components/object-store/file-upload/FileUploadProvider";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";
import { writeStorage, deleteFromStorage } from "@rehooks/local-storage";
import { FaFileExcel } from "react-icons/fa6";
import { FaListAlt } from "react-icons/fa";
import { useRef } from "react";

export const BULK_ADD_IDS_KEY = "bulkAddIds";
export const BULK_ADD_FILES_KEY = "bulkAddFiles";

export interface BulkAddFileInfo {
  id: string;
  originalFilename: string;
}

export interface OnSubmitValues {
  group?: string;
}

export default function UploadPage() {
  const router = useRouter();
  const { formatMessage } = useDinaIntl();
  const { initialized: accountInitialized, groupNames } = useAccount();
  const { uploadFiles } = useFileUpload();
  const { openModal } = useModal();
  const { apiClient } = useApiClient();

  const submitTypeRef = useRef<"workbook" | "batchEntry">("batchEntry");

  async function onSubmit({
    acceptedFiles,
    group,
    submitType
  }: FileUploaderOnSubmitArgs<OnSubmitValues>) {
    const actualSubmitType = submitType || submitTypeRef.current;

    if (!group) {
      throw new Error(formatMessage("groupMustBeSelected"));
    }

    const uploadRespsT = await uploadFiles({
      files: acceptedFiles,
      group,
      isDerivative: router?.query?.derivativeType ? true : false
    });

    // Handle linking derivative to metadata object
    if (router?.query?.derivativeType) {
      const derivativeObjectUpload = uploadRespsT[0];
      const response = await apiClient.axios.post(
        `/objectstore-api/derivative`,
        {
          data: {
            type: "derivative",
            attributes: {
              bucket: derivativeObjectUpload.bucket,
              derivativeType: router.query.derivativeType,
              fileIdentifier: derivativeObjectUpload.id,
              dcType: derivativeObjectUpload.dcType
            },
            relationships: {
              acDerivedFrom: {
                data: {
                  type: "metadata",
                  id: router.query.acDerivedFrom
                }
              }
            }
          }
        },
        {
          headers: {
            "Content-Type": "application/vnd.api+json"
          }
        }
      );
      await router.push({
        pathname: "/object-store/derivative/edit",
        query: { id: response.data.data.id }
      });
    } else {
      // Handle redirecting to metadata edit page for creating metadata objects
      const objectUploadDuplicates = uploadRespsT
        .filter((resp) => resp.meta?.warnings?.duplicate_found)
        .map(({ meta, originalFilename }) => ({ originalFilename, meta }));

      const navigateToEditMetadata = async () => {
        const objectUploadIds = uploadRespsT.map((item) => item.id);

        deleteFromStorage(BULK_ADD_FILES_KEY);
        deleteFromStorage(BULK_EDIT_IDS_KEY);

        if (actualSubmitType === "workbook") {
          const fileInfos: BulkAddFileInfo[] = uploadRespsT.map(
            (objectUpload) => ({
              id: objectUpload.id ?? "",
              originalFilename: objectUpload.originalFilename
            })
          );
          writeStorage(BULK_ADD_FILES_KEY, fileInfos);

          // Workbook route
          await router.push({
            pathname: "/workbook/upload",
            query: {
              group
            }
          });
        } else {
          writeStorage(BULK_ADD_IDS_KEY, objectUploadIds);

          // Batch Entry Form route
          if (objectUploadIds.length === 1) {
            await router.push({
              pathname: "/object-store/metadata/edit",
              query: {
                group
              }
            });
          } else {
            await router.push({
              pathname: "/object-store/metadata/bulk-edit",
              query: {
                group
              }
            });
          }
        }
      };

      if (Object.keys(objectUploadDuplicates)?.length === 0) {
        // No duplicate files, proceed to edit metadata page
        await navigateToEditMetadata();
      } else {
        openModal(
          <AreYouSureModal
            actionMessage={
              <span>
                <DinaMessage id="proceedToCreateMetadata" />
                <p>
                  {`(${objectUploadDuplicates.length} `}
                  {formatMessage("duplicateFilesFound") + " )"}
                </p>
              </span>
            }
            messageBody={
              <table className="table table-bordered">
                <thead>
                  <tr>
                    <th style={{ width: "30%" }}>
                      <DinaMessage id="field_originalFilename" />
                    </th>
                    <th style={{ width: "40%" }}>
                      <DinaMessage id="warningMessage" />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {objectUploadDuplicates.map(
                    (dup, idx) =>
                      dup.originalFilename && (
                        <tr key={idx} className={`${idx}-row`}>
                          <td>{dup.originalFilename}</td>
                          <td>{String(dup.meta?.warnings?.duplicate_found)}</td>
                        </tr>
                      )
                  )}
                </tbody>
              </table>
            }
            onYesButtonClicked={navigateToEditMetadata}
          />
        );
      }
    }
  }

  return (
    <div>
      <Head title={formatMessage("uploadPageTitle")} />
      <Nav />
      <main className="container-fluid">
        <h1 id="wb-cont">
          <DinaMessage id="uploadPageTitle" />
        </h1>
        {!accountInitialized || !groupNames?.length ? (
          <div className="alert alert-warning no-group-alert">
            <DinaMessage id="userMustBelongToGroup" />
          </div>
        ) : (
          <DinaForm<OnSubmitValues> initialValues={{}}>
            <div className="row">
              <GroupSelectField
                className="col-md-3"
                name="group"
                enableStoredDefaultGroup={true}
              />
            </div>
            <div>
              <FileUploader
                onSubmit={onSubmit}
                SubmitButtonComponent={({
                  files,
                  onSubmit: handleSubmit,
                  disabled,
                  isSubmitting,
                  hasAnInvalidFileSize
                }) => {
                  const isDisabled = disabled || hasAnInvalidFileSize;

                  if (isSubmitting) {
                    return (
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <LoadingSpinner loading={true} />
                      </div>
                    );
                  }

                  return (
                    <div className="d-flex gap-2 dzu-submitButtonContainer">
                      <button
                        type="button"
                        className="btn btn-success me-2"
                        style={{ marginRight: "0.5rem" }}
                        onClick={() => {
                          submitTypeRef.current = "workbook";
                          handleSubmit(files);
                        }}
                        disabled={isDisabled}
                      >
                        <FaFileExcel className="me-2" />
                        <DinaMessage id="continueWithWorkbook" />
                      </button>
                      <button
                        type="button"
                        className="btn btn-success"
                        onClick={() => {
                          submitTypeRef.current = "batchEntry";
                          handleSubmit(files);
                        }}
                        disabled={isDisabled}
                      >
                        <FaListAlt className="me-2" />
                        <DinaMessage id="continueWithBatchEntryForm" />
                      </button>
                    </div>
                  );
                }}
              />
            </div>
          </DinaForm>
        )}
      </main>
      <Footer />
    </div>
  );
}
