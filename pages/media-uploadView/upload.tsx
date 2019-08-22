import React, { useMemo } from "react";
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

const activeStyle = {
  borderColor: "#2196f3"
};

const acceptStyle = {
  borderColor: "#00e676"
};

const rejectStyle = {
  borderColor: "#ff1744"
};

function MediaUploadView()  {
  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragAccept,
    isDragReject,
    acceptedFiles
  } = useDropzone({});

  const style = useMemo(
    () => ({
      ...baseStyle,
      ...(isDragActive ? activeStyle : {}),
      ...(isDragAccept ? acceptStyle : {}),
      ...(isDragReject ? rejectStyle : {})
    }),
    [isDragActive, isDragReject]
  );

  const files = acceptedFiles.map(file => ({ fileName: file.name }));

  return (
    <div className="container">
      <div {...getRootProps({ style })}>
        <input {...getInputProps()} />
        <p>Drag and drop files here or click to open browse dialog</p>
      </div>
      <ReactTable
        className="-striped"
        data={files ? files : null}
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