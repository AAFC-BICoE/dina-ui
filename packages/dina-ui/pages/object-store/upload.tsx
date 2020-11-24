import {
  ApiClientContext,
  ErrorViewer,
  SaveArgs,
  SelectField,
  SubmitButton,
  useAccount,
  useGroupSelectOptions
} from "common-ui";
import { Form, Formik } from "formik";
import { noop } from "lodash";
import moment from "moment";
import { useRouter } from "next/router";
import { useContext, useState } from "react";
import {
  FileUploader,
  Footer,
  Head,
  IFileWithMeta,
  Nav
} from "../../components";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";
import { Metadata } from "../../types/objectstore-api/resources/Metadata";
import ViewExif, {
  FileUploadResponse
} from "../../components/exif-view/view-exif";

export interface OnSubmitValues {
  acceptedFiles: IFileWithMeta[];
  group: string;
}

export default function UploadPage() {
  const uploadResps: FileUploadResponse[] = [];
  let accptFiles: IFileWithMeta[] = [];
  let grp: string;

  const [showExif, setShowExif] = useState(false);

  const router = useRouter();
  const { formatMessage } = useDinaIntl();
  const { apiClient, save } = useContext(ApiClientContext);
  const { agentId, initialized: accountInitialized } = useAccount();
  const groupSelectOptions = useGroupSelectOptions();

  const acceptedFileTypes = "image/*,audio/*,video/*,.pdf,.doc,.docx,.png";

  async function onSubmit({ acceptedFiles, group }: OnSubmitValues) {
    uploadResps.length = 0;
    accptFiles.length = 0;
    // Upload each file in a separate request, then create the metadatas in a transaction.
    // TODO: Do all of this in a single transaction.

    if (!group) {
      throw new Error(formatMessage("groupMustBeSelected"));
    }
    grp = group;
    accptFiles = acceptedFiles;
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
      uploadResps.push(response.data);
    }
    setShowExif(true);
  }

  async function onSubmitMeta() {
    const saveOperations = uploadResps.map<SaveArgs<Metadata>>((res, idx) => ({
      resource: {
        acMetadataCreator: {
          id: agentId,
          type: "person"
        },
        acDigitizationDate: moment(
          accptFiles[idx].meta.lastModifiedDate
        ).format(),
        bucket: grp,
        fileIdentifier: res.fileIdentifier,
        type: "metadata"
      } as Metadata,
      type: "metadata"
    }));

    const saveResults = await save(saveOperations, {
      apiBaseUrl: "/objectstore-api"
    });

    const ids = saveResults.map(res => res.id).join(",");

    await router.push({
      pathname: "/object-store/metadata/edit",
      query: { ids }
    });
  }

  return (
    <div>
      <Head title={formatMessage("uploadPageTitle")} />
      <Nav />
      <div className="container">
        {!accountInitialized || !groupSelectOptions?.length ? (
          <div className="alert alert-warning no-group-alert">
            <DinaMessage id="userMustBelongToGroup" />
          </div>
        ) : !showExif ? (
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
                    disabled={true}
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
        ) : (
          <>
            {uploadResps.map(resp => ViewExif(resp))}
            <Formik initialValues={{}} onSubmit={onSubmitMeta}>
              <Form className="saveMultiMeta">
                <SubmitButton>
                  <DinaMessage id="submitBtnText" />
                </SubmitButton>
              </Form>
            </Formik>
          </>
        )}
      </div>
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
