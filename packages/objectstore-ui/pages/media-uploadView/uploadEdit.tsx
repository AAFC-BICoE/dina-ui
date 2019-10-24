import { ApiClientContext } from "common-ui";
import { Form, Formik, FormikActions } from "formik";
import { WithRouterProps } from "next/dist/client/with-router";
import { NextRouter, withRouter } from "next/router";
import { useContext, useState } from "react";
import DatePicker from "react-datepicker";
import Select from "react-select";
import ReactTable from "react-table";
import { Head, Nav } from "../../components";

interface UploadEditFormProps {
  router: NextRouter;
}

export function UploadEditFormPage({ router }: WithRouterProps) {
  return (
    <div>
      <Head title="Add Metadata" />
      <Nav />
      <div className="container-fluid">
        <div>
          <h1>Add Metadata</h1>
          <UploadEditForm router={router} />
        </div>
      </div>
    </div>
  );
}

function UploadEditForm({ router }: UploadEditFormProps) {
  const { save } = useContext(ApiClientContext);

  async function onSubmit(
    submittedValues,
    { setStatus, setSubmitting }: FormikActions<any>
  ) {
    try {
      const response = await save([
        {
          resource: submittedValues,
          type: "metadata"
        }
      ]);
      const newId = response[0].id;
      router.push(`/media-uploadView/uploadView/${newId}`);
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

  const [startDate, setStartDate] = useState(new Date());
  const [selectedOptions, setSelectedOptions] = useState(DC_TYPE_OPTIONS);

  const handleDcTypeChange = mySelectedOptions => {
    setSelectedOptions(mySelectedOptions);
  };

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
            <Select
              options={DC_TYPE_OPTIONS}
              onChange={handleDcTypeChange}
              value={selectedOptions}
              minMenuHeight={900}
            />
          );
        } else if (key.endsWith("Date") || key.endsWith("Time")) {
          return (
            <DatePicker
              className="form-control"
              dateFormat="yyyy-MM-dd"
              isClearable={true}
              onChange={setStartDate}
              selected={startDate}
              showYearDropdown={true}
              todayButton="Today"
            />
          );
        } else {
          return <input />;
        }
      },
      Header: "Property Value"
    }
  ];

  return (
    <Formik initialValues={{}} onSubmit={onSubmit}>
      <Form>
        <ReactTable className="-striped" data={metadata} columns={columns} />
        <Select
          options={DC_TYPE_OPTIONS}
          onChange={handleDcTypeChange}
          value={selectedOptions}
          minMenuHeight={50}
        />
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
