import { ApiClientContext, SubmitButton } from "common-ui";
import { Form, Formik, FormikActions } from "formik";
import { WithRouterProps } from "next/dist/client/with-router";
import { NextRouter, withRouter } from "next/router";
import { useContext } from "react";
import { DateField, SelectField, TextField } from "../../lib";

import ReactTable from "react-table";
import { Head } from "../../components";

interface EditMetadataFormProps {
  router: NextRouter;
}

export function EditMetadataFormPage({ router }: WithRouterProps) {
  return (
    <div>
      <Head title="Add Metadata" />

      <div className="container-fluid">
        <div>
          <h1>Edit Metadata</h1>
          <EditMetadataForm router={router} />
        </div>
      </div>
    </div>
  );
}

function EditMetadataForm({ router }: EditMetadataFormProps) {
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
      name: "acDigitizationDate",
      value: ""
    },
    {
      name: "xmpMetadataDate",
      value: ""
    },
    {
      name: "acHashFunction",
      value: ""
    },
    {
      name: "acHashValue",
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
        } else if (key.endsWith("Date")) {
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
        <div style={{ width: "50%" }}>
          <ReactTable
            className="-striped"
            data={metadata}
            columns={columns}
            pageSize={10}
          />
          <p />
          <SubmitButton />
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

export default withRouter(EditMetadataFormPage);
