import {
  ApiClientContext,
  DateField,
  ErrorViewer,
  filterBy,
  LoadingSpinner,
  Query,
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
import { useContext, useState } from "react";
import { Agent } from "types/objectstore-api/resources/Agent";
import { Metadata } from "types/objectstore-api/resources/Metadata";
import { isArray, isUndefined } from "util";
import { AttributeBuilder, Head, Nav } from "../../components";
import { MetaManagedAttribute } from "../../types/objectstore-api/resources/MetaManagedAttribute";
import { generateManagedAttributeValue } from "../../utils/metaUtils";

interface DetailEditFormProps {
  router: NextRouter;
}

const managedAttributes = [
  {
    ma_data: undefined,
    metama_data: undefined,
    name: "managed",
    value: "managed"
  }
];

export function DetailEditPage({ router }: WithRouterProps) {
  const id = router.query.id;
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
  const id = router.query.id;
  const { apiClient } = useContext(ApiClientContext);
  // To force rerender unpon all promises resolved
  // when all the related managed attributes data are returned
  const [editAttributesVisible, setEditAttributesVisible] = useState(false);
  // Record the tags data, to be expanded by actual data for the target file
  const unManagedAttributes = [{ name: "unManaged", value: "unManaged" }];
  // Wrapper function to avoid the react error of invalid children of promise
  function wrapper(mas) {
    getManagedAttributesData(mas);
  }

  // Organize the managed attributes with its assigned values for display purpose
  async function getManagedAttributesData(mas) {
    const promises = mas.map(ma => retrieveManagedAttributes(ma));
    await Promise.all(promises);
    // Shuffle manageAttributes to replace the value with the actual assignedValue of
    // the individual managed attribute for UI display.
    mas.map(ma => {
      managedAttributes.map(maa => {
        if (
          maa.metama_data &&
          maa.metama_data.data &&
          maa.metama_data.data.id === ma.id
        ) {
          maa.value = ma.assignedValue;
        }
      });
    });
    setEditAttributesVisible(true);
  }
  // Organize the tags data for display
  function generateTagsData(tags) {
    tags.map(tag =>
      unManagedAttributes.push({
        name: "fakeName",
        value: tag
      })
    );
  }
  // To retrieve the managed attibute based on the metadata managed attribute id
  // for the target file
  async function retrieveManagedAttributes(ma) {
    const path = "metadata-managed-attribute/" + ma.id;
    const getParams = omitBy<GetParams>(
      { include: "managedAttribute" },
      isUndefined
    );
    const metaManagedAttribute = await apiClient.get<
      MetaManagedAttribute,
      undefined
    >(path, getParams);
    managedAttributes.push({
      ma_data: metaManagedAttribute.data.managedAttribute,
      metama_data: metaManagedAttribute,
      name: "fake",
      value: "assignedValue"
    });
    return metaManagedAttribute;
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
      <Query<Metadata>
        query={{
          filter: { fileIdentifier: `${id}` },
          include: "acMetadataCreator,managedAttribute",
          path: "metadata/"
        }}
      >
        {({ loading, response }) => (
          <div className="col-sm-8">
            <LoadingSpinner loading={loading} />
            {response && (
              <div>
                <Formik initialValues={response.data[0]} onSubmit={onSubmit}>
                  <Form>
                    <ErrorViewer />
                    <SubmitButton />
                    <EditMetadataFormPage />
                    {response.data[0] &&
                      response.data[0].managedAttribute &&
                      wrapper(response.data[0].managedAttribute)}
                    {editAttributesVisible && (
                      <>
                        <div
                          style={{ marginBottom: "20px", marginTop: "20px" }}
                        >
                          <h5 style={{ color: "#1465b7" }}>
                            Managed Attributes
                          </h5>
                        </div>
                        <AttributeBuilder
                          controlledAttributes={managedAttributes}
                        />
                      </>
                    )}

                    {response.data[0] &&
                      response.data[0].acTags &&
                      generateTagsData(response.data[0].acTags)}
                    <div style={{ marginBottom: "20px", marginTop: "20px" }}>
                      <h5 style={{ color: "#1465b7" }}>Tags</h5>
                    </div>
                    <AttributeBuilder
                      controlledAttributes={unManagedAttributes}
                    />
                  </Form>
                </Formik>
              </div>
            )}
          </div>
        )}
      </Query>
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
