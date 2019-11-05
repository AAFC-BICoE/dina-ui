import {
  ApiClientContext,
  ErrorViewer,
  filterBy,
  serialize,
  SubmitButton
} from "common-ui";
import { Form, Formik, FormikActions } from "formik";
import { WithRouterProps } from "next/dist/client/with-router";
import { NextRouter, withRouter } from "next/router";
import { useContext } from "react";
import { DateField, SelectField, TextField } from "../../lib";

import { Agent } from "types/objectstore-api/resources/Agent";
import { isArray } from "util";
import { AttributeBuilder, Head, Nav } from "../../components";
import { ResourceSelectField } from "../../lib/formik-connected/ResourceSelectField";

interface EditMetadataFormProps {
  router: NextRouter;
  originalFileName: string | string[];
}

export function EditMetadataFormPage({ router }: WithRouterProps) {
  const { fileName } = router.query;
  return (
    <div>
      <Head title="Add Metadata" />
      <Nav />
      <div className="container-fluid">
        <div>
          <h4>Edit Metadata</h4>
          <EditMetadataForm router={router} originalFileName={fileName} />
        </div>
      </div>
    </div>
  );
}

function EditMetadataForm({ originalFileName }: EditMetadataFormProps) {
  const { apiClient } = useContext(ApiClientContext);
  const managedAttributes = [];
  async function onSubmit(
    submittedValues,
    { setStatus, setSubmitting }: FormikActions<any>
  ) {
    try {
      const metaManagedAttributes = new Array();
      generateManagedAttributeValue(metaManagedAttributes, submittedValues);
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
      } else {
        setStatus(
          response.data.errors[0].title + ": " + response.data.errors[0].detail
        );
      }
    } catch (error) {
      setStatus(error.message);
    }
    setSubmitting(false);
  }

  function generateManagedAttributeValue(
    metaManagedAttributes,
    submittedValues
  ) {
    for (const x in submittedValues) {
      if (/^key_/.test(x) && submittedValues["assignedValue" + x.substr(4)]) {
        const metaManagedAttribute = {
          attributes: {
            assignedValue: submittedValues["assignedValue" + x.substr(4)]
          },
          relationships: {
            managedAttribute: {
              data: submittedValues[x]
            },
            objectStoreMetadata: {
              data: {
                id: "variable",
                type: "metadata"
              }
            }
          },
          type: "metadata-managed-attribute"
        };
        metaManagedAttributes.push(metaManagedAttribute);
        delete submittedValues[x];
        delete submittedValues["assignedValue" + x.substr(4)];
      }
    }
  }

  return (
    <Formik initialValues={{}} onSubmit={onSubmit}>
      <Form>
        <div className="form-group row">
          <label className="col-sm-2 col-form-label">
            <strong>FileName</strong>
          </label>
          <div className="col">
            <TextField
              name="originalFilename"
              className="col-sm-6"
              initialValue={
                isArray(originalFileName)
                  ? originalFileName[0]
                  : originalFileName
              }
            />
          </div>
        </div>
        <div className="form-group row">
          <label className="col-sm-2 col-form-label">
            <strong>DcType</strong>
          </label>
          <div className="col col-sm-6">
            <SelectField
              options={DC_TYPE_OPTIONS}
              name="dcType"
              className="dcType"
            />
          </div>
        </div>
        <div className="form-group row">
          <label className="col-sm-2 col-form-label">
            <strong>AcDigitizationDate</strong>
          </label>
          <div className="col">
            <DateField className="col-sm-10" name="acDigitizationDate" />
          </div>
        </div>
        <div className="form-group row">
          <label className="col-sm-2 col-form-label">
            <strong>XmpMetadataDate</strong>
          </label>
          <div className="col">
            <DateField className="col-sm-10" name="xmpMetadataDate" />
          </div>
        </div>
        <div className="form-group row">
          <label className="col-sm-2 col-form-label">
            <strong>DcFormat</strong>
          </label>
          <div className="col-sm-6">
            <TextField name="dcFormat" className="col-sm-6 dcFormat" />
          </div>
        </div>
        <div className="form-group row">
          <label className="col-sm-2 col-form-label">
            <strong>Agent</strong>
          </label>
          <div className="col-sm-6">
            <ResourceSelectField<Agent>
              className="col-sm-6"
              name="acMetadataCreator"
              filter={filterBy(["displayName"])}
              model="agent"
              optionLabel={agent => agent.displayName}
            />
          </div>
        </div>
        <h4> Edit Managed Attribute</h4>
        <div className="form-group row">
          <AttributeBuilder controlledAttributes={managedAttributes} />
        </div>
        <SubmitButton />
        <ErrorViewer />
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

export default withRouter(EditMetadataFormPage);
