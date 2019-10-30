import { ApiClientContext, filterBy, SubmitButton } from "common-ui";
import { Form, Formik, FormikActions } from "formik";
import { WithRouterProps } from "next/dist/client/with-router";
import { NextRouter, withRouter } from "next/router";
import { useContext } from "react";
import { DateField, SelectField, TextField } from "../../lib";

import { Agent } from "types/objectstore-api/resources/Agent";
import { isArray } from "util";
import { Head } from "../../components";
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

      <div className="container-fluid">
        <div>
          <h1>Edit Metadata</h1>
          <EditMetadataForm router={router} originalFileName={fileName} />
        </div>
      </div>
    </div>
  );
}

function EditMetadataForm({ router, originalFileName }: EditMetadataFormProps) {
  const { apiClient } = useContext(ApiClientContext);

  async function onSubmit(
    submittedValues,
    { setStatus, setSubmitting }: FormikActions<any>
  ) {
    try {
      const data = {
        attributes: submittedValues,
        type: "metadata"
      };

      const config = {
        headers: {
          "Content-Type": "application/vnd.api+json",
          "Crnk-Compact": "true"
        }
      };
      apiClient.axios.post("/metadata", { data }, config);
      router.push(`/media-uploadView/editManagedAttribute`);
    } catch (error) {
      setStatus(error.message);
    }
    setSubmitting(false);
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
              className="col-sm-10"
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
          <div className="col">
            <SelectField options={DC_TYPE_OPTIONS} name="dcType" />
          </div>
        </div>
        <div className="form-group row">
          <label className="col-sm-2 col-form-label">
            <strong>acDigitizationDate</strong>
          </label>
          <div className="col">
            <DateField className="col-sm-10" name="acDigitizationDate" />
          </div>
        </div>
        <div className="form-group row">
          <label className="col-sm-2 col-form-label">
            <strong>xmpMetadataDate</strong>
          </label>
          <div className="col">
            <DateField className="col-sm-10" name="xmpMetadataDate" />
          </div>
        </div>
        <div className="form-group row">
          <label className="col-sm-2 col-form-label">
            <strong>DcFormat</strong>
          </label>
          <div className="col">
            <TextField name="dcFormat" className="col-sm-10" />
          </div>
        </div>
        <div className="form-group row">
          <label className="col-sm-2 col-form-label">
            <strong>Agent</strong>
          </label>
          <div className="col">
            <ResourceSelectField<Agent>
              className="col-sm-5"
              name="acMetadataCreator"
              filter={filterBy(["displayName"])}
              model="agent"
              optionLabel={agent => agent.displayName}
            />
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

export default withRouter(EditMetadataFormPage);
