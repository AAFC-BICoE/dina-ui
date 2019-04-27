import { Form, Formik, FormikActions } from "formik";
import { SingletonRouter, withRouter, WithRouterProps } from "next/router";
import { useContext } from "react";
import {
  ApiClientContext,
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
import { withNamespaces, Trans } from "../../i18n";
import React from "react";

interface PcrPrimerFormProps {
  primer?: PcrPrimer;
  router: SingletonRouter;
}

interface OtherProps {
  t?: (string) => string
}
export class PcrPrimerEditPage extends React.Component<WithRouterProps & OtherProps> {

  public id = this.props.router.query.id;
  public router = this.props.router;

  static async getInitialProps() {
    return await {
      namespacesRequired: ['pcr-primer']
    }
  }
  render() {
    const { t } = this.props
    return (
      <div>
        <Head title="Edit PCR Primer" />
        <Nav />
        <div className="container-fluid">
          {this.id ? (
            <div>
              <h1><Trans i18nKey="Edit PCR Primer" /></h1>
              <Query<PcrPrimer>
                query={{ include: "group,region", path: `pcrPrimer/${this.id}` }}
              >
                {({ loading, response }) => (
                  <div>
                    <LoadingSpinner loading={loading} />
                    {response && (
                      <PcrPrimerForm primer={response.data} router={this.router} t={t} />
                    )}
                  </div>
                )}
              </Query>
            </div>
          ) : (
              <div>
                <h1>Add PCR Primer</h1>
                <PcrPrimerForm router={this.router} t={t} />
              </div>
            )}
        </div>
      </div>
    );
  }

}

function PcrPrimerForm({ primer, router, t }: PcrPrimerFormProps & OtherProps) {
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
              tooltipMsg={t('target gene region')}
              optionLabel={region => region.name}
            />
            <TextField tooltipMsg={t('primer name')} className="col-md-2" name="name" />
            <TextField className="col-md-2" name="lotNumber" />
            <TextField className="col-md-2" name="targetSpecies" />
            <TextField className="col-md-2" name="purification" />
          </div>
          <div className="row">
            <TextField className="col-md-2" name="direction" />
            <TextField className="col-md-2" name="tmCalculated" />
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
          <SubmitButton />
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

export default withRouter(withNamespaces('pcr-primer')(PcrPrimerEditPage));
