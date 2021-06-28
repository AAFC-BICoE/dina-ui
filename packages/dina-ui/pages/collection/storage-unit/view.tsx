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
  ResourceSelect,
  filterBy
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

  const StorageUnitQuery = useQuery<StorageUnit>({
    path: `collection-api/storage-unit/${id}`
  });

  const storageUnit = StorageUnitQuery.response?.data;

  const { openModal } = useModal();

  const [children, SetChildren] = useState(storageUnit?.storageUnitChildren);
  const [parent, SetParent] = useState();

  function moveAllContentToNewContainer(submittedValues) {
    const parentUnit = submittedValues.parentStorageUnit;
    children?.map(child => (child.parentStorageUnit = parentUnit));
    SetParent(parentUnit);
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
          <ResourceSelect<StorageUnit>
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

    SetChildren([]);
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
      <button
        className="btn btn-info moveAllContent"
        onClick={onMoveAllContentClick}
      >
        <DinaMessage id="moveAllContent" />
      </button>
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
