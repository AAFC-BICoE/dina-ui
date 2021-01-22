import {
  BackToListButton,
  ButtonBar,
  DinaForm,
  EditButton,
  FieldView,
  LoadingSpinner,
  Query
} from "common-ui";
import { WithRouterProps } from "next/dist/client/with-router";
import { withRouter } from "next/router";
import { GroupFieldView, Head, Nav } from "../../../components";
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
          <main className="container-fluid">
            <h1>
              <SeqdbMessage id="regionViewTitle" />
            </h1>
            <LoadingSpinner loading={loading} />
            {response && (
              <DinaForm<Region> initialValues={response.data}>
                <div className="row">
                  <GroupFieldView className="col-md-2" name="group" />
                </div>
                <div className="row">
                  <FieldView className="col-md-2" name="name" />
                  <FieldView className="col-md-2" name="description" />
                  <FieldView className="col-md-2" name="symbol" />
                </div>
              </DinaForm>
            )}
          </main>
        )}
      </Query>
    </div>
  );
}

export default withRouter(RegionDetailsPage);
