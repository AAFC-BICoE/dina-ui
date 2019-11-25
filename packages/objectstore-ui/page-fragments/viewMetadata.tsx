import { FieldView } from "common-ui";
import { Formik } from "formik";
import { noop } from "lodash";
import { Metadata } from "types/objectstore-api/resources/Metadata";

export function ViewMetadataFormPage(data) {
  return (
    <Formik<Metadata> initialValues={data.metadata} onSubmit={noop}>
      <div>
        <div className="row">
          <label className="col-sm-2">
            <strong>File Name</strong>
          </label>
          <div className="col">
            <FieldView
              name="originalFilename"
              className="col-sm-6 originalFilename"
              hideLabel={true}
            />
          </div>
        </div>
        <div className="row">
          <label className="col-sm-2">
            <strong>Stored Object Type</strong>
          </label>
          <div className="col">
            <FieldView name="dcType" className="col-sm-6" hideLabel={true} />
          </div>
        </div>
        <div className="row">
          <label className="col-sm-2">
            <strong>First Digital Version Created Date</strong>
          </label>
          <div className="col">
            <FieldView
              className="col-sm-6"
              name="acDigitizationDate"
              hideLabel={true}
            />
          </div>
        </div>
        <div className="row">
          <label className="col-sm-2">
            <strong>Last Metadata Modification Time</strong>
          </label>
          <div className="col">
            <FieldView
              className="col-sm-6"
              name="xmpMetadataDate"
              hideLabel={true}
            />
          </div>
        </div>
        <div className="row">
          <label className="col-sm-2">
            <strong>DcFormat</strong>
          </label>
          <div className="col">
            <FieldView name="dcFormat" className="col-sm-6" hideLabel={true} />
          </div>
        </div>
        <div className="row">
          <label className="col-sm-2">
            <strong>Agent(Uploaded By)</strong>
          </label>
          <div className="col">
            <FieldView
              className="col-sm-6"
              name="acMetadataCreator.displayName"
              hideLabel={true}
            />
          </div>
        </div>
        <div className="row">
          <label className="col-sm-2">
            <strong>Hash Function</strong>
          </label>
          <div className="col">
            <FieldView
              className="col-sm-6"
              name="acHashFunction"
              hideLabel={true}
            />
          </div>
        </div>
        <div className="row">
          <label className="col-sm-2">
            <strong>Hash Value</strong>
          </label>
          <div className="col">
            <FieldView
              className="col-sm-6"
              name="acHashValue"
              hideLabel={true}
            />
          </div>
        </div>
        <div className="row">
          <label className="col-sm-2">
            <strong>File Identifier </strong>
          </label>
          <div className="col">
            <FieldView
              className="col-sm-6"
              name="fileIdentifier"
              hideLabel={true}
            />
          </div>
        </div>
        <div className="row">
          <label className="col-sm-2">
            <strong>Bucket Name</strong>
          </label>
          <div className="col">
            <FieldView className="col-sm-6" name="bucket" hideLabel={true} />
          </div>
        </div>
        <div className="row">
          <label className="col-sm-2">
            <strong>File Extension</strong>
          </label>
          <div className="col">
            <FieldView
              className="col-sm-6"
              name="fileExtension"
              hideLabel={true}
            />
          </div>
        </div>
      </div>
    </Formik>
  );
}
export default ViewMetadataFormPage;
