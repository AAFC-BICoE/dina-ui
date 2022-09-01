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
import { ThermocyclerProfile } from "../../../types/seqdb-api/resources/ThermocyclerProfile";
import { Region } from "../../../types/seqdb-api/resources/Region";
import { useState } from "react";

interface ThermocyclerProfileFormProps {
  thermocyclerProfile?: ThermocyclerProfile;
  router: NextRouter;
}

export function ThermocyclerProfileEditPage({ router }: WithRouterProps) {
  const { id } = router.query;
  const { formatMessage } = useSeqdbIntl();
  const title = id
    ? "editThermocyclerProfileTitle"
    : "addThermocyclerProfileTitle";

  const query = useQuery<ThermocyclerProfile>({
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
              <SeqdbMessage id="editThermocyclerProfileTitle" />
            </h1>
            {withResponse(query, ({ data }) => (
              <ThermocyclerProfileForm
                thermocyclerProfile={data}
                router={router}
              />
            ))}
          </div>
        ) : (
          <div>
            <h1 id="wb-cont">
              <SeqdbMessage id="addThermocyclerProfileTitle" />
            </h1>
            <ThermocyclerProfileForm router={router} />
          </div>
        )}
      </main>
    </div>
  );
}

function ThermocyclerProfileForm({
  thermocyclerProfile,
  router
}: ThermocyclerProfileFormProps) {
  const { id } = router.query;

  const initialValues = thermocyclerProfile || {
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
        <BackButton
          entityId={id as string}
          entityLink="/seqdb/thermocycler-profile"
        />
      </ButtonBar>
      <ThermocyclerProfileFormFields />
    </DinaForm>
  );
}

export function ThermocyclerProfileFormFields() {
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
          optionLabel={(region) => region.name}
        />
        <TextField
          className="col-md-2"
          name="name"
          label="Thermocycler Profile Name"
        />
        <TextField className="col-md-2" name="application" />
        <TextField className="col-md-2" name="cycles" />
      </div>
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

export default withRouter(ThermocyclerProfileEditPage);
