import {
  BackButton,
  ButtonBar,
  DinaForm,
  DinaFormOnSubmit,
  SubmitButton,
  TextField,
  useDinaFormContext,
  useQuery,
  withResponse
} from "common-ui";
import { WithRouterProps } from "next/dist/client/with-router";
import { NextRouter, withRouter } from "next/router";
import { Footer, GroupSelectField, Head, Nav } from "../../../components";
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

  const query = useQuery<Region>({ path: `seqdb-api/region/${id}` });

  return (
    <div>
      <Head title={formatMessage(title)} />
      <Nav />
      <main className="container-fluid">
        {id ? (
          <div>
            <h1 id="wb-cont">
              <SeqdbMessage id="editRegionTitle" />
            </h1>
            {withResponse(query, ({ data }) => (
              <RegionForm region={data} router={router} />
            ))}
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
      <Footer />
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
      <ButtonBar className="mb-3">
        <div className="col-md-6 col-sm-12 mt-2">
          <BackButton entityId={id as string} entityLink="/seqdb/region" />
        </div>
        <div className="col-md-6 col-sm-12 d-flex">
          <SubmitButton className="ms-auto" />
        </div>
      </ButtonBar>
      <RegionFormFields />
    </DinaForm>
  );
}

export function RegionFormFields() {
  const { readOnly } = useDinaFormContext();
  return (
    <div>
      <div className="row">
        <TextField className="col-md-6" name="name" />
        {!readOnly && (
          <GroupSelectField
            className="col-md-6"
            name="group"
            enableStoredDefaultGroup={true}
          />
        )}
      </div>
      <div className="row">
        <TextField className="col-md-6" name="symbol" />
        <TextField className="col-md-6" name="description" />
      </div>
    </div>
  );
}

export default withRouter(RegionEditPage);
