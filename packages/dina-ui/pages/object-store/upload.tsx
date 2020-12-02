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
import { Footer, Head, Nav } from "../../components";
import {
  FileUploader,
  FileUploadResponse,
  IFileWithMeta,
  ViewExif
} from "../../components/object-store";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";
import { Metadata } from "../../types/objectstore-api/resources/Metadata";

export interface OnSubmitValues {
  acceptedFiles: IFileWithMeta[];
  group: string;
}

export default function UploadPage() {
  const [previousState, setPreviousState] = useState({
    uploadResps: [],
    grp: "",
    showExif: false
  });

  const router = useRouter();
  const { formatMessage } = useDinaIntl();
  const { apiClient, save } = useContext(ApiClientContext);
  const { agentId, initialized: accountInitialized } = useAccount();
  const groupSelectOptions = useGroupSelectOptions();

  const acceptedFileTypes = "image/*,audio/*,video/*,.pdf,.doc,.docx,.png";

  async function onSubmit({ acceptedFiles, group }: OnSubmitValues) {
    // Upload each file in a separate request, then create the metadatas in a transaction.
    // TODO: Do all of this in a single transaction.

    if (!group) {
      throw new Error(formatMessage("groupMustBeSelected"));
    }

    const uploadRespsT: FileUploadResponse[] = [];
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
    setPreviousState({
      uploadResps: uploadRespsT as any,
      grp: group,
      showExif: true
    });
  }

  async function onSubmitMeta() {
    const saveOperations = previousState.uploadResps.map<SaveArgs<Metadata>>(
      res => ({
        resource: {
          acDigitizationDate: (res as FileUploadResponse).dateTimeDigitized
            ? moment((res as FileUploadResponse).dateTimeDigitized).format()
            : null,
          acMetadataCreator: {
            id: agentId,
            type: "person"
          },
          bucket: previousState.grp,
          fileIdentifier: (res as FileUploadResponse).fileIdentifier,
          type: "metadata"
        } as Metadata,
        type: "metadata"
      })
    );

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
      <main className="container">
        {!accountInitialized || !groupSelectOptions?.length ? (
          <div className="alert alert-warning no-group-alert">
            <DinaMessage id="userMustBelongToGroup" />
          </div>
        ) : !previousState.showExif ? (
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
        ) : (
          <>
            {previousState.uploadResps.map(resp => ViewExif(resp))}
            <Formik initialValues={{}} onSubmit={onSubmitMeta}>
              <Form className="saveMultiMeta">
                <SubmitButton>
                  <DinaMessage id="submitBtnText" />
                </SubmitButton>
              </Form>
            </Formik>
          </>
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
