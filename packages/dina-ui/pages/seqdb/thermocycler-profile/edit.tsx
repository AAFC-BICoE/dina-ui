import {
  BackButton,
  ButtonBar,
  DinaForm,
  DinaFormOnSubmit,
  filterBy,
  ResourceSelectField,
  SubmitButton,
  TextField,
  useQuery,
  withResponse
} from "common-ui";
import { WithRouterProps } from "next/dist/client/with-router";
import { NextRouter, withRouter } from "next/router";
import { GroupSelectField, Head, Nav } from "../../../components";
import { SeqdbMessage, useSeqdbIntl } from "../../../intl/seqdb-intl";
import { PcrProfile } from "../../../types/seqdb-api/resources/PcrProfile";
import { Region } from "../../../types/seqdb-api/resources/Region";
import { useState } from "react";

interface PcrProfileFormProps {
  profile?: PcrProfile;
  router: NextRouter;
}

export function PcrProfileEditPage({ router }: WithRouterProps) {
  const { id } = router.query;
  const { formatMessage } = useSeqdbIntl();
  const title = id ? "editPcrProfileTitle" : "addPcrProfileTitle";

  const query = useQuery<PcrProfile>({
    include: "region",
    path: `seqdb-api/thermocycler-profile/${id}`
  });

  return (
    <div>
      <Head title={formatMessage(title)} />
      <Nav />
      <main className="container-fluid">
        {id ? (
          <div>
            <h1 id="wb-cont">
              <SeqdbMessage id="editPcrProfileTitle" />
            </h1>
            {withResponse(query, ({ data }) => (
              <PcrProfileForm profile={data} router={router} />
            ))}
          </div>
        ) : (
          <div>
            <h1 id="wb-cont">
              <SeqdbMessage id="addPcrProfileTitle" />
            </h1>
            <PcrProfileForm router={router} />
          </div>
        )}
      </main>
    </div>
  );
}

function PcrProfileForm({ profile, router }: PcrProfileFormProps) {
  const { id } = router.query;

  const initialValues = profile || {
    type: "thermocycler-profile"
  };

  const onSubmit: DinaFormOnSubmit = async ({
    api: { save },
    submittedValues
  }) => {
    const response = await save(
      [
        {
          resource: submittedValues,
          type: "thermocycler-profile"
        }
      ],
      { apiBaseUrl: "/seqdb-api" }
    );

    const newId = response[0].id;
    await router.push(`/seqdb/thermocycler-profile/view?id=${newId}`);
  };

  return (
    <DinaForm initialValues={initialValues} onSubmit={onSubmit}>
      <ButtonBar>
        <SubmitButton />
        <BackButton entityId={id as string} entityLink="/seqdb/thermocycler-profile" />
      </ButtonBar>
      <PcrProfileFormFields />
    </DinaForm>
  );
}

export function PcrProfileFormFields() {
  const [inputValues, setInputValues] = useState({});
  const [counter, setCounter] = useState(0);

  const handleClick = () => {
    setCounter(counter + 1);
    console.log(counter);
  };

  const handleOnChange = (e) => {
    const abc = {};
    abc[e.target.className] = e.target.value;
    setInputValues({ ...inputValues, ...abc });
  };

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
        <ResourceSelectField<Region>
          className="col-md-2"
          name="region"
          filter={filterBy(["name"])}
          label="Gene Region"
          model="seqdb-api/region"
          optionLabel={region => region.name}
        />
        <TextField
          className="col-md-2"
          name="name"
          label="Thermocycler Profile Name"
        />
        <TextField className="col-md-2" name="application" />
        <TextField className="col-md-2" name="cycles" />
      </div>
      <button onClick={handleClick}>Hello</button>

      {Object.keys(inputValues).map((c) => {
        return <p>{inputValues[c]}</p>;
      })}

      {Array.from(Array(counter)).map((c, index) => {
        return (
          <input
            onChange={handleOnChange}
            key={c}
            className={index}
            type="text"
          ></input>
        );
      })}
      <div className="row">
        <div className="col-md-6">
          <div className="card-group row" style={{ padding: 15 }}>
            <div className="card card-body col-md-4">
              <TextField name="step1" />
              <TextField name="step2" />
              <TextField name="step3" />
              <TextField name="step4" />
              <TextField name="step5" />
            </div>
            <div className="card card-body col-md-4">
              <TextField name="step6" />
              <TextField name="step7" />
              <TextField name="step8" />
              <TextField name="step9" />
              <TextField name="step10" />
            </div>
            <div className="card card-body col-md-4">
              <TextField name="step11" />
              <TextField name="step12" />
              <TextField name="step13" />
              <TextField name="step14" />
              <TextField name="step15" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default withRouter(PcrProfileEditPage);
