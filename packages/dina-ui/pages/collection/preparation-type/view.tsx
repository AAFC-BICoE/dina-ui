import {
  BackButton,
  ButtonBar,
  DinaForm,
  FieldView,
  useQuery,
  withResponse,
  EditButton,
  DeleteButton
} from "common-ui";
import { WithRouterProps } from "next/dist/client/with-router";
import { withRouter } from "next/router";
import { PreparationType } from "packages/dina-ui/types/collection-api/resources/PreparationType";
import { Footer, Head, Nav, GroupSelectField } from "../../../components";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";

export function PreparationTypeDetailsPage({ router }: WithRouterProps) {
  const { id } = router.query;
  const { formatMessage } = useDinaIntl();

  const prepTypeQuery = useQuery<PreparationType>({
    path: `collection-api/preparation-type/${id}`
  });

  return (
    <div>
      <Head title={formatMessage("preparationTypeViewTitle")} />
      <Nav />
      <ButtonBar>
        <BackButton
          entityId={id as string}
          entityLink="/collection/preparation-type"
          byPassView={true}
        />
        <EditButton
          className="ms-auto"
          entityId={id as string}
          entityLink="collection/preparation-type"
        />
        <DeleteButton
          className="ms-5"
          id={id as string}
          options={{ apiBaseUrl: "/collection-api" }}
          postDeleteRedirect="/collection/preparation-type/list"
          type="preparation-type"
        />
      </ButtonBar>
      <main className="container-fluid">
        <h1>
          <DinaMessage id="preparationTypeViewTitle" />
        </h1>
        {withResponse(prepTypeQuery, ({ data: preparationType }) => (
          <DinaForm<PreparationType>
            initialValues={preparationType}
            readOnly={true}
          >
            <div>
              <div className="row">
                <GroupSelectField
                  name="group"
                  enableStoredDefaultGroup={true}
                  className="col-md-6"
                />
              </div>
              <div className="row">
                <FieldView
                  className="col-md-6"
                  name="name"
                  label={formatMessage("preparationTypeNameLabel")}
                />
              </div>
            </div>
          </DinaForm>
        ))}
      </main>
      <Footer />
    </div>
  );
}

export default withRouter(PreparationTypeDetailsPage);
