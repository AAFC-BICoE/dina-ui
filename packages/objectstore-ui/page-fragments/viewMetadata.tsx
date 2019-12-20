import { FieldView } from "common-ui";
import { Formik } from "formik";
import { noop } from "lodash";
import { Metadata } from "types/objectstore-api/resources/Metadata";
import { ObjectStoreMessage } from "../intl/objectstore-intl";

export function ViewMetadataFormPage(data) {
  return (
    <Formik<Metadata> initialValues={data.metadata} onSubmit={noop}>
      <div>
        <div className="row">
          <label className="col-sm-2">
            <strong>
              <ObjectStoreMessage id="metadataFilenameLabel" />
            </strong>
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
            <strong>
              <ObjectStoreMessage id="metadataObjectTypeLabel" />
            </strong>
          </label>
          <div className="col">
            <FieldView name="dcType" className="col-sm-6" hideLabel={true} />
          </div>
        </div>
        <div className="row">
          <label className="col-sm-2">
            <strong>
              <ObjectStoreMessage id="metadataFirstDigitalVersionCreatedDateLabel" />
            </strong>
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
            <strong>
              <ObjectStoreMessage id="metadataLastMetadataModificationTimeLabel" />
            </strong>
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
            <strong>
              <ObjectStoreMessage id="metadataDcFormatLabel" />
            </strong>
          </label>
          <div className="col">
            <FieldView name="dcFormat" className="col-sm-6" hideLabel={true} />
          </div>
        </div>
        <div className="row">
          <label className="col-sm-2">
            <strong>
              <ObjectStoreMessage id="metadataAgentLabel" />
            </strong>
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
            <strong>
              <ObjectStoreMessage id="metadataHashFunctionLabel" />
            </strong>
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
            <strong>
              <ObjectStoreMessage id="metadataHashValueLabel" />
            </strong>
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
            <strong>
              <ObjectStoreMessage id="metadataFileIdentifierLabel" />{" "}
            </strong>
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
            <strong>
              <ObjectStoreMessage id="metadataBucketNameLabel" />
            </strong>
          </label>
          <div className="col">
            <FieldView className="col-sm-6" name="bucket" hideLabel={true} />
          </div>
        </div>
        <div className="row">
          <label className="col-sm-2">
            <strong>
              <ObjectStoreMessage id="metadataFileExtensionLabel" />
            </strong>
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
