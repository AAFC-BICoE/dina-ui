import {
  ApiClientContext,
  ErrorViewer,
  SelectField,
  useAccount,
  useGroupSelectOptions
} from "common-ui";
import { Form, Formik } from "formik";
import { noop } from "lodash";
import { useRouter } from "next/router";
import { useContext } from "react";
import { Footer, Head, Nav } from "../../components";
import { FileUploader, IFileWithMeta } from "../../components/object-store";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";
import { ObjectUpload } from "../../types/objectstore-api/resources/ObjectUpload";

export interface OnSubmitValues {
  acceptedFiles: IFileWithMeta[];
  group: string;
}

export default function UploadPage() {
  const router = useRouter();
  const { formatMessage } = useDinaIntl();
  const { apiClient } = useContext(ApiClientContext);
  const { agentId, initialized: accountInitialized } = useAccount();
  const groupSelectOptions = useGroupSelectOptions();

  const acceptedFileTypes = "image/*,audio/*,video/*,.pdf,.doc,.docx,.png";

  async function onSubmit({ acceptedFiles, group }: OnSubmitValues) {
    if (!group) {
      throw new Error(formatMessage("groupMustBeSelected"));
    }

    const uploadRespsT: ObjectUpload[] = [];
    for (const { file } of acceptedFiles) {
      // Wrap the file in a FormData:
      const formData = new FormData();
      formData.append("file", file);

      // Upload the file:
      const response = await apiClient.axios.post(
        `/objectstore-api/file/${group}`,
        formData,
        { transformResponse: fileUploadErrorHandler }
      );
      uploadRespsT.push(response.data);
    }

    const objectUploadIds = uploadRespsT
      .map(({ fileIdentifier }) => fileIdentifier)
      .join(",");

    await router.push({
      pathname: "/object-store/metadata/edit",
      query: { agentId, group, objectUploadIds }
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

/** Errors are handled differently here because they come from Spring Boot instead of Crnk. */
export function fileUploadErrorHandler(data: string) {
  // Custom spring boot error handling to get the correct error message:
  const parsed = JSON.parse(data);
  const errorDetail = parsed?.errors?.[0]?.detail;
  if (errorDetail) {
    throw new Error(errorDetail);
  }

  // If no error, proceed as usual:
  return parsed;
}
