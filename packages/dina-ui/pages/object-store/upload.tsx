import {
  ErrorViewer,
  SelectField,
  useAccount,
  useGroupSelectOptions
} from "common-ui";
import { Form, Formik } from "formik";
import { noop } from "lodash";
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
            <Formik
              initialValues={{ group: groupSelectOptions[0].value }}
              onSubmit={noop}
            >
              <Form translate={undefined}>
                <ErrorViewer />
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
              </Form>
            </Formik>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
