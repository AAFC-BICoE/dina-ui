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
import { GetParams } from "kitsu";
import { omitBy } from "lodash";
import withRouter, { WithRouterProps } from "next/dist/client/with-router";
import { NextRouter } from "next/router";
import React, { useContext, useState } from "react";
import { Agent } from "types/objectstore-api/resources/Agent";
import { isArray, isUndefined } from "util";
import { AttributeBuilder, Head, Nav } from "../../components";
import { MetaManagedAttribute } from "../../types/objectstore-api/resources/MetaManagedAttribute";
import { generateManagedAttributeValue } from "../../utils/metaUtils";

interface DetailEditFormProps {
  router: NextRouter;
}

export function DetailEditPage({ router }: WithRouterProps) {
  const id = router?.query;
  return (
    <div>
      <Head title="Object Store Detailes Edit Page" />
      <Nav />
      <div className="container-fluid">
        <div>
          <h5 style={{ color: "#1465b7" }}>Detail Edit</h5>
          {id && <DetailEditForm router={router} />}
        </div>
      </div>
    </div>
  );
}

let metainitialValues = {};
const unManagedAttributes = [{ name: "unManaged", value: "unManaged" }];
const managedAttributes = [
  {
    ma_data: undefined,
    metama_data: undefined,
    name: "managed",
    value: "managed"
  }
];

function DetailEditForm({ router }: DetailEditFormProps) {
  const id = router.query.id;
  const { apiClient } = useContext(ApiClientContext);
  const [editAttributesVisible, setEditAttributesVisible] = useState(false);

  if (!Object.keys(metainitialValues).length) {
    wrapper();
  }

  async function wrapper() {
    await retrieveMetadata();
  }

  async function retrieveMetadata() {
    const path = "metadata";
    const getParams = omitBy<GetParams>(
      {
        filter: { fileIdentifier: `${id}` },
        include: "acMetadataCreator,managedAttribute"
      },
      isUndefined
    );
    const metadata = await apiClient.get<any, undefined>(path, getParams);

    if (metadata && metadata.data[0] && metadata.data[0].managedAttribute) {
      metainitialValues = metadata.data[0];
      let i = 10;
      // Filling the managed attributes for UI control attributes for backplay
      // the generation of acTags with initial values
      metadata.data[0].acTags.map(acTag => {
        unManagedAttributes.push({
          name: acTag,
          value: "" + i
        });
        metainitialValues["assignedValue_un" + i++] = acTag;
      });
      // Filling the managed attributes for UI control attributes for backplay
      // the generation of managed attributes with initial values
      let metaManagedAttributes: MetaManagedAttribute[];
      metaManagedAttributes = await getManagedAttributesData(
        metadata.data[0].managedAttribute
      );

      /* tslint:disable:no-string-literal */
      metaManagedAttributes.map(metaMa => {
        metainitialValues["key_" + i] = metaMa["data"]["managedAttribute"];
        metainitialValues["assignedValue" + i] =
          metaMa["data"]["assignedValue"];

        managedAttributes.push({
          ma_data: undefined,
          metama_data: undefined,
          name: "key_" + i,
          value: "" + i++
        });
      });
      /* tslint:enable:no-string-literal */
      if (Object.keys(metainitialValues).length) {
        setEditAttributesVisible(true);
      }
    }
  }

  async function getManagedAttributesData(mas) {
    const promises = mas.map(ma => retrieveManagedAttrs(ma));
    const metaAttrs: MetaManagedAttribute[] = await Promise.all(promises);
    return metaAttrs;
  }
  async function retrieveManagedAttrs(ma) {
    const path = "metadata-managed-attribute/" + ma.id;
    const getParams = omitBy<GetParams>(
      { include: "managedAttribute" },
      isUndefined
    );
    return await apiClient.get<MetaManagedAttribute, undefined>(
      path,
      getParams
    );
  }
  async function onSubmit(
    submittedValues,
    { setStatus, setSubmitting }: FormikActions<any>
  ) {
    try {
      const metaManagedAttributes = new Array();
      if (id) {
        submittedValues.fileIdentifier = isArray(id) ? id[0] : id;
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
      const response = await apiClient.axios.patch("/metadata", mydata, config);
      if (response.data.data) {
        const metaID = response.data.data.id;
        metaManagedAttributes.forEach(async a => {
          a.relationships.objectStoreMetadata.data.id = metaID;
          mydata = { data: a };
          await apiClient.axios.patch(
            "/metadata-managed-attribute",
            mydata,
            config
          );
        });
        router.push("/media-uploadView/detailView?id=" + id);
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
    <div>
      <div className="col-sm-8">
        {editAttributesVisible && (
          <div>
            <Formik
              initialValues={metainitialValues}
              onSubmit={onSubmit}
              enableReinitialize={false}
            >
              <Form>
                <ErrorViewer />
                <SubmitButton />
                <EditMetadataFormPage />
                <div>
                  <div style={{ marginBottom: "20px", marginTop: "20px" }}>
                    <h5 style={{ color: "#1465b7" }}>Managed Attributes</h5>
                  </div>
                  <AttributeBuilder controlledAttributes={managedAttributes} />
                  <div style={{ marginBottom: "20px", marginTop: "20px" }}>
                    <h5 style={{ color: "#1465b7" }}>Tags</h5>
                  </div>
                  <AttributeBuilder
                    controlledAttributes={unManagedAttributes}
                  />
                </div>
              </Form>
            </Formik>
          </div>
        )}
      </div>
    </div>
  );
}

function EditMetadataFormPage() {
  return (
    <div>
      <div style={{ marginBottom: "20px", marginTop: "20px" }}>
        <h5 style={{ color: "#1465b7" }}>Metadata</h5>
      </div>
      <div className="form-group row">
        <label className="col-sm-2 col-form-label">
          <strong>Stored Object Type</strong>
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
          <strong>First Digital Version Created Date</strong>
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
          <strong>Last Metadata Modification Time</strong>
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
          <strong>Agent(Uploaded By)</strong>
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
        <label className="col-sm-2">
          <strong>Hash Function</strong>
        </label>
        <div className="col">
          <TextField
            className="col-sm-6"
            name="acHashFunction"
            hideLabel={true}
            readOnly={true}
          />
        </div>
      </div>
      <div className="form-group row">
        <label className="col-sm-2">
          <strong>Hash Value</strong>
        </label>
        <div className="col">
          <TextField
            className="col-sm-6"
            name="acHashValue"
            hideLabel={true}
            readOnly={true}
          />
        </div>
      </div>
      <div className="form-group row">
        <label className="col-sm-2">
          <strong>File Identifier </strong>
        </label>
        <div className="col">
          <TextField
            className="col-sm-6"
            name="fileIdentifier"
            hideLabel={true}
            readOnly={true}
          />
        </div>
      </div>
      <div className="form-group row">
        <label className="col-sm-2">
          <strong>Bucket Name</strong>
        </label>
        <div className="col">
          <TextField
            className="col-sm-6"
            name="bucket"
            hideLabel={true}
            readOnly={true}
          />
        </div>
      </div>
      <div className="form-group row">
        <label className="col-sm-2">
          <strong>File Extension</strong>
        </label>
        <div className="col">
          <TextField
            className="col-sm-6"
            name="fileExtension"
            hideLabel={true}
            readOnly={true}
          />
        </div>
      </div>
      <div className="form-group row">
        <label className="col-sm-2 col-form-label">
          <strong>File Name</strong>
        </label>
        <div className="col">
          <TextField
            name="originalFilename"
            className="col-sm-6 originalFilename"
            hideLabel={true}
            readOnly={true}
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
            readOnly={true}
          />
        </div>
      </div>
    </div>
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

export default withRouter(DetailEditPage);
