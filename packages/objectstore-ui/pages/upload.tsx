import {
  ApiClientContext,
  ErrorViewer,
  safeSubmit,
  SaveArgs,
  SelectField,
  SubmitButton,
  useAccount
} from "common-ui";
import { Form, Formik } from "formik";
import { useRouter } from "next/router";
import { useContext, useMemo } from "react";
import { useDropzone } from "react-dropzone";
import { Metadata } from "types/objectstore-api/resources/Metadata";
import { Head, Nav } from "../components";
import {
  ObjectStoreMessage,
  useObjectStoreIntl
} from "../intl/objectstore-intl";

export interface FileUploadResponse {
  fileIdentifier: string;
  metaFileEntryVersion: string;
  originalFilename: string;
  sha1Hex: string;
  receivedMediaType: string;
  detectedMediaType: string;
  detectedFileExtension: string;
  evaluatedMediaType: string;
  evaluatedFileExtension: string;
  sizeInBytes: number;
}

const baseStyle = {
  alignItems: "center",
  backgroundColor: "#fafafa",
  borderColor: "#eeeeee",
  borderRadius: 2,
  borderStyle: "dashed",
  borderWidth: 2,
  color: "#bdbdbd",
  display: "flex",
  flex: 1,
  flexDirectionProperty: "column",
  outline: "none",
  padding: "20px",
  transition: "border .24s ease-in-out"
};

const activeStyle = {
  borderColor: "#2196f3"
};

const acceptStyle = {
  borderColor: "#00e676"
};

const rejectStyle = {
  borderColor: "#ff1744"
};

export default function UploadPage() {
  const router = useRouter();
  const { formatMessage } = useObjectStoreIntl();
  const { apiClient, save } = useContext(ApiClientContext);
  const { groups, initialized: accountInitialized } = useAccount();

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragAccept,
    isDragReject,
    acceptedFiles
  } = useDropzone({
    accept: "image/*,audio/*,video/*,.pdf,.doc,.docx,.png"
  });

  const style = useMemo(
    () => ({
      ...baseStyle,
      ...(isDragActive ? activeStyle : {}),
      ...(isDragAccept ? acceptStyle : {}),
      ...(isDragReject ? rejectStyle : {})
    }),
    [isDragActive, isDragReject]
  );

  async function onSubmit({ group }) {
    // Upload each file in a separate request, then create the metadatas in a transaction.
    // TODO: Do all of this in a single transaction.

    if (!group) {
      throw new Error(formatMessage("groupMustBeSelected"));
    }

    const uploadResponses: FileUploadResponse[] = [];
    for (const file of acceptedFiles) {
      // Wrap the file in a FormData:
      const formData = new FormData();
      formData.append("file", file);

      // Upload the file:
      const response = await apiClient.axios.post(`/file/${group}`, formData, {
        transformResponse: fileUploadErrorHandler
      });
      uploadResponses.push(response.data);
    }

    const saveOperations = uploadResponses.map<SaveArgs<Metadata>>(res => ({
      resource: {
        bucket: group,
        fileIdentifier: res.fileIdentifier,
        type: "metadata"
      } as Metadata,
      type: "metadata"
    }));

    const saveResults = await save(saveOperations);

    const ids = saveResults.map(res => res.id).join(",");

    await router.push({
      pathname: "/metadata/edit",
      query: { ids }
    });
  }

  const groupSelectOptions = (groups ?? []).map(group => {
    // Remove keycloak's prefixed slash from the start of the group name:
    const unprefixedGroup = group.replace(/\/(.*)/, "$1");
    return {
      label: unprefixedGroup,
      value: unprefixedGroup
    };
  });

  return (
    <div>
      <Head title={formatMessage("uploadPageTitle")} />
      <Nav />
      <div className="container">
        {!accountInitialized || !groups?.length ? (
          <div className="alert alert-warning no-group-alert">
            <ObjectStoreMessage id="userMustBelongToGroup" />
          </div>
        ) : (
          <div>
            <div className="alert alert-warning">
              For testing purpose only. Only unclassified data should be
              uploaded. Any uploaded data can be deleted at any given moment.
            </div>
            <Formik
              initialValues={{ group: groupSelectOptions[0].value }}
              onSubmit={safeSubmit(onSubmit)}
            >
              <Form>
                <div className="row">
                  <SelectField
                    className="col-md-3"
                    disabled={true}
                    name="group"
                    options={groupSelectOptions}
                  />
                </div>
                <div id="dndRoot" style={{ cursor: "pointer" }}>
                  <div {...getRootProps({ style })} className="root">
                    <input {...getInputProps()} />
                    <div style={{ margin: "auto" }}>
                      <div>
                        <ObjectStoreMessage id="uploadFormInstructions" />
                      </div>
                    </div>
                  </div>
                </div>
                <ul className="list-group">
                  {acceptedFiles.map(file => (
                    <li className="list-group-item" key={file.name}>
                      {file.name} - {file.size} bytes
                    </li>
                  ))}
                </ul>
                {acceptedFiles.length ? (
                  <div>
                    <ErrorViewer />
                    <SubmitButton>
                      <ObjectStoreMessage id="uploadButtonText" />
                    </SubmitButton>
                  </div>
                ) : null}
              </Form>
            </Formik>
          </div>
        )}
      </div>
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
