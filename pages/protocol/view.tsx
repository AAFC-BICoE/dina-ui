import { Formik } from "formik";
import { WithRouterProps } from "next/dist/client/with-router";
import { withRouter } from "next/router";
import {
  BackToListButton,
  ButtonBar,
  EditButton,
  FieldView,
  Head,
  LoadingSpinner,
  Nav,
  Query
} from "../../components";
import {
  Protocol,
  protocolTypeLabels
} from "../../types/seqdb-api/resources/Protocol";

export function ProtocolDetailsPage({ router }: WithRouterProps) {
  const { id } = router.query;
  return (
    <div>
      <Head title="Protocol Details" />
      <Nav />
      <ButtonBar>
        <EditButton entityId={id as string} entityLink="protocol" />
        <BackToListButton entityLink="protocol" />
      </ButtonBar>
      <Query<Protocol> query={{ include: "group,kit", path: `protocol/${id}` }}>
        {({ loading, response }) => {
          const protocol = response && {
            ...response.data,
            type: protocolTypeLabels[response.data.type]
          };

          return (
            <div className="container-fluid">
              <h1>Protocol Details</h1>
              <LoadingSpinner loading={loading} />
              {protocol && (
                <Formik<Protocol> initialValues={protocol} onSubmit={null}>
                  <div>
                    <div className="row">
                      <FieldView
                        className="col-md-2"
                        name="group.groupName"
                        label="Group Name"
                      />
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
                </Formik>
              )}
            </div>
          );
        }}
      </Query>
    </div>
  );
}

export default withRouter(ProtocolDetailsPage);
