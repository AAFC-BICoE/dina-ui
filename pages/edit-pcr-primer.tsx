import { Field, Form, Formik, FormikActions } from "formik";
import { pick } from "lodash";
import { SingletonRouter, withRouter } from "next/router";
import { useContext } from "react";
import { ApiClientContext } from "../components/api-client/ApiClientContext";
import { Query } from "../components/api-client/Query";
import { FormikSelect } from "../components/formik-input/FormikSelect";
import Head from "../components/head";
import Nav from "../components/nav";
import { ResourceSelect } from "../components/resource-select/ResourceSelect";
import { Group } from "../types/seqdb-api/resources/Group";
import { PcrPrimer } from "../types/seqdb-api/resources/PcrPrimer";

interface PcrPrimerFormProps {
  primer?: PcrPrimer;
  router: SingletonRouter;
}

export default withRouter(function AddPcrPrimerPage({ router }) {
  const { id } = router.query;

  return (
    <div>
      <Head title="Edit PCR Primer" />
      <Nav />
      <div className="container-fluid">
        {id ? (
          <div>
            <h1>Edit PCR Primer</h1>
            <Query<PcrPrimer>
              query={{ include: "group", path: `pcrPrimer/${id}` }}
            >
              {({ loading, response }) => (
                <div>
                  {loading && (
                    <div className="spinner-border" role="status">
                      <span className="sr-only">Loading...</span>
                    </div>
                  )}
                  {response && (
                    <PcrPrimerForm primer={response.data} router={router} />
                  )}
                </div>
              )}
            </Query>
          </div>
        ) : (
          <div>
            <h1>Add PCR Primer</h1>
            <PcrPrimerForm router={router} />
          </div>
        )}
      </div>
    </div>
  );
});

function PcrPrimerForm({ primer, router }: PcrPrimerFormProps) {
  const { doOperations } = useContext(ApiClientContext);

  const initialValues = primer
    ? {
        attributes: pick(primer, ["name", "lotNumber", "seq", "type"]),
        relationships: {
          group: primer.group && {
            data: { id: primer.group.id, type: "group" }
          }
        }
      }
    : {
        attributes: { lotNumber: 1, type: "PRIMER", seq: "" },
        relationships: {}
      };

  async function onSubmit(
    { attributes, relationships },
    { setStatus, setSubmitting }: FormikActions<any>
  ) {
    try {
      const response = await doOperations([
        {
          op: primer ? "PATCH" : "POST",
          path: primer ? `pcrPrimer/${primer.id}` : "pcrPrimer",
          value: {
            attributes,
            id: -123,
            relationships,
            type: "pcrPrimer"
          }
        }
      ]);

      const newId = response[0].data.id;
      router.push(`/pcr-primer?id=${newId}`);
    } catch (error) {
      setStatus(error);
      setSubmitting(false);
    }
  }

  return (
    <Formik initialValues={initialValues} onSubmit={onSubmit}>
      {({ status, isSubmitting, setFieldValue }) => (
        <Form>
          {status && <div className="alert alert-danger">{status}</div>}
          <div>
            <div className="row">
              <div className="form-group col-md-2">
                <label>Group:</label>
                <ResourceSelect<Group>
                  defaultValue={primer && primer.group}
                  filter={input => ({ groupName: input })}
                  model="group"
                  onChange={val => setFieldValue("relationships.group", val)}
                  optionLabel={group => group.groupName}
                />
              </div>
              <div className="form-group col-md-2">
                <label>Primer Type:</label>
                <FormikSelect
                  field="attributes.type"
                  options={PRIMER_TYPE_OPTIONS}
                />
              </div>
              <div className="form-group col-md-2">
                <label>Name:</label>
                <Field name="attributes.name" className="form-control" />
              </div>
              <div className="form-group col-md-2">
                <label>Lot Number:</label>
                <Field name="attributes.lotNumber" className="form-control" />
              </div>
            </div>
            {isSubmitting ? (
              <div className="spinner-border" role="status">
                <span className="sr-only">Loading...</span>
              </div>
            ) : (
              <button className="btn btn-primary" type="submit">
                Submit
              </button>
            )}
          </div>
        </Form>
      )}
    </Formik>
  );
}

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
