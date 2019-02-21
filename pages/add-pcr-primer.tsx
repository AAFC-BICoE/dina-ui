import { Field, Form, Formik } from "formik";
import { useContext } from "react";
import Select from "react-select";
import { ApiClientContext } from "../components/api-client/ApiClientContext";
import Head from "../components/head";
import Nav from "../components/nav";
import { ResourceSelect } from "../components/resource-select/ResourceSelect";
import { Group } from "../types/seqdb-api/resources/Group";
import { PcrPrimer } from "../types/seqdb-api/resources/PcrPrimer";

const PRIMER_TYPE_OPTIONS = [
  {
    label: "PCR Primer",
    value: "PRIMER"
  },
  {
    label: "454 Multiplex Identifier",
    value: "MID"
  },
  {
    label: "Fusion Primer",
    value: "FUSION_PRIMER"
  },
  {
    label: "Illumina Index",
    value: "ILLUMINA_INDEX"
  },
  {
    label: "iTru Primer",
    value: "ITRU_PRIMER"
  }
];

export default function AddPcrPrimerPage() {
  const { doOperations } = useContext(ApiClientContext);

  function onSubmit({ name, lotNumber, group, type }) {
    doOperations([
      {
        op: "POST",
        path: "pcrPrimer",
        value: {
          attributes: { name, lotNumber, seq: "", type },
          id: 123,
          relationships: { group },
          type: "pcrPrimer"
        }
      }
    ]);
  }
  return (
    <div>
      <Head title="Add PCR Primer" />
      <Nav />
      <div className="container-fluid">
        <h1>Add PCR Primer</h1>
        <Formik<Partial<PcrPrimer>>
          initialValues={{ name: "", lotNumber: 1 }}
          onSubmit={onSubmit}
        >
          {({ setFieldValue }) => (
            <Form>
              <div className="row">
                <div className="form-group col-md-2">
                  <label>Group:</label>
                  <ResourceSelect<Group>
                    filter={input => ({ groupName: input })}
                    model="group"
                    onChange={val => setFieldValue("group", val)}
                    optionLabel={group => group.groupName}
                  />
                </div>
                <div className="form-group col-md-2">
                  <label>Primer Type:</label>
                  <Select<any>
                    name="type"
                    options={PRIMER_TYPE_OPTIONS}
                    onChange={({ value }) => setFieldValue("type", value)}
                  />
                </div>
                <div className="form-group col-md-2">
                  <label>Name:</label>
                  <Field name="name" className="form-control" />
                </div>
                <div className="form-group col-md-2">
                  <label>Lot Number:</label>
                  <Field name="lotNumber" className="form-control" />
                </div>
              </div>
              <button className="btn btn-primary" type="submit">
                Submit
              </button>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
}
