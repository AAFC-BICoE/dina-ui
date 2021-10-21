import {
  ButtonBar,
  BackButton,
  DinaForm,
  DinaFormOnSubmit,
  LoadingSpinner,
  Query,
  SubmitButton,
  TextField
} from "common-ui";
import { WithRouterProps } from "next/dist/client/with-router";
import { NextRouter, withRouter } from "next/router";
import { GroupSelectField, Head, Nav } from "../../../components";
import { SeqdbMessage, useSeqdbIntl } from "../../../intl/seqdb-intl";
import { Region } from "../../../types/seqdb-api/resources/Region";

interface RegionFormProps {
  region?: Region;
  router: NextRouter;
}

export function RegionEditPage({ router }: WithRouterProps) {
  const { id } = router.query;
  const { formatMessage } = useSeqdbIntl();
  const title = id ? "editRegionTitle" : "addRegionTitle";

  return (
    <div>
      <Head title={formatMessage(title)}
						lang={formatMessage("languageOfPage")} 
						creator={formatMessage("agricultureCanada")}
						subject={formatMessage("subjectTermsForPage")} />
			<Nav />
      <main className="container-fluid">
        {id ? (
          <div>
            <h1 id="wb-cont">
              <SeqdbMessage id="editRegionTitle" />
            </h1>
            <Query<Region> query={{ path: `seqdb-api/region/${id}` }}>
              {({ loading, response }) => (
                <div>
                  <LoadingSpinner loading={loading} />
                  {response && (
                    <RegionForm region={response.data} router={router} />
                  )}
                </div>
              )}
            </Query>
          </div>
        ) : (
          <div>
            <h1 id="wb-cont">
              <SeqdbMessage id="addRegionTitle" />
            </h1>
            <RegionForm router={router} />
          </div>
        )}
      </main>
    </div>
  );
}

function RegionForm({ region, router }: RegionFormProps) {
  const { id } = router.query;
  const initialValues = region || {};

  const onSubmit: DinaFormOnSubmit = async ({
    api: { save },
    submittedValues
  }) => {
    const response = await save(
      [
        {
          resource: submittedValues,
          type: "region"
        }
      ],
      { apiBaseUrl: "/seqdb-api" }
    );

    const newId = response[0].id;
    await router.push(`/seqdb/region/view?id=${newId}`);
  };

  return (
    <DinaForm initialValues={initialValues} onSubmit={onSubmit}>
      <ButtonBar>
        <SubmitButton />
        <BackButton entityId={id as string} entityLink="/seqdb/region" />
      </ButtonBar>
      <div>
        <div className="row">
          <GroupSelectField
            className="col-md-2"
            name="group"
            enableStoredDefaultGroup={true}
          />
        </div>
        <div className="row">
          <TextField className="col-md-2" name="name" />
          <TextField className="col-md-2" name="symbol" />
          <TextField className="col-md-2" name="description" />
        </div>
        <SubmitButton />
      </div>
    </DinaForm>
  );
}

export default withRouter(RegionEditPage);
