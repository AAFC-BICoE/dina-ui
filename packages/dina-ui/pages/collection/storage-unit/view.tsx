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
import { StorageUnit } from "../../../types/collection-api";
import { StorageUnitFormFields } from "./edit";

export function StorageUnitDetailsPage({ router }: WithRouterProps) {
  const id = String(router.query.id);
  const { formatMessage } = useDinaIntl();

  const StorageUnitQuery = useQuery<StorageUnit>({
    path: `collection-api/storage-unit/${id}`
  });

  return (
    <div>
      <Head title={formatMessage("storageUnitViewTitle")} />
      <Nav />
      <main className="container">
        <ButtonBar>
          <BackButton
            entityId={id}
            entityLink="/collection/storage-unit"
            byPassView={true}
          />
          <EditButton
            className="ms-auto"
            entityId={id}
            entityLink="collection/storage-unit"
          />
          <DeleteButton
            className="ms-5"
            id={id}
            options={{ apiBaseUrl: "/collection-api" }}
            postDeleteRedirect="/collection/storage-unit/list"
            type="storage-unit"
          />
        </ButtonBar>
        {withResponse(StorageUnitQuery, ({ data: storageUnit }) => (
          <DinaForm<StorageUnit> initialValues={storageUnit} readOnly={true}>
            <StorageUnitFormFields />
          </DinaForm>
        ))}
      </main>
    </div>
  );
}

export default withRouter(StorageUnitDetailsPage);
