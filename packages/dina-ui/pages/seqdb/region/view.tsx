import {
  BackToListButton,
  ButtonBar,
  EditButton,
  FieldView,
  LoadingSpinner,
  Query
} from "common-ui";
import { Formik } from "formik";
import { noop } from "lodash";
import { WithRouterProps } from "next/dist/client/with-router";
import { withRouter } from "next/router";
import { Head, Nav } from "../../../components";
import { SeqdbMessage, useSeqdbIntl } from "../../../intl/seqdb-intl";
import { Region } from "../../../types/seqdb-api/resources/Region";

export function RegionDetailsPage({ router }: WithRouterProps) {
  const { id } = router.query;
  const { formatMessage } = useSeqdbIntl();

  return (
    <div>
      <Head title={formatMessage("regionViewTitle")} />
      <Nav />
      <ButtonBar>
        <EditButton entityId={id as string} entityLink="seqdb/region" />
        <BackToListButton entityLink="/seqdb/region" />
      </ButtonBar>
      <Query<Region> query={{ path: `seqdb-api/region/${id}` }}>
        {({ loading, response }) => (
          <div className="container-fluid">
            <h1>
              <SeqdbMessage id="regionViewTitle" />
            </h1>
            <LoadingSpinner loading={loading} />
            {response && (
              <Formik<Region> initialValues={response.data} onSubmit={noop}>
                <div>
                  <div className="row">
                    <FieldView className="col-md-2" name="group" />
                  </div>
                  <div className="row">
                    <FieldView className="col-md-2" name="name" />
                    <FieldView className="col-md-2" name="description" />
                    <FieldView className="col-md-2" name="symbol" />
                  </div>
                </div>
              </Formik>
            )}
          </div>
        )}
      </Query>
    </div>
  );
}

export default withRouter(RegionDetailsPage);
