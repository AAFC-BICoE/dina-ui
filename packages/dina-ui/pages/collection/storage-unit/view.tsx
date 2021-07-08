import {
  AreYouSureModal,
  BackButton,
  ButtonBar,
  DeleteButton,
  DinaForm,
  EditButton,
  filterBy,
  ResourceSelectField,
  useApiClient,
  useModal,
  useQuery,
  withResponse
} from "common-ui";
import { WithRouterProps } from "next/dist/client/with-router";
import { withRouter } from "next/router";
import { Head, Nav } from "../../../components";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
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

  function onMoveAllContentClick() {
    // const exclusionNames: string[] = [];
    // exclusionNames.push(storageUnit?.name as string);

    // function setExclusionContainerNames(container: StorageUnit) {
    //   exclusionNames.push(container.name);
    //   container.storageUnitChildren?.map(child =>
    //     setExclusionContainerNames(child)
    //   );
    // }

    // children?.map(child => setExclusionContainerNames(child as any));

    openModal(
      <AreYouSureModal
        actionMessage={
          <span>
            <DinaMessage id="specifyParentContainer" />
          </span>
        }
        messageBody={
          <div style={{ minHeight: "400px" }}>
            <ResourceSelectField<StorageUnit>
              name="parentStorageUnit"
              model={`collection-api/storage-unit`}
              optionLabel={it => it.name}
              // Comment out as CRNK has not fully support on "NOT" operator yet
              // https://www.crnk.io/releases/stable/documentation/#_nested_filtering
              // https://github.com/crnk-project/crnk-framework/issues/278
              filter={input => ({
                ...filterBy(["name"])(input) // ,
                //              name: { NOT: `${exclusionNames}` }
              })}
            />
          </div>
        }
        onYesButtonClicked={moveAllContentToNewContainer}
      />
    );
  }

  return (
    <div>
      <Head title={formatMessage("storageUnitViewTitle")} />
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
              {!children?.length && (
                <DeleteButton
                  className="ms-5"
                  id={strgUnit.id}
                  options={{ apiBaseUrl: "/collection-api" }}
                  postDeleteRedirect="/collection/storage-unit/list"
                  type="storage-unit"
                />
              )}
              {!!children?.length && (
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
            <>
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
