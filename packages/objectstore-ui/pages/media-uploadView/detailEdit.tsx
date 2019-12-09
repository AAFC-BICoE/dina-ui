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
import withRouter, { WithRouterProps } from "next/dist/client/with-router";
import { NextRouter } from "next/router";
import { useContext } from "react";
import { Agent } from "types/objectstore-api/resources/Agent";
import { Metadata } from "types/objectstore-api/resources/Metadata";
import { isArray } from "util";
import { AttributeBuilder, Head, Nav } from "../../components";
import { generateManagedAttributeValue } from "../../utils/metaUtils";

interface DetailEditFormProps {
  router: NextRouter;
}

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
  const managedAttributes = [{ name: "managed", value: "managed" }];

  const unManagedAttributes = [{ name: "unManaged", value: "unManaged" }];

  function generateTagsData(tags) {
    tags.map(tag =>
      unManagedAttributes.push({
        name: "fakeName",
        value: tag
      })
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
                    <AttributeBuilder
                      controlledAttributes={managedAttributes}
                    />
                    {response.data[0] &&
                      generateTagsData(response.data[0].acTags)}
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
