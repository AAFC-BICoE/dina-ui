import React, { useMemo } from "react";
import { useDropzone } from "react-dropzone";
import { Head } from "../../components";

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

function MediaUploadViewPage() {
  return (
    <div>
      <Head title="Upload files" />
      <div className="container-fluid">
        <div>
          <h1>Upload File</h1>
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

  return (
    <div id="dndRoot">
      <div {...getRootProps({ style })} className="container root">
        <input {...getInputProps()} />
        <div>
          <div>Drag and drop files here or click to open browse dialog</div>
          <div>
            (Only image, audio, video, .pdf, .doc and docx are accepted)
          </div>
        </div>
      </div>
      <div className="container">
        <ul>{acceptedFilesItems}</ul>
      </div>

      <div className="container">
        <div className="row">
          <div className="col-md-2">
            {acceptedFiles && acceptedFiles.length > 0 ? (
              <a
                href={`/media-uploadView/editMetadata?fileName=${acceptedFiles[0].name}`}
                className="btn btn-info"
                role="button"
              >
                Edit Metadata
              </a>
            ) : (
              <a
                href={`/media-uploadView/editMetadata`}
                className="btn btn-info"
                role="button"
              >
                Edit Metadata
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MediaUploadViewPage;
