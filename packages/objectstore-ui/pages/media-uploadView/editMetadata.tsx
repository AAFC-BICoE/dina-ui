import { ApiClientContext, SubmitButton } from "common-ui";
import { Form, Formik, FormikActions } from "formik";
import { WithRouterProps } from "next/dist/client/with-router";
import { NextRouter, withRouter } from "next/router";
import { useContext } from "react";
import { DateField, SelectField, TextField } from "../../lib";

import ReactTable from "react-table";
import { Head } from "../../components";

interface UploadEditFormProps {
  router: NextRouter;
}

export function UploadEditFormPage({ router }: WithRouterProps) {
  return (
    <div>
      <Head title="Add Metadata" />

      <div className="container-fluid">
        <div>
          <h1>Edit Metadata</h1>
          <UploadEditForm router={router} />
        </div>
      </div>
    </div>
  );
}

function UploadEditForm({  }: UploadEditFormProps) {
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
    } catch (error) {
      setStatus(error.message);
      setSubmitting(false);
    }
  }

  const metadata = [
    {
      name: "dcFormat",
      value: "dcFormat"
    },
    {
      name: "dcType",
      value: "dcType"
    },
    {
      name: "OffsetDateTime",
      value: ""
    },
    {
      name: "xmpMetadataDate",
      value: ""
    }
  ];

  const columns = [
    {
      Header: "Property Name",
      accessor: "name"
    },
    {
      Cell: ({ original }) => {
        const key: string = original.name;
        if (key === "dcType") {
          return (
            <SelectField
              options={DC_TYPE_OPTIONS}
              name={key}
              className="col-md-2"
            />
          );
        } else if (key.endsWith("Date") || key.endsWith("Time")) {
          return <DateField className="col-md-2" name={key} />;
        } else {
          return <TextField name={key} className="col-md-2" />;
        }
      },
      Header: "Property Value",
      Style: { height: "100px" }
    }
  ];

  return (
    <Formik initialValues={{}} onSubmit={onSubmit}>
      <Form>
        <SubmitButton />
        <div style={{ width: "50%" }}>
          <ReactTable
            className="-striped"
            data={metadata}
            columns={columns}
            pageSize={10}
          />
        </div>
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

export default withRouter(UploadEditFormPage);
