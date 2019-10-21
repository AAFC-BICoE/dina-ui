import axios from "axios";
import FormData from "form-data";
import { Form, Formik, FormikActions } from "formik";
import React, { useMemo } from "react";
import { useDropzone } from "react-dropzone";
import ReactTable from "react-table";
import { ButtonBar, ErrorViewer, SubmitButton } from "../../components";

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

let files;

function MediaUploadView({}) {
  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragAccept,
    isDragReject,
    acceptedFiles
  } = useDropzone({
    accept: "image/*,audio/*,video/*,.pdf,.doc,docx"
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

  files = acceptedFiles.map(file => ({
    fileName: file.name
  }));

  async function onSubmit(
    submittedValues,
    { setStatus, setSubmitting }: FormikActions<any>
  ) {
    try {
      save();
    } catch (error) {
      setStatus(error.message + submittedValues);
    }
    setSubmitting(false);
  }
  /*send one file to service due to current implementation */
  function save() {
    const formData = new FormData();
    formData.append("file", acceptedFiles[0]);
    axios({
      data: formData,
      method: "post",
      url: "/api/v1/file/mybucket"
    });
  }

  return (
    <Formik initialValues={acceptedFiles} onSubmit={onSubmit}>
      <Form>
        <ButtonBar>
          <SubmitButton />
        </ButtonBar>
        <ErrorViewer />
        <div id="dndRoot">
          <div {...getRootProps({ style })} className="container">
            <input {...getInputProps()} />
            <div>
              <div>Drag and drop files here or click to open browse dialog</div>
              <div>
                (Only image, audio, video, .pdf, .doc and docx are accepted)
              </div>
            </div>
          </div>
          <ReactTable
            className="-striped"
            data={files}
            columns={[
              {
                Header: "File Name",
                accessor: "fileName"
              },
              {
                Cell: () => {
                  return <input type="checkbox" />;
                },
                Header: "Select items"
              }
            ]}
          />
        </div>
      </Form>
    </Formik>
  );
}

export default MediaUploadView;
