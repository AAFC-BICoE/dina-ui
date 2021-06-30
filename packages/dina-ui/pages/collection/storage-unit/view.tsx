import {
  BackButton,
  ButtonBar,
  DeleteButton,
  DinaForm,
  EditButton,
  useQuery,
  withResponse,
  useModal,
  AreYouSureModal,
  ResourceSelectField,
  filterBy,
  useApiClient
} from "common-ui";
import { WithRouterProps } from "next/dist/client/with-router";
import { withRouter } from "next/router";
import { Head, Nav } from "../../../components";
import { useDinaIntl, DinaMessage } from "../../../intl/dina-ui-intl";
import { StorageUnit } from "../../../types/collection-api";
import { StorageUnitFormFields } from "./edit";

export function StorageUnitDetailsPage({ router }: WithRouterProps) {
  const id = String(router.query.id);
  const { formatMessage } = useDinaIntl();

  const StorageUnitQuery = useQuery<StorageUnit>({
    path: `collection-api/storage-unit/${id}`,
    include: "storageUnitChildren, parentStorageUnit"
  });

  const storageUnit = StorageUnitQuery.response?.data;

  const { save } = useApiClient();

  const { openModal } = useModal();

  async function moveAllContentToNewContainer(submittedValues) {
    const parentUnit = submittedValues.parentStorageUnit;
    const children = storageUnit?.storageUnitChildren;
    children?.map(child => {
      child.parentStorageUnit = parentUnit;
      return {
        resource: child,
        type: "storage-unit"
      };
    });

    // Set first level children to new parent
    if (children) {
      const savedChildren = await save(
        children?.map(child => {
          (child as any).relationships = {};
          (child as any).relationships.storageUnitChildren = {
            data: child?.storageUnitChildren?.map(it => ({
              id: it.id,
              type: it.type
            }))
          };
          delete child.storageUnitChildren;
          child.parentStorageUnit = parentUnit;
          return {
            resource: child,
            type: "storage-unit"
          };
        }) as any,
        { apiBaseUrl: "/collection-api" }
      );

      await router.push(`/collection/storage-unit/edit?id=${id}`);
    }
  }

  function onMoveAllContentClick() {
    // request to remove all children
    openModal(
      <AreYouSureModal
        actionMessage={
          <span>
            <DinaMessage id="specifyParentContainer" />
          </span>
        }
        messageBody={
          <ResourceSelectField<StorageUnit>
            name="parentStorageUnit"
            model="collection-api/storage-unit"
            optionLabel={it => it.name}
            filter={input => ({
              ...filterBy(["name"])(input)
            })}
          />
        }
        onYesButtonClicked={moveAllContentToNewContainer}
      />
    );
  }

  const buttonBar = (strgUnit: StorageUnit) => (
    <ButtonBar>
      <BackButton
        entityId={id}
        entityLink="/collection/storage-unit"
        byPassView={true}
      />
      {!strgUnit.storageUnitChildren?.length && (
        <EditButton
          className="ms-auto"
          entityId={id}
          entityLink="collection/storage-unit"
        />
      )}
      {!strgUnit.storageUnitChildren?.length && (
        <DeleteButton
          className="ms-5"
          id={id}
          options={{ apiBaseUrl: "/collection-api" }}
          postDeleteRedirect="/collection/storage-unit/list"
          type="storage-unit"
        />
      )}
      {strgUnit.storageUnitChildren?.length && (
        <button
          className="btn btn-info moveAllContent ms-auto"
          onClick={onMoveAllContentClick}
        >
          <DinaMessage id="moveAllContent" />
        </button>
      )}
    </ButtonBar>
  );

  return (
    <div>
      <Head title={formatMessage("storageUnitViewTitle")} />
      <Nav />
      <main className="container">
        {withResponse(StorageUnitQuery, ({ data: strgUnit }) => (
          <>
            {buttonBar(strgUnit)}
            <DinaForm<StorageUnit> initialValues={strgUnit} readOnly={true}>
              <StorageUnitFormFields />
            </DinaForm>
          </>
        ))}
      </main>
    </div>
  );
}

export default withRouter(StorageUnitDetailsPage);
