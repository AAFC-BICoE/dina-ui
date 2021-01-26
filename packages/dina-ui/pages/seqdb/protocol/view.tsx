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
import {
  Protocol,
  protocolTypeLabels
} from "../../../types/seqdb-api/resources/Protocol";

export function ProtocolDetailsPage({ router }: WithRouterProps) {
  const { id } = router.query;
  const { formatMessage } = useSeqdbIntl();

  return (
    <div>
      <Head title={formatMessage("protocolViewTitle")} />
      <Nav />
      <ButtonBar>
        <EditButton entityId={id as string} entityLink="seqdb/protocol" />
        <BackToListButton entityLink="/seqdb/protocol" />
      </ButtonBar>
      <Query<Protocol>
        query={{ include: "kit", path: `seqdb-api/protocol/${id}` }}
      >
        {({ loading, response }) => {
          const protocol = response && {
            ...response.data,
            type: protocolTypeLabels[response.data.type]
          };

          return (
            <main className="container-fluid">
              <h1>
                <SeqdbMessage id="protocolViewTitle" />
              </h1>
              <LoadingSpinner loading={loading} />
              {protocol && (
                <DinaForm<Protocol> initialValues={protocol}>
                  <div>
                    <div className="row">
                      <GroupFieldView className="col-md-2" name="group" />
                    </div>
                    <div className="row">
                      <FieldView className="col-md-2" name="type" />
                      <FieldView className="col-md-2" name="name" />
                      <FieldView className="col-md-2" name="version" />
                      <FieldView className="col-md-2" name="description" />
                    </div>
                    <div className="row">
                      <FieldView className="col-md-8" name="steps" />
                    </div>
                    <div className="row">
                      <FieldView className="col-md-8" name="notes" />
                    </div>
                    <div className="row">
                      <FieldView className="col-md-2" name="reference" />
                      <FieldView className="col-md-2" name="equipment" />
                      <FieldView className="col-md-2" name="kit.name" />
                    </div>
                    <div className="row">
                      <FieldView className="col-md-2" name="lastModified" />
                    </div>
                  </div>
                </DinaForm>
              )}
            </main>
          );
        }}
      </Query>
    </div>
  );
}

export default withRouter(ProtocolDetailsPage);
