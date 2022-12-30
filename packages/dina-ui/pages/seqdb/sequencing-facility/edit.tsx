import {
  BackButton,
  ButtonBar,
  DinaForm,
  DinaFormOnSubmit,
  SubmitButton,
  TextField,
  useAccount,
  useQuery,
  useStringArrayConverter,
  withResponse,
  FieldSet
} from "common-ui";
import { WithRouterProps } from "next/dist/client/with-router";
import { NextRouter, withRouter } from "next/router";
import {
  SequencingFacilityContacts,
  SequencingFacilityProps
} from "../../../../dina-ui/components/seqdb";
import { GroupSelectField, Head, Nav } from "../../../components";
import { SeqdbMessage, useSeqdbIntl } from "../../../intl/seqdb-intl";
import {
  SequencingFacilityVO,
  SequencingFacility,
  SequencingFacilityContactVO
} from "../../../types/seqdb-api/";
import { Card } from "react-bootstrap";
import { useState } from "react";

interface SequencingFacilityFormProps {
  sequencingFacility?: SequencingFacilityVO;
  router: NextRouter;
  converter:
    | ((arrayValue: string[]) => string)
    | ((stringValue: any) => string[]);
}

export function SequencingFacilityEditPage({ router }: WithRouterProps) {
  const { id } = router.query;
  const { formatMessage } = useSeqdbIntl();
  const [convertArrayToString, convertStringToArray] =
    useStringArrayConverter();

  const title = id
    ? "editSequencingFacilityTitle"
    : "addSequencingFacilityTitle";

  const query = useQuery<SequencingFacility>(
    {
      path: `seqdb-api/sequencing-facility/${id}`
    },
    {
      disabled: !id
    }
  );

  return (
    <div>
      <Head title={formatMessage(title)} />
      <Nav />
      <main className="container-fluid">
        {id ? (
          <div>
            <h1 id="wb-cont">
              <SeqdbMessage id="editSequencingFacilityTitle" />
            </h1>
            {withResponse(query, ({ data }) => {
              const contactArrayVO = (data.contacts || []).map(
                (contact) =>
                  ({
                    ...contact,
                    roles: convertArrayToString(contact.roles || [])
                  } as SequencingFacilityContactVO)
              );

              const facilityVO: SequencingFacilityVO = {
                ...data,
                contacts: contactArrayVO
              };
              return (
                <SequencingFacilityForm
                  sequencingFacility={facilityVO}
                  router={router}
                  converter={convertStringToArray}
                />
              );
            })}
          </div>
        ) : (
          <div>
            <h1 id="wb-cont">
              <SeqdbMessage id="addSequencingFacilityTitle" />
            </h1>
            <SequencingFacilityForm
              router={router}
              converter={convertStringToArray}
            />
          </div>
        )}
      </main>
    </div>
  );
}

function SequencingFacilityForm({
  sequencingFacility,
  router,
  converter
}: SequencingFacilityFormProps) {
  const { id } = router.query;
  const { username } = useAccount();
  const initialValues =
    sequencingFacility ||
    ({
      contacts: [{}],
      shippingAddress: {},
      createdBy: username
    } as SequencingFacilityVO);

  const onSubmit: DinaFormOnSubmit = async ({
    api: { save },
    submittedValues
  }) => {
    const contacts = (submittedValues.contacts || []).map((contact) => ({
      ...contact,
      roles: converter(contact.roles)
    }));
    const response = await save(
      [
        {
          resource: { ...submittedValues, contacts },
          type: "sequencing-facility"
        }
      ],
      { apiBaseUrl: "/seqdb-api" }
    );

    const newId = response[0].id;
    await router.push(`/seqdb/sequencing-facility/view?id=${newId}`);
  };

  const buttonBar = (
    <ButtonBar>
      <BackButton
        entityId={id as string}
        entityLink="/seqdb/sequencing-facility"
      />
      <SubmitButton className="ms-auto" />
    </ButtonBar>
  );

  return (
    <DinaForm initialValues={initialValues} onSubmit={onSubmit}>
      {({ values }) => (
        <>
          {buttonBar}
          <SequencingFacilityFormFields formValues={values} />
        </>
      )}
    </DinaForm>
  );
}

export function SequencingFacilityFormFields({
  formValues
}: SequencingFacilityProps) {
  return (
    <div>
      <FieldSet legend={<></>}>
        <div className="row">
          <GroupSelectField
            className="col-md-6"
            name="group"
            enableStoredDefaultGroup={true}
          />
          <TextField className="col-md-6" name="name" />
        </div>
      </FieldSet>
      <SequencingFacilityContacts formValues={formValues} />
      <FieldSet
        legend={<SeqdbMessage id="sequencingFacilityShippingAddress" />}
      >
        <div className="row">
          <TextField className="col-md-6" name="shippingAddress.addressLine1" />
          <TextField className="col-md-6" name="shippingAddress.addressLine2" />
        </div>
        <div className="row">
          <TextField className="col-md-6" name="shippingAddress.city" />
          <TextField
            className="col-md-6"
            name="shippingAddress.provinceState"
          />
        </div>
        <div className="row">
          <TextField className="col-md-6" name="shippingAddress.zipCode" />
          <TextField className="col-md-6" name="shippingAddress.country" />
        </div>
      </FieldSet>
    </div>
  );
}

export default withRouter(SequencingFacilityEditPage);
