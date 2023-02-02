import {
  BackButton,
  ButtonBar,
  DateField,
  DinaForm,
  DinaFormOnSubmit,
  filterBy,
  NumberField,
  ResourceSelectField,
  SelectField,
  SubmitButton,
  TextField,
  useQuery,
  withResponse,
  RadioButtonsField
} from "common-ui";
import { WithRouterProps } from "next/dist/client/with-router";
import { NextRouter, withRouter } from "next/router";
import { GroupSelectField, Head, Nav } from "../../../components";
import { SeqdbMessage, useSeqdbIntl } from "../../../intl/seqdb-intl";
import { PcrPrimer } from "../../../types/seqdb-api/resources/PcrPrimer";
import { Region } from "../../../types/seqdb-api/resources/Region";

interface PcrPrimerFormProps {
  primer?: PcrPrimer;
  router: NextRouter;
}

export function PcrPrimerEditPage({ router }: WithRouterProps) {
  const { id } = router.query;
  const { formatMessage } = useSeqdbIntl();
  const title = id ? "editPcrPrimerTitle" : "addPcrPrimerTitle";

  const query = useQuery<PcrPrimer>({
    include: "region",
    path: `seqdb-api/pcr-primer/${id}`
  });

  return (
    <div>
      <Head title={formatMessage(title)} />
      <Nav />
      <main className="container-fluid">
        {id ? (
          <div>
            <h1 id="wb-cont">
              <SeqdbMessage id="editPcrPrimerTitle" />
            </h1>
            {withResponse(query, ({ data }) => (
              <PcrPrimerForm primer={data} router={router} />
            ))}
          </div>
        ) : (
          <div>
            <h1 id="wb-cont">
              <SeqdbMessage id="addPcrPrimerTitle" />
            </h1>
            <PcrPrimerForm router={router} />
          </div>
        )}
      </main>
    </div>
  );
}

function PcrPrimerForm({ primer, router }: PcrPrimerFormProps) {
  const { id } = router.query;

  const initialValues = primer || {
    lotNumber: 1,
    seq: "",
    type: "PRIMER",
    direction: "F"
  };

  const onSubmit: DinaFormOnSubmit = async ({
    api: { save },
    submittedValues
  }) => {
    const response = await save(
      [
        {
          resource: submittedValues,
          type: "pcr-primer"
        }
      ],
      { apiBaseUrl: "/seqdb-api" }
    );

    const newId = response[0].id;
    await router.push(`/seqdb/pcr-primer/view?id=${newId}`);
  };

  return (
    <DinaForm initialValues={initialValues} onSubmit={onSubmit}>
      <ButtonBar>
        <BackButton entityId={id as string} entityLink="/seqdb/pcr-primer" />
        <SubmitButton className="ms-auto" />
      </ButtonBar>
      <PcrPrimerFormFields />
    </DinaForm>
  );
}

export function PcrPrimerFormFields() {
  return (
    <div>
      <div className="row">
        <GroupSelectField
          className="col-md-2"
          name="group"
          enableStoredDefaultGroup={true}
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
          model="seqdb-api/region"
          optionLabel={(region) => region.name}
        />
        <TextField className="col-md-2" name="name" />
        <NumberField className="col-md-2" name="lotNumber" />
        <TextField className="col-md-2" name="targetSpecies" />
        <TextField className="col-md-2" name="purification" />
      </div>
      <div className="row">
        <RadioButtonsField<string>
          horizontalOptions={true}
          className="col-md-2"
          name="direction"
          options={[
            { value: "F", label: "F" },
            { value: "R", label: "R" }
          ]}
        />
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
