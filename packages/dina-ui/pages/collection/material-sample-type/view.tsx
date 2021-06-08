import {
  BackButton,
  ButtonBar,
  DeleteButton,
  DinaForm,
  EditButton,
  useQuery,
  withResponse
} from "common-ui";
import { WithRouterProps } from "next/dist/client/with-router";
import { withRouter } from "next/router";
import { Head, Nav } from "../../../components";
import { useDinaIntl } from "../../../intl/dina-ui-intl";
import { MaterialSampleType } from "../../../types/collection-api";
import { MaterialSampleTypeFormFields } from "./edit";

export function MaterialSampleTypeDetailsPage({ router }: WithRouterProps) {
  const id = String(router.query.id);
  const { formatMessage } = useDinaIntl();

  const materialSampleTypeQuery = useQuery<MaterialSampleType>({
    path: `collection-api/material-sample-type/${id}`
  });

  return (
    <div>
      <Head title={formatMessage("materialSampleTypeViewTitle")} />
      <Nav />
      <main className="container">
        <ButtonBar>
          <BackButton
            entityId={id}
            entityLink="/collection/material-sample-type"
            byPassView={true}
          />
          <EditButton
            className="ms-auto"
            entityId={id}
            entityLink="collection/material-sample-type"
          />
          <DeleteButton
            className="ms-5"
            id={id}
            options={{ apiBaseUrl: "/collection-api" }}
            postDeleteRedirect="/collection/material-sample-type/list"
            type="material-sample-type"
          />
        </ButtonBar>
        {withResponse(materialSampleTypeQuery, ({ data: mst }) => (
          <DinaForm<MaterialSampleType> initialValues={mst} readOnly={true}>
            <MaterialSampleTypeFormFields />
          </DinaForm>
        ))}
      </main>
    </div>
  );
}

export default withRouter(MaterialSampleTypeDetailsPage);
