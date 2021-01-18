import {
  DinaForm,
  SelectField,
  useAccount,
  useGroupSelectOptions
} from "common-ui";
import { useRouter } from "next/router";
import { Footer, Head, Nav } from "../../components";
import {
  FileUploader,
  FileUploaderOnSubmitArgs
} from "../../components/object-store";
import { useFileUpload } from "../../components/object-store/file-upload/FileUploadProvider";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";

export interface OnSubmitValues {
  group: string;
}

export default function UploadPage() {
  const router = useRouter();
  const { formatMessage } = useDinaIntl();
  const { initialized: accountInitialized } = useAccount();
  const groupSelectOptions = useGroupSelectOptions();
  const { uploadFiles } = useFileUpload();

  const acceptedFileTypes = "image/*,audio/*,video/*,.pdf,.doc,.docx,.png";

  async function onSubmit({
    acceptedFiles,
    group
  }: FileUploaderOnSubmitArgs<OnSubmitValues>) {
    if (!group) {
      throw new Error(formatMessage("groupMustBeSelected"));
    }

    const uploadRespsT = await uploadFiles({ files: acceptedFiles, group });

    const objectUploadIds = uploadRespsT
      .map(({ fileIdentifier }) => fileIdentifier)
      .join(",");

    await router.push({
      pathname: "/object-store/metadata/edit",
      query: { group, objectUploadIds }
    });
  }

  return (
    <div>
      <Head title={formatMessage("uploadPageTitle")} />
      <Nav />
      <main className="container">
        <h1>
          <DinaMessage id="uploadPageTitle" />
        </h1>
        {!accountInitialized || !groupSelectOptions?.length ? (
          <div className="alert alert-warning no-group-alert">
            <DinaMessage id="userMustBelongToGroup" />
          </div>
        ) : (
          <div>
            <div className="alert alert-warning">
              <DinaMessage id="forTestingPurposesOnlyMessage" />
            </div>
            <DinaForm initialValues={{ group: groupSelectOptions[0].value }}>
              <div className="row">
                <SelectField
                  className="col-md-3"
                  name="group"
                  options={groupSelectOptions}
                />
              </div>
              <div>
                <FileUploader
                  acceptedFileTypes={acceptedFileTypes}
                  onSubmit={onSubmit}
                />
              </div>
            </DinaForm>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
