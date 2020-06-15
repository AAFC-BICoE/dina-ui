import { FieldView } from "common-ui";
import { Formik } from "formik";
import { noop } from "lodash";
import { Metadata } from "types/objectstore-api/resources/Metadata";
import { DinaMessage } from "../intl/dina-ui-intl";

export function ViewMetadataFormPage(data) {
  return (
    <Formik<Metadata> initialValues={data.metadata} onSubmit={noop}>
      <div>
        <div className="row">
          <label className="col-md-3">
            <strong>
              <DinaMessage id="metadataFilenameLabel" />
            </strong>
          </label>
          <div className="col">
            <FieldView
              name="originalFilename"
              className="col-md-9 originalFilename"
              hideLabel={true}
            />
          </div>
        </div>
        <div className="row">
          <label className="col-md-3">
            <strong>
              <DinaMessage id="metadataObjectTypeLabel" />
            </strong>
          </label>
          <div className="col">
            <FieldView name="dcType" className="col-md-9" hideLabel={true} />
          </div>
        </div>
        <div className="row">
          <label className="col-md-3">
            <strong>
              <DinaMessage id="metadataDcFormatLabel" />
            </strong>
          </label>
          <div className="col">
            <FieldView name="dcFormat" className="col-md-9" hideLabel={true} />
          </div>
        </div>
        <div className="row">
          <label className="col-md-3">
            <strong>
              <DinaMessage id="field_acMetadataCreator.displayName" />
            </strong>
          </label>
          <div className="col">
            <FieldView
              className="col-md-9"
              name="acMetadataCreator.displayName"
              hideLabel={true}
            />
          </div>
        </div>
        <div className="row">
          <label className="col-md-3">
            <DinaMessage id="metadataFileIdentifierLabel" />
          </label>
          <div className="col">
            <FieldView
              className="col-md-9"
              name="fileIdentifier"
              hideLabel={true}
            />
          </div>
        </div>
        <div className="row">
          <label className="col-md-3">
            <DinaMessage id="metadataBucketNameLabel" />
          </label>
          <div className="col">
            <FieldView className="col-md-9" name="bucket" hideLabel={true} />
          </div>
        </div>
        <div className="row">
          <label className="col-md-3">
            <strong>
              <DinaMessage id="metadataFileExtensionLabel" />
            </strong>
          </label>
          <div className="col">
            <FieldView
              className="col-md-9"
              name="fileExtension"
              hideLabel={true}
            />
          </div>
        </div>
        <div className="row">
          <label className="col-md-3">
            <strong>
              <DinaMessage id="metadataHashFunctionLabel" />
            </strong>
          </label>
          <div className="col">
            <FieldView
              className="col-md-9"
              name="acHashFunction"
              hideLabel={true}
            />
          </div>
        </div>
        <div className="row">
          <label className="col-md-3">
            <strong>
              <DinaMessage id="metadataHashValueLabel" />
            </strong>
          </label>
          <div className="col">
            <FieldView
              className="col-md-9"
              name="acHashValue"
              hideLabel={true}
            />
          </div>
        </div>
        <div className="row">
          <label className="col-md-3">
            <strong>
              <DinaMessage id="metadataFirstDigitalVersionCreatedDateLabel" />
            </strong>
          </label>
          <div className="col">
            <FieldView
              className="col-md-9"
              name="acDigitizationDate"
              hideLabel={true}
            />
          </div>
        </div>
        <div className="row">
          <label className="col-md-3">
            <strong>
              <DinaMessage id="metadataLastMetadataModificationTimeLabel" />
            </strong>
          </label>
          <div className="col">
            <FieldView
              className="col-md-9"
              name="xmpMetadataDate"
              hideLabel={true}
            />
          </div>
        </div>
      </div>
    </Formik>
  );
}
export default ViewMetadataFormPage;
