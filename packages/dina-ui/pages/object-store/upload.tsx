import {
  DinaForm,
  useAccount,
  useModal,
  AreYouSureModal,
  BULK_EDIT_IDS_KEY,
  useApiClient
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

export const BULK_ADD_IDS_KEY = "bulkAddIds";

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

  async function onSubmit({
    acceptedFiles,
    group
  }: FileUploaderOnSubmitArgs<OnSubmitValues>) {
    if (!group) {
      throw new Error(formatMessage("groupMustBeSelected"));
    }
    const navigateToList = async () => {
      await router.push({
        pathname: `/object-store/object/list`,
        query: {
          group
        }
      });
    };

    const uploadRespsT = await uploadFiles({
      files: acceptedFiles,
      group,
      isDerivative: router?.query?.derivativeType ? true : false
    });

    // Handle linking derivative to metadata object
    if (router?.query?.derivativeType) {
      const derivativeObjectUpload = uploadRespsT[0];
      await apiClient.axios.post(
        `/objectstore-api/derivative`,
        {
          data: {
            type: "derivative",
            attributes: {
              bucket: derivativeObjectUpload.bucket,
              derivativeType: router.query.derivativeType,
              fileIdentifier: derivativeObjectUpload.fileIdentifier,
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
      await navigateToList();
    } else {
      // Handle redirecting to metadata edit page for creating metadata objects
      const objectUploadDuplicates = uploadRespsT
        .filter((resp) => resp.meta?.warnings?.duplicate_found)
        .map(({ meta, originalFilename }) => ({ originalFilename, meta }));

      const navigateToEditMetadata = async () => {
        const objectUploadIds = uploadRespsT.map(
          ({ fileIdentifier }) => fileIdentifier
        );
        deleteFromStorage(BULK_EDIT_IDS_KEY);
        writeStorage(BULK_ADD_IDS_KEY, objectUploadIds);
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
                          <td>{dup.meta?.warnings?.duplicate_found}</td>
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
              <FileUploader onSubmit={onSubmit} />
            </div>
          </DinaForm>
        )}
      </main>
      <Footer />
    </div>
  );
}
