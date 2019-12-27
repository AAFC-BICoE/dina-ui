import {
  ApiClientContext,
  DateField,
  ErrorViewer,
  filterBy,
  ResourceSelectField,
  SelectField,
  serialize,
  SubmitButton,
  TextField
} from "common-ui";
import { Form, Formik, FormikActions } from "formik";
import { isArray } from "lodash";
import { useRouter } from "next/router";
import { useContext } from "react";
import { Agent } from "types/objectstore-api/resources/Agent";
import { AttributeBuilder } from "../components";
import { ObjectStoreMessage } from "../intl/objectstore-intl";
import { generateManagedAttributeValue } from "../utils/metaUtils";

export interface EditMetadataFormProps {
  originalFileName: string | string[];
  fileIdentifier: string | string[];
}

export function EditMetadataFormPage({
  originalFileName,
  fileIdentifier
}: EditMetadataFormProps) {
  return (
    <div>
      <div className="container-fluid">
        <div>
          <h5>
            <ObjectStoreMessage id="metadataFormTitle" />
          </h5>
          <EditMetadataForm
            originalFileName={originalFileName}
            fileIdentifier={fileIdentifier}
          />
        </div>
      </div>
    </div>
  );
}

function EditMetadataForm({
  originalFileName,
  fileIdentifier
}: EditMetadataFormProps) {
  const { apiClient } = useContext(ApiClientContext);
  const router = useRouter();

  const managedAttributes = [];
  const unManagedAttributes = [{ name: "unManaged", value: "unManaged" }];
  async function onSubmit(
    submittedValues,
    { setStatus, setSubmitting }: FormikActions<any>
  ) {
    try {
      const metaManagedAttributes = new Array();
      // add back the original file name, as this should always be there
      if (originalFileName) {
        submittedValues.originalFilename = isArray(originalFileName)
          ? originalFileName[0]
          : originalFileName;
      }
      if (fileIdentifier) {
        submittedValues.fileIdentifier = isArray(fileIdentifier)
          ? fileIdentifier[0]
          : fileIdentifier;
      }
      // this will be replaced by config?
      submittedValues.bucket = "mybucket";
      generateManagedAttributeValue(
        metaManagedAttributes,
        submittedValues,
        undefined
      );
      const config = {
        headers: {
          "Content-Type": "application/vnd.api+json",
          "Crnk-Compact": "true"
        }
      };
      const serializePromises = serialize({
        resource: submittedValues,
        type: "metadata"
      });
      const serialized = await serializePromises;
      let mydata = { data: serialized };
      const response = await apiClient.axios.post("/metadata", mydata, config);
      if (response.data.data) {
        const metaID = response.data.data.id;
        metaManagedAttributes.forEach(async a => {
          a.relationships.objectStoreMetadata.data.id = metaID;
          mydata = { data: a };
          await apiClient.axios.post(
            "/metadata-managed-attribute",
            mydata,
            config
          );
        });
        router.push("/media-uploadView/detailView?id=" + fileIdentifier);
      } else {
        setStatus(
          response && response.data
            ? response.data.errors[0].title +
                ": " +
                response.data.errors[0].detail
            : "Response or response.data is null!"
        );
      }
    } catch (error) {
      setStatus(error.message);
    }
    setSubmitting(false);
  }

  return (
    <Formik
      initialValues={{ customButtonName: "Save Metadata" }}
      onSubmit={onSubmit}
    >
      <Form>
        <ErrorViewer />
        <div className="form-group row" style={{ display: "none" }}>
          <label className="col-sm-2 col-form-label">
            <strong>
              <ObjectStoreMessage id="metadataFilenameLabel" />
            </strong>
          </label>
          <div className="col">
            <TextField
              name="originalFilename"
              className="col-sm-6 originalFilename"
              hideLabel={true}
              readOnly={true}
              initialValue={originalFileName}
            />
          </div>
        </div>
        <div className="form-group row">
          <label className="col-sm-2 col-form-label">
            <strong>
              <ObjectStoreMessage id="metadataObjectTypeLabel" />
            </strong>
          </label>
          <div className="col">
            <SelectField
              options={DC_TYPE_OPTIONS}
              name="dcType"
              className="col-sm-6 dcType"
              hideLabel={true}
            />
          </div>
        </div>
        <div className="form-group row">
          <label className="col-sm-2 col-form-label">
            <strong>
              <ObjectStoreMessage id="metadataFirstDigitalVersionCreatedDateLabel" />
            </strong>
          </label>
          <div className="col">
            <DateField
              className="col-sm-10"
              name="acDigitizationDate"
              hideLabel={true}
              showTime={true}
            />
          </div>
        </div>
        <div className="form-group row">
          <label className="col-sm-2 col-form-label">
            <strong>
              <ObjectStoreMessage id="metadataLastMetadataModificationTimeLabel" />
            </strong>
          </label>
          <div className="col">
            <DateField
              className="col-sm-10"
              name="xmpMetadataDate"
              hideLabel={true}
              showTime={true}
            />
          </div>
        </div>
        <div className="form-group row" style={{ display: "none" }}>
          <label className="col-sm-2 col-form-label">
            <strong>
              <ObjectStoreMessage id="metadataDcFormatLabel" />
            </strong>
          </label>
          <div className="col-sm-6">
            <TextField
              name="dcFormat"
              className="col-sm-6 dcFormat"
              hideLabel={true}
            />
          </div>
        </div>
        <div className="form-group row">
          <label className="col-sm-2 col-form-label">
            <strong>
              <ObjectStoreMessage id="metadataAgentLabel" />
            </strong>
          </label>
          <div className="col-sm-6">
            <ResourceSelectField<Agent>
              className="col-sm-6"
              name="acMetadataCreator"
              filter={filterBy(["displayName"])}
              model="agent"
              optionLabel={agent => agent.displayName}
              hideLabel={true}
            />
          </div>
        </div>
        <div className="form-group row">
          <div className="col col-md-6">
            <h6>
              <ObjectStoreMessage id="metadataManagedAttributesLabel" />
            </h6>
            <AttributeBuilder controlledAttributes={managedAttributes} />
          </div>
        </div>
        <div className="form-group row">
          <div className="col-md-4">
            <h6>
              <ObjectStoreMessage id="metadataTagsLabel" />
            </h6>
            <AttributeBuilder controlledAttributes={unManagedAttributes} />
          </div>
        </div>
        <SubmitButton />
      </Form>
    </Formik>
  );
}
const DC_TYPE_OPTIONS = [
  {
    label: "Image",
    value: "IMAGE"
  },
  {
    label: "Moving Image",
    value: "MOVING_IMAGE"
  },
  {
    label: "Sound",
    value: "SOUND"
  },
  {
    label: "Text",
    value: "TEXT"
  }
];

export default EditMetadataFormPage;
