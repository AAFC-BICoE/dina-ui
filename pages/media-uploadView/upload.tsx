import React, { useCallback, useMemo } from "react";
import { useDropzone } from "react-dropzone";
import ReactTable from "react-table";

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

const fileContent = new Map();

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
  const onDropAccepted = useCallback(dropAcceptedFiles => {
    dropAcceptedFiles.forEach(file => {
      const reader = new FileReader();
      const filename = file.name;
      reader.onabort = () =>
        // console.log("file reading was aborted");
        (reader.onerror = () =>
          // console.log("file reading has failed");
          (reader.onload = () => {
            const binaryStr = reader.result;
            fileContent.set(filename, binaryStr);
          }));
      reader.readAsDataURL(file);
    });
  }, []);

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragAccept,
    isDragReject,
    acceptedFiles
  } = useDropzone({ onDropAccepted, accept: "image/*,audio/*,video/*" });

  const style = useMemo(
    () => ({
      ...baseStyle,
      ...(isDragActive ? activeStyle : {}),
      ...(isDragAccept ? acceptStyle : {}),
      ...(isDragReject ? rejectStyle : {})
    }),
    [isDragActive, isDragReject]
  );

  files = acceptedFiles.map(file => ({ fileName: file.name }));
  return (
    <div className="container">
      <div {...getRootProps({ style })}>
        <input {...getInputProps()} />
        <p>Drag and drop files here or click to open browse dialog</p>
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
  );
}

export default MediaUploadView;
