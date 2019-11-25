import { FieldView } from "common-ui";
import { Formik } from "formik";
import { noop } from "lodash";
import { Metadata } from "types/objectstore-api/resources/Metadata";

export function ViewMetadataFormPage(data) {
  return (
    <Formik<Metadata> initialValues={data.metadata} onSubmit={noop}>
      <div>
        <div className="form-group row">
          <label className="col-sm-2 col-form-label">
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
        <div className="form-group row">
          <label className="col-sm-2 col-form-label">
            <strong>Stored Object Type</strong>
          </label>
          <div className="col">
            <FieldView
              name="dcType"
              className="col-sm-6 dcType"
              hideLabel={true}
            />
          </div>
        </div>
        <div className="form-group row">
          <label className="col-sm-2 col-form-label">
            <strong>First Digital Version Created Date</strong>
          </label>
          <div className="col">
            <FieldView
              className="col-sm-10"
              name="acDigitizationDate"
              hideLabel={true}
            />
          </div>
        </div>
        <div className="form-group row">
          <label className="col-sm-2 col-form-label">
            <strong>Last Metadata Modification Time</strong>
          </label>
          <div className="col">
            <FieldView
              className="col-sm-10"
              name="xmpMetadataDate"
              hideLabel={true}
            />
          </div>
        </div>
        <div className="form-group row">
          <label className="col-sm-2 col-form-label">
            <strong>DcFormat</strong>
          </label>
          <div className="col-sm-6">
            <FieldView
              name="dcFormat"
              className="col-sm-6 dcFormat"
              label="dcFormat"
              hideLabel={true}
            />
          </div>
        </div>
        <div className="form-group row">
          <label className="col-sm-2 col-form-label">
            <strong>Agent(Uploaded By)</strong>
          </label>
          <div className="col-sm-6">
            <FieldView
              className="col-sm-6"
              name="acMetadataCreator.displayName"
              hideLabel={true}
            />
          </div>
        </div>
      </div>
    </Formik>
  );
}
export default ViewMetadataFormPage;
