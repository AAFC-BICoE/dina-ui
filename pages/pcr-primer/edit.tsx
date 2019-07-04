import { Form, Formik, FormikActions } from "formik";
import { SingletonRouter, withRouter, WithRouterProps } from "next/router";
import { useContext } from "react";
import {
  ApiClientContext,
  ButtonBar,
  DateField,
  ErrorViewer,
  Head,
  LoadingSpinner,
  Nav,
  Query,
  ResourceSelectField,
  SelectField,
  SubmitButton,
  TextField
} from "../../components";
import { Group } from "../../types/seqdb-api/resources/Group";
import { PcrPrimer } from "../../types/seqdb-api/resources/PcrPrimer";
import { Region } from "../../types/seqdb-api/resources/Region";
import { filterBy } from "../../util/rsql";
import { serialize } from "../../util/serialize";

interface PcrPrimerFormProps {
  primer?: PcrPrimer;
  router: SingletonRouter;
}

export function PcrPrimerEditPage({ router }: WithRouterProps) {
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
              query={{ include: "group,region", path: `pcrPrimer/${id}` }}
            >
              {({ loading, response }) => (
                <div>
                  <LoadingSpinner loading={loading} />
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
}

function PcrPrimerForm({ primer, router }: PcrPrimerFormProps) {
  const { doOperations } = useContext(ApiClientContext);

  const initialValues = primer || { lotNumber: 1, seq: "", type: "PRIMER" };

  async function onSubmit(
    submittedValues,
    { setStatus, setSubmitting }: FormikActions<any>
  ) {
    try {
      const serialized = await serialize({
        resource: submittedValues,
        type: "pcrPrimer"
      });

      const op = submittedValues.id ? "PATCH" : "POST";

      if (op === "POST") {
        serialized.id = -100;
      }

      const response = await doOperations([
        {
          op,
          path: op === "PATCH" ? `pcrPrimer/${primer.id}` : "pcrPrimer",
          value: serialized
        }
      ]);

      const newId = response[0].data.id;
      router.push(`/pcr-primer/view?id=${newId}`);
    } catch (error) {
      setStatus(error.message);
      setSubmitting(false);
    }
  }

  return (
    <Formik initialValues={initialValues} onSubmit={onSubmit}>
      <Form>
        <ButtonBar>
          <SubmitButton />
        </ButtonBar>
        <ErrorViewer />
        <div>
          <div className="row">
            <ResourceSelectField<Group>
              className="col-md-2"
              name="group"
              filter={filterBy(["groupName"])}
              model="group"
              optionLabel={group => group.groupName}
            />
          </div>
          <div className="row">
            <SelectField
              className="col-md-2"
              name="type"
              label="Primer Type"
              options={PRIMER_TYPE_OPTIONS}
            />
          </div>
          <div className="row">
            <ResourceSelectField<Region>
              className="col-md-2"
              name="region"
              filter={filterBy(["name"])}
              label="Target Gene Region"
              model="region"
              optionLabel={region => region.name}
            />
            <TextField className="col-md-2" name="name" />
            <TextField className="col-md-2" name="lotNumber" />
            <TextField className="col-md-2" name="targetSpecies" />
            <TextField className="col-md-2" name="purification" />
          </div>
          <div className="row">
            <TextField className="col-md-2" name="direction" />
            <TextField className="col-md-2" name="tmCalculated" />
            <DateField className="col-md-2" name="dateOrdered" />
          </div>
          <div className="row">
            <TextField
              className="col-md-6"
              name="seq"
              label="Primer Sequence (5' - 3')"
            />
          </div>
          <div className="row">
            <TextField className="col-md-2" name="application" />
            <TextField className="col-md-2" name="reference" />
            <TextField className="col-md-2" name="supplier" />
            <TextField className="col-md-2" name="designedBy" />
            <TextField
              className="col-md-2"
              name="stockConcentration"
              label="Stock Concentration(uM)"
            />
          </div>
          <div className="row">
            <TextField className="col-md-6" name="note" />
          </div>
        </div>
      </Form>
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

export default withRouter(PcrPrimerEditPage);
