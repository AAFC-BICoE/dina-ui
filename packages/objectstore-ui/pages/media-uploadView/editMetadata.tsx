import {
  ApiClientContext,
  ErrorViewer,
  filterBy,
  ResourceSelectField,
  serialize,
  SubmitButton,
  TextField
} from "common-ui";
import { DateField, SelectField } from "common-ui";
import { Form, Formik, FormikActions } from "formik";
import { WithRouterProps } from "next/dist/client/with-router";
import { NextRouter, withRouter } from "next/router";
import { useContext } from "react";

import { isArray } from "lodash";
import { Agent } from "types/objectstore-api/resources/Agent";
import { AttributeBuilder, Head, Nav } from "../../components";

interface EditMetadataFormProps {
  router: NextRouter;
  originalFileName: string | string[];
  fileIdentifier: string | string[];
}

export function EditMetadataFormPage({ router }: WithRouterProps) {
  const { fileName, fileId } = router.query;
  return (
    <div>
      <Head title="Add Metadata" />
      <Nav />
      <div className="container-fluid">
        <div>
          <h4>Edit Metadata</h4>
          <EditMetadataForm
            router={router}
            originalFileName={fileName}
            fileIdentifier={fileId}
          />
        </div>
      </div>
    </div>
  );
}

function EditMetadataForm({
  originalFileName,
  fileIdentifier,
  router
}: EditMetadataFormProps) {
  const { apiClient } = useContext(ApiClientContext);
  const managedAttributes = [];
  const unManagedAttributes = [
    { name: "unManagedAttribute", value: "unManagedValue" }
  ];
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

        router.push("/media-uploadView/detailView?id=" + fileIdentifier);
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
    const acTags = new Set();
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
      } else if (/^assignedValue_un/.test(x) && submittedValues[x]) {
        acTags.add(submittedValues[x]);
        delete submittedValues[x];
      }
    }
    if (acTags.size > 0) {
      submittedValues.acTags = acTags;
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
              className="col-sm-6 originalFilename"
              hideLabel={true}
              readOnly={true}
              initialValue={originalFileName}
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
              hideLabel={true}
            />
          </div>
        </div>
        <div className="form-group row">
          <label className="col-sm-2 col-form-label">
            <strong>AcDigitizationDate</strong>
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
            <strong>XmpMetadataDate</strong>
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
        <div className="form-group row">
          <label className="col-sm-2 col-form-label">
            <strong>DcFormat</strong>
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
            <strong>Agent</strong>
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

        <div className="row">
          <div className="col-sm-6 ">
            <h4> Edit Managed Attribute</h4>
            <AttributeBuilder controlledAttributes={managedAttributes} />
          </div>
          <div className="col-sm-4">
            <h4> Edit UnManaged Attribute</h4>
            <AttributeBuilder controlledAttributes={unManagedAttributes} />
          </div>
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
