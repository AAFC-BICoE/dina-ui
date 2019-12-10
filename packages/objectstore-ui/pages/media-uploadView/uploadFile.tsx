import axios from "axios";
import { ErrorViewer, SubmitButton } from "common-ui";
import { Form, Formik, FormikActions } from "formik";
import React, { useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
import useForceUpdate from "use-force-update";
import { Head, Nav } from "../../components";
import {
  ObjectStoreMessage,
  useObjectStoreIntl
} from "../../intl/objectstore-intl";
import { EditMetadataFormPage } from "../../page-fragments/editMetadata";

interface FileUploadResponse {
  fileName: string;
  fileType: string;
  size: string;
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

let editMetadataVisible = false;

function MediaUploadViewPage() {
  const { formatMessage } = useObjectStoreIntl();

  return (
    <div>
      <Head title={formatMessage("uploadPageTitle")} />
      <Nav />
      <div className="container-fluid">
        <div>
          <h4>
            <ObjectStoreMessage id="uploadPageTitle" />
          </h4>
          <UploadViewForm />
        </div>
      </div>
    </div>
  );
}

function UploadViewForm() {
  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragAccept,
    isDragReject,
    acceptedFiles
  } = useDropzone({
    accept: "image/*,audio/*,video/*,.pdf,.doc,docx,.png"
  });

  const [fileId, setFileId] = useState();
  const acceptedFilesItems = acceptedFiles.map(file => (
    <li key={file.name}>
      <p />
      {file.name} - {file.size} bytes
      <p />
    </li>
  ));
  const style = useMemo(
    () => ({
      ...baseStyle,
      ...(isDragActive ? activeStyle : {}),
      ...(isDragAccept ? acceptStyle : {}),
      ...(isDragReject ? rejectStyle : {})
    }),
    [isDragActive, isDragReject]
  );
  const forceUpdate = useForceUpdate();
  async function onSubmit(
    submittedValues,
    { setStatus, setSubmitting }: FormikActions<any>
  ) {
    try {
      const response = save();
      setFileId((await response).fileName);
      setStatus(acceptedFiles[0].name + " submitted successfully!");
      editMetadataVisible = true;
      forceUpdate();
    } catch (error) {
      setStatus(
        error.message + ", " + " submittedValues are: " + submittedValues
      );
    }
    setSubmitting(false);
  }

  /*send one file to service due to current implementation */
  async function save(): Promise<FileUploadResponse> {
    const formData = new FormData();
    formData.append("file", acceptedFiles[0]);
    const axiosResponse = await axios({
      data: formData,
      method: "post",
      url: "/api/v1/file/mybucket"
    });
    return axiosResponse.data;
  }

  return (
    <div>
      <div id="dndRoot">
        <div {...getRootProps({ style })} className="root">
          <input {...getInputProps()} />
          <div style={{ margin: "auto" }}>
            <div>
              <ObjectStoreMessage id="uploadFormInstructions" />
            </div>
          </div>
        </div>
        <div>
          <ul>{acceptedFilesItems}</ul>
        </div>
      </div>

      <div>
        <Formik
          initialValues={{ customButtonName: "Upload File" }}
          onSubmit={onSubmit}
        >
          <Form>
            <ErrorViewer />
            <div className="form-group row">
              <div className="col-md-2">
                <SubmitButton />
              </div>
            </div>
          </Form>
        </Formik>
        {editMetadataVisible &&
          acceptedFiles &&
          acceptedFiles.length > 0 &&
          fileId && (
            <EditMetadataFormPage
              originalFileName={acceptedFiles[0].name}
              fileIdentifier={fileId}
            />
          )}
      </div>
    </div>
  );
}
export default MediaUploadViewPage;
