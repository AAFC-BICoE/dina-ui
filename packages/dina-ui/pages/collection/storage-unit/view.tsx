import {
  BackButton,
  ButtonBar,
  DinaForm,
  EditButton,
  useApiClient,
  useModal,
  useQuery,
  withResponse
} from "common-ui";
import { WithRouterProps } from "next/dist/client/with-router";
import { withRouter } from "next/router";
import { Head, Nav, storageUnitDisplayName } from "../../../components";
import { useDinaIntl } from "../../../intl/dina-ui-intl";
import { StorageUnit } from "../../../types/collection-api";
import { StorageUnitFormFields, useStorageUnit } from "./edit";

export function StorageUnitDetailsPage({ router }: WithRouterProps) {
  const id = router.query.id?.toString();
  const { formatMessage } = useDinaIntl();

  const { save } = useApiClient();

  const { openModal } = useModal();

  const storageUnitQuery = useStorageUnit(id);
  const childrenQuery = useQuery<StorageUnit[]>(
    {
      path: `collection-api/storage-unit/${id}/storageUnitChildren`
    },
    { disabled: !id }
  );
  const children = childrenQuery.response?.data;

  const storageUnit = storageUnitQuery.response?.data;

  async function moveAllContentToNewContainer(submittedValues) {
    const parentUnit = submittedValues.parentStorageUnit;
    // Set first level children to new parent
    if (children) {
      await save(
        children.map(child => ({
          resource: {
            type: child.type,
            id: child.id,
            parentStorageUnit: parentUnit
          },
          type: "storage-unit"
        })),
        { apiBaseUrl: "/collection-api" }
      );
    }
    // Move to the new parent unit's page:
    await router.push(`/collection/storage-unit/view?id=${parentUnit.id}`);
  }

  return (
    <div>
      <Nav />
      <main className="container">
        {withResponse(storageUnitQuery, ({ data: strgUnit }) => {
          const buttonBar = (
            <ButtonBar>
              <BackButton
                entityId={strgUnit.id}
                entityLink="/collection/storage-unit"
                byPassView={true}
              />
              {!children?.length && (
                <EditButton
                  className="ms-auto"
                  entityId={strgUnit.id}
                  entityLink="collection/storage-unit"
                />
              )}
            </ButtonBar>
          );

          return (
            <>
              <Head title={storageUnitDisplayName(strgUnit)} />
              {buttonBar}
              <DinaForm<StorageUnit> initialValues={strgUnit} readOnly={true}>
                <StorageUnitFormFields />
              </DinaForm>
            </>
          );
        })}
      </main>
    </div>
  );
}

export default withRouter(StorageUnitDetailsPage);
