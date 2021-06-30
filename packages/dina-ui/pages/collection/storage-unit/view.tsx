import {
  BackButton,
  ButtonBar,
  DeleteButton,
  DinaForm,
  EditButton,
  withResponse
} from "common-ui";
import { WithRouterProps } from "next/dist/client/with-router";
import { withRouter } from "next/router";
import { Head, Nav } from "../../../components";
import { useDinaIntl } from "../../../intl/dina-ui-intl";
import { StorageUnit } from "../../../types/collection-api";
import { StorageUnitFormFields, useStorageUnit } from "./edit";

export function StorageUnitDetailsPage({ router }: WithRouterProps) {
  const id = router.query.id?.toString();
  const { formatMessage } = useDinaIntl();

  const storageUnitQuery = useStorageUnit(id);

  return (
    <div>
      <Head title={formatMessage("storageUnitViewTitle")} />
      <Nav />
      <main className="container">
        {withResponse(storageUnitQuery, ({ data: storageUnit }) => (
          <DinaForm<StorageUnit> initialValues={storageUnit} readOnly={true}>
            <ButtonBar>
              <BackButton
                entityId={storageUnit.id}
                entityLink="/collection/storage-unit"
                byPassView={true}
              />
              <EditButton
                className="ms-auto"
                entityId={storageUnit.id}
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
            <StorageUnitFormFields />
          </DinaForm>
        ))}
      </main>
    </div>
  );
}

export default withRouter(StorageUnitDetailsPage);
