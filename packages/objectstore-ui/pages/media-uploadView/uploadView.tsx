// import { Head, Nav, ButtonBar } from "../../components";
import { SubmitButton } from "common-ui";
import { Form, Formik, FormikActions } from "formik";
import { WithRouterProps } from "next/dist/client/with-router";
import { NextRouter } from "next/router";
import React, { useMemo } from "react";
import { useDropzone } from "react-dropzone";

interface UploadViewFormProps {
  router: NextRouter;
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

function MediaUploadViewPage({ router }: WithRouterProps) {
  return (
    <div>
      <div className="container-fluid">
        <div>
          <h1>Upload View Form Page</h1>
          <UploadViewForm router={router} />
        </div>
      </div>
    </div>
  );
}

function UploadViewForm({ router }: UploadViewFormProps) {
  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragAccept,
    isDragReject
    // acceptedFiles
  } = useDropzone({
    accept: "image/*,audio/*,video/*,.pdf,.doc,docx,.png"
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
  async function onSubmit(
    submittedValues,
    { setStatus, setSubmitting }: FormikActions<any>
  ) {
    try {
      router.push(`/media-uploadView/uploadEdit`);
    } catch (error) {
      setStatus(
        error.message + ", " + " submittedValues are: " + submittedValues
      );
      setSubmitting(false);
    }
  }

  return (
    <Formik initialValues={router} onSubmit={onSubmit}>
      <Form>
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
          <SubmitButton />
        </div>
      </Form>
    </Formik>
  );
}

export default MediaUploadViewPage;
