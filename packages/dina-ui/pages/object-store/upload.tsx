import {
  DinaForm,
  FormikButton,
  useAccount,
  useModal,
  AreYouSureModal,
  BULK_EDIT_IDS_KEY
} from "common-ui";
import { useRouter } from "next/router";
import { Footer, Head, Nav } from "../../components";
import { GroupSelectField } from "../../components/group-select/GroupSelectField";
import {
  FileUploader,
  FileUploaderOnSubmitArgs
} from "../../components/object-store";
import { useFileUpload } from "../../components/object-store/file-upload/FileUploadProvider";
import { DefaultValuesConfigSelectField } from "../../components/object-store/metadata-bulk-editor/custom-default-values/DefaultValueConfigManager";
import { useDefaultValueRuleEditorModal } from "../../components/object-store/metadata-bulk-editor/custom-default-values/useDefaultValueRuleBuilderModal";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";
import { writeStorage, deleteFromStorage } from "@rehooks/local-storage";

export const BULK_ADD_IDS_KEY = "bulkAddIds";

export interface OnSubmitValues {
  group?: string;
  defaultValuesConfig: number | null;
}

export default function UploadPage() {
  const router = useRouter();
  const { formatMessage } = useDinaIntl();
  const { initialized: accountInitialized, groupNames } = useAccount();
  const { uploadFiles } = useFileUpload();
  const { openDefaultValuesModal } = useDefaultValueRuleEditorModal();
  const { openModal } = useModal();

  async function onSubmit({
    acceptedFiles,
    group,
    defaultValuesConfig
  }: FileUploaderOnSubmitArgs<OnSubmitValues>) {
    if (!group) {
      throw new Error(formatMessage("groupMustBeSelected"));
    }

    const uploadRespsT = await uploadFiles({ files: acceptedFiles, group });

    const objectUploadDuplicates = uploadRespsT
      .filter(resp => resp.meta?.warnings?.duplicate_found)
      .map(({ meta, originalFilename }) => ({ originalFilename, meta }));

    const navigateToEditMetadata = async () => {
      const objectUploadIds = uploadRespsT.map(
        ({ fileIdentifier }) => fileIdentifier
      );
      deleteFromStorage(BULK_EDIT_IDS_KEY);
      writeStorage(BULK_ADD_IDS_KEY, objectUploadIds);
      if (objectUploadIds.length === 1) {
        await router.push({
          pathname: "/object-store/metadata/single-record-edit",
          query: {
            group,
            ...(defaultValuesConfig !== null ? { defaultValuesConfig } : {})
          }
        });
      } else {
        await router.push({
          pathname: "/object-store/metadata/edit",
          query: {
            group,
            ...(defaultValuesConfig !== null ? { defaultValuesConfig } : {})
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

  // Fix the place holder text ...Select has not enough contrast ratio to the background issue
  const customStyles = {
    placeholder: (provided, _) => ({
      ...provided,
      color: "rgb(51,51,51)"
    })
  };

  return (
    <div>
      <Head title={formatMessage("uploadPageTitle")} />
      <Nav />
      <main className="container">
        <h1 id="wb-cont">
          <DinaMessage id="uploadPageTitle" />
        </h1>
        {!accountInitialized || !groupNames?.length ? (
          <div className="alert alert-warning no-group-alert">
            <DinaMessage id="userMustBelongToGroup" />
          </div>
        ) : (
          <DinaForm<OnSubmitValues>
            initialValues={{ defaultValuesConfig: null }}
          >
            <div className="container">
              <div className="row">
                <GroupSelectField
                  className="col-md-3"
                  name="group"
                  enableStoredDefaultGroup={true}
                />
                <DefaultValuesConfigSelectField
                  allowBlank={true}
                  name="defaultValuesConfig"
                  className="offset-md-3 col-md-3"
                  styles={customStyles}
                />
                <div className="col-md-3" style={{ margin: "2em 0em 2em 0em" }}>
                  <FormikButton
                    className="btn btn-primary"
                    onClick={({ defaultValuesConfig }, { setFieldValue }) =>
                      openDefaultValuesModal({
                        index: defaultValuesConfig,
                        onSave: index =>
                          setFieldValue("defaultValuesConfig", index)
                      })
                    }
                  >
                    <DinaMessage id="configureDefaultValues" />
                  </FormikButton>
                </div>
              </div>
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
