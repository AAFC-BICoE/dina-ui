import {
  DinaForm,
  FormikButton,
  useAccount,
  useModal,
  AreYouSureModal
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

  const acceptedFileTypes = "image/*,audio/*,video/*,.pdf,.doc,.docx,.png";

  async function onSubmit({
    acceptedFiles,
    group,
    defaultValuesConfig
  }: FileUploaderOnSubmitArgs<OnSubmitValues>) {
    if (!group) {
      throw new Error(formatMessage("groupMustBeSelected"));
    }

    const uploadRespsT = await uploadFiles({ files: acceptedFiles, group });

    const objectUploadDuplicates = uploadRespsT.map(
      ({ meta, originalFilename }) =>
        meta && Object.keys(meta.warnings) ? { originalFilename, meta } : {}
    );

    if (objectUploadDuplicates.length > 0) {
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
                    dup.originalFilename &&
                    !!dup.meta?.warnings.duplicate_found(
                      <tr key={idx} className={`${idx}-row`}>
                        <td>{dup.originalFilename}</td>
                        <td>{dup.meta?.warnings.duplicate_found}</td>
                      </tr>
                    )
                )}
              </tbody>
            </table>
          }
          onYesButtonClicked={async () => {
            const objectUploadIds = uploadRespsT
              .map(({ fileIdentifier }) => fileIdentifier)
              .join(",");

            await router.push({
              pathname: "/object-store/metadata/edit",
              query: {
                group,
                objectUploadIds,
                ...(defaultValuesConfig !== null ? { defaultValuesConfig } : {})
              }
            });
          }}
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
        <h1>
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
              <div className="col-md-3">
                <FormikButton
                  className="btn btn-primary mt-4"
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
            <div>
              <FileUploader
                acceptedFileTypes={acceptedFileTypes}
                onSubmit={onSubmit}
              />
            </div>
          </DinaForm>
        )}
      </main>
      <Footer />
    </div>
  );
}
