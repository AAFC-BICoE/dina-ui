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
import { StorageUnitType } from "../../../types/collection-api";
import { StorageUnitTypeFormFields } from "./edit";

export function StorageUnitTypeDetailsPage({ router }: WithRouterProps) {
  const id = String(router.query.id);
  const { formatMessage } = useDinaIntl();

  const storageUnitTypeQuery = useQuery<StorageUnitType>({
    path: `collection-api/storage-unit-type/${id}`
  });

  return (
    <div>
      <Head title={formatMessage("storageUnitType")}
						lang={formatMessage("languageOfPage")} 
						creator={formatMessage("agricultureCanada")}
						subject={formatMessage("subjectTermsForPage")} />
			<Nav />
      <main className="container">
        <ButtonBar>
          <BackButton
            entityId={id}
            entityLink="/collection/storage-unit-type"
            byPassView={true}
          />
          <EditButton
            className="ms-auto"
            entityId={id}
            entityLink="collection/storage-unit-type"
          />
          <DeleteButton
            className="ms-5"
            id={id}
            options={{ apiBaseUrl: "/collection-api" }}
            postDeleteRedirect="/collection/storage-unit-type/list"
            type="storage-unit-type"
          />
        </ButtonBar>
        {withResponse(storageUnitTypeQuery, ({ data: storageUnitType }) => (
          <DinaForm<StorageUnitType>
            initialValues={storageUnitType}
            readOnly={true}
          >
            <StorageUnitTypeFormFields />
          </DinaForm>
        ))}
      </main>
    </div>
  );
}

export default withRouter(StorageUnitTypeDetailsPage);
