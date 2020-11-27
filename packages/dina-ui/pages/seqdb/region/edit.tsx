import {
  ApiClientContext,
  ButtonBar,
  CancelButton,
  ErrorViewer,
  LoadingSpinner,
  Query,
  safeSubmit,
  SelectField,
  SubmitButton,
  TextField,
  useGroupSelectOptions
} from "common-ui";
import { Form, Formik } from "formik";
import { WithRouterProps } from "next/dist/client/with-router";
import { NextRouter, withRouter } from "next/router";
import { useContext } from "react";
import { Head, Nav } from "../../../components";
import { SeqdbMessage, useSeqdbIntl } from "../../../intl/seqdb-intl";
import { Region } from "../../../types/seqdb-api/resources/Region";

interface RegionFormProps {
  region?: Region;
  router: NextRouter;
}

export function RegionEditPage({ router }: WithRouterProps) {
  const { id } = router.query;
  const { formatMessage } = useSeqdbIntl();

  return (
    <div>
      <Head title={formatMessage("editRegionTitle")} />
      <Nav />
      <div className="container-fluid">
        {id ? (
          <div>
            <h1>
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
            <h1>
              <SeqdbMessage id="addRegionTitle" />
            </h1>
            <RegionForm router={router} />
          </div>
        )}
      </div>
    </div>
  );
}

function RegionForm({ region, router }: RegionFormProps) {
  const { save } = useContext(ApiClientContext);
  const groupSelectOptions = useGroupSelectOptions();

  const { id } = router.query;
  const initialValues = region || { group: groupSelectOptions[0].value };

  const onSubmit = safeSubmit(async submittedValues => {
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
    await router.push(`/region/view?id=${newId}`);
  });

  return (
    <Formik initialValues={initialValues} onSubmit={onSubmit}>
      <Form translate={undefined}>
        <ErrorViewer />
        <ButtonBar>
          <SubmitButton />
          <CancelButton entityId={id as string} entityLink="/seqdb/region" />
        </ButtonBar>
        <div>
          <div className="row">
            <SelectField
              className="col-md-2"
              disabled={true}
              name="group"
              options={groupSelectOptions}
            />
          </div>
          <div className="row">
            <TextField className="col-md-2" name="name" />
            <TextField className="col-md-2" name="symbol" />
            <TextField className="col-md-2" name="description" />
          </div>
          <SubmitButton />
        </div>
      </Form>
    </Formik>
  );
}

export default withRouter(RegionEditPage);
