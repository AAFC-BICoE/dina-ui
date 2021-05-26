import {
  ApiClientContext,
  ButtonBar,
  BackButton,
  DinaForm,
  DinaFormOnSubmit,
  SubmitButton,
  TextField,
  LoadingSpinner,
  Query
} from "common-ui";
import { NextRouter, useRouter } from "next/router";
import { PreparationType } from "../../../types/collection-api/resources/PreparationType";
import { useContext } from "react";
import { Head, Nav, GroupSelectField } from "../../../components";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";

interface PreparationTypeFormProps {
  fetchedPrepType?: PreparationType;
  router: NextRouter;
}

export default function PreparationTypeEditPage() {
  const router = useRouter();
  const {
    query: { id }
  } = router;
  const { formatMessage } = useDinaIntl();
  return (
    <div>
      <Head title={formatMessage("addPreparationTypeTitle")} />
      <Nav />
      <main className="container-fluid">
        <div>
          <h1>
            <DinaMessage id="addPreparationTypeTitle" />
          </h1>
          {id ? (
            <Query<PreparationType>
              query={{ path: `collection-api/preparation-type/${id}` }}
            >
              {({ loading, response }) => (
                <div>
                  <LoadingSpinner loading={loading} />
                  {response && (
                    <PreparationTypeForm
                      fetchedPrepType={response.data}
                      router={router}
                    />
                  )}
                </div>
              )}
            </Query>
          ) : (
            <PreparationTypeForm router={router} />
          )}
        </div>
      </main>
    </div>
  );
}

function PreparationTypeForm({
  fetchedPrepType,
  router
}: PreparationTypeFormProps) {
  const { save } = useContext(ApiClientContext);
  const { id } = router.query;
  const initialValues = fetchedPrepType || { type: "preparation-type" };
  const { formatMessage } = useDinaIntl();

  const onSubmit: DinaFormOnSubmit = async ({ submittedValues }) => {
    await save(
      [
        {
          resource: submittedValues,
          type: "preparation-type"
        }
      ],
      {
        apiBaseUrl: "/collection-api"
      }
    );
    await router.push(`/collection/preparation-type/list`);
  };

  return (
    <DinaForm initialValues={initialValues} onSubmit={onSubmit}>
      <ButtonBar>
        <BackButton
          entityId={id as string}
          entityLink="/collection/preparation-type"
          byPassView={true}
        />
        <SubmitButton className="ms-auto" />
      </ButtonBar>
      <div>
        <div className="row">
          <GroupSelectField
            name="group"
            enableStoredDefaultGroup={true}
            className="col-md-6"
          />
        </div>
        <div className="row">
          <TextField
            className="col-md-6 preparationTypeName"
            name="name"
            label={formatMessage("preparationTypeNameLabel")}
          />
        </div>
      </div>
    </DinaForm>
  );
}
