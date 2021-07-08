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
import { useState } from "react";

export function StorageUnitDetailsPage({ router }: WithRouterProps) {
  const id = String(router.query.id);
  const { formatMessage } = useDinaIntl();
  const [parent, setParent] = useState<StorageUnit>();

  const { save } = useApiClient();

  const { openModal } = useModal();

  const StorageUnitQuery = useQuery<StorageUnit>(
    {
      path: `collection-api/storage-unit/${id}`,
      include: "storageUnitChildren,parentStorageUnit"
    },
    { deps: [parent] }
  );

  const storageUnit = StorageUnitQuery.response?.data;

  async function moveAllContentToNewContainer(submittedValues) {
    const parentUnit = submittedValues.parentStorageUnit;
    const children = storageUnit?.storageUnitChildren;
    // Set first level children to new parent
    if (children) {
      await save(
        children?.map(child => {
          (child as any).relationships = {};
          (child as any).relationships.storageUnitChildren = {
            data: child?.storageUnitChildren?.map(it => ({
              id: it.id,
              type: it.type
            }))
          };
          delete child.storageUnitChildren;
          return {
            resource: {
              type: child.type,
              id: child.id,
              parentStorageUnit: parentUnit
            },
            type: "storage-unit"
          };
        }) as any,
        { apiBaseUrl: "/collection-api" }
      );
    }
    setParent(parentUnit);
  }

  function onMoveAllContentClick() {
    const exclusionNames: string[] = [];
    function setExclusionContainerNames(container: StorageUnit) {
      exclusionNames.push(container.name);
      container?.storageUnitChildren?.map(child =>
        setExclusionContainerNames(child)
      );
    }

    setExclusionContainerNames(storageUnit as any);

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
      {!!strgUnit.storageUnitChildren?.length && (
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
        {withResponse(StorageUnitQuery, ({ data: strgUnit }) => {
          return (
            <>
              {buttonBar(strgUnit)}
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
