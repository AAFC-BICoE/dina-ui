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
import {
  deleteManagedAttribute,
  generateManagedAttributeValue
} from "../../utils/metaUtils";

interface DetailEditFormProps {
  router: NextRouter;
}

export function DetailEditPage({ router }: WithRouterProps) {
  const id = router?.query?.id;
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

function DetailEditForm({ router }: DetailEditFormProps) {
  const id = router?.query?.id;
  const { apiClient } = useContext(ApiClientContext);
  const [metainitialValues, setMetainitialValues] = useState({});
  let metainitialValues1 = {};
  const unManagedCtrl = new Array();
  unManagedCtrl.push({ name: "unManaged", value: "unManaged" });
  const managedCtrl = new Array();
  managedCtrl.push({
    ma_data: undefined,
    metama_data: undefined,
    name: "managed",
    value: "managed"
  });

  if (!Object.keys(metainitialValues).length) {
    wrapper();
  }

  async function wrapper() {
    await retrieveMetadata();
  }

  /* tslint:disable:no-string-literal */
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
    if (metadata && metadata.data[0]) {
      metainitialValues1 = metadata.data[0];
      metainitialValues1["unManagedAttributes"] = unManagedCtrl;
      metainitialValues1["managedAttributes"] = managedCtrl;
      let i = 10;
      // Filling the unmanaged attributes for UI control attributes for backplay
      // the generation of acTags with initial values
      if (metadata.data[0].acTags) {
        metadata.data[0].acTags.map(acTag => {
          metainitialValues1["unManagedAttributes"].push({
            name: acTag,
            value: "" + i
          });
          metainitialValues1["assignedValue_un" + i++] = acTag;
        });
      }
      // Filling the managed attributes for UI control attributes for backplay
      // the generation of managed attributes with initial values
      if (metadata.data[0].managedAttribute) {
        let metaManagedAttributes: MetaManagedAttribute[];
        metaManagedAttributes = await getManagedAttributesData(
          metadata.data[0].managedAttribute
        );

        metaManagedAttributes.map(metaMa => {
          metainitialValues1["key_" + i] = metaMa["data"]["managedAttribute"];
          metainitialValues1["assignedValue" + i] =
            metaMa["data"]["assignedValue"];

          metainitialValues1["managedAttributes"].push({
            ma_data: metaMa["data"]["managedAttribute"],
            metama_data: metaMa,
            name: "key_" + i,
            value: "" + i++
          });
        });
      }
      setMetainitialValues(metainitialValues1);
    }
  }
  /* tslint:enable:no-string-literal */

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
    { setStatus, setSubmitting, resetForm }: FormikActions<any>
  ) {
    const prevSubmitteValues = {};
    Object.assign(prevSubmitteValues, submittedValues);
    delete submittedValues.managedAttributes;
    delete submittedValues.unManagedAttributes;
    delete submittedValues.managedAttribute;
    const config = {
      headers: {
        "Content-Type": "application/vnd.api+json",
        "Crnk-Compact": "true"
      }
    };
    const mydata = deleteManagedAttribute(submittedValues, metainitialValues1);
    try {
      const resps = await apiClient.axios.post(
        "/managed-attribute-map",
        mydata,
        config
      );
      const metaManagedAttributes = new Array();
      if (id) {
        submittedValues.fileIdentifier = isArray(id) ? id[0] : id;
      }
      /* tslint:disable:no-string-literal */
      generateManagedAttributeValue(
        metaManagedAttributes,
        submittedValues,
        metainitialValues["managedAttributes"]
      );
      /* tslint:enable:no-string-literal */
      const serializePromises = serialize({
        resource: submittedValues,
        type: "metadata"
      });
      const serialized = await serializePromises;
      const metadata = { data: serialized };
      const response = await apiClient.axios.patch(
        "/metadata/" + metadata.data.id,
        metadata,
        config
      );
      if (response.data.data) {
        router.push("/media-uploadView/detailView?id=" + id);
      } else {
        resetForm(prevSubmitteValues);
        setStatus(
          response && response.data
            ? response.data.errors[0].title +
                ": " +
                response.data.errors[0].detail
            : "Response or response.data is null!"
        );
      }
    } catch (error) {
      resetForm(prevSubmitteValues);
      setStatus(error.message);
    }
    setSubmitting(false);
  }
  return (
    /* tslint:disable:no-string-literal */
    <div>
      <div className="col-sm-8">
        {Object.keys(metainitialValues).length > 0 &&
          Object.assign(metainitialValues1, metainitialValues) && (
            <div>
              <Formik
                initialValues={metainitialValues}
                onSubmit={onSubmit}
                enableReinitialize={true}
              >
                <Form>
                  <ErrorViewer />
                  <SubmitButton />
                  <EditMetadataFormPage />
                  <div>
                    <div style={{ marginBottom: "20px", marginTop: "20px" }}>
                      <h5 style={{ color: "#1465b7" }}>Managed Attributes</h5>
                    </div>
                    <AttributeBuilder
                      controlledAttributes={
                        metainitialValues["managedAttributes"]
                      }
                      initValues={metainitialValues}
                    />
                    <div style={{ marginBottom: "20px", marginTop: "20px" }}>
                      <h5 style={{ color: "#1465b7" }}>Tags</h5>
                    </div>
                    <AttributeBuilder
                      controlledAttributes={
                        metainitialValues["unManagedAttributes"]
                      }
                      initValues={metainitialValues}
                    />
                  </div>
                </Form>
              </Formik>
            </div>
          )}
      </div>
    </div>
    /* tslint:enable:no-string-literal */
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
