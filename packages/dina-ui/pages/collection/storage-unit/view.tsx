import {
  BackButton,
  ButtonBar,
  DinaForm,
  EditButton,
  Tooltip,
  useApiClient,
  useModal,
  useQuery,
  withResponse
} from "common-ui";
import { WithRouterProps } from "next/dist/client/with-router";
import { withRouter } from "next/router";
import { Head, Nav, storageUnitDisplayName } from "../../../components";
import { StorageUnit } from "../../../types/collection-api";
import { StorageUnitFormFields, useStorageUnit } from "./edit";
import { useState } from "react";

export function StorageUnitDetailsPage({ router }: WithRouterProps) {
  const id = router.query.id?.toString();
  const storageUnitQuery = useStorageUnit(id);
  const childrenQuery = useQuery<StorageUnit>(
    {
      path: `collection-api/storage-unit/${id}?include=storageUnitChildren`
    },
    { disabled: !id }
  );

  const children = childrenQuery.response?.data.storageUnitChildren;

  const [visible, setVisible] = useState(false);

  return (
    <div>
      <Nav />
      <main className="container">
        {withResponse(storageUnitQuery, ({ data: strgUnit }) => {
          const hasChildren = !!children?.length;

          const editButton = (
            <EditButton
              entityId={strgUnit.id}
              entityLink="collection/storage-unit"
              disabled={hasChildren}
              onKeyUp={e =>
                e.key === "Escape" ? setVisible(false) : setVisible(true)
              }
              onMouseOver={() => setVisible(true)}
              onMouseOut={() => setVisible(false)}
              onBlur={() => setVisible(false)}
              ariaDescribedBy={"notEditableWhenThereAreChildStorageUnits"}
            />
          );

          const buttonBar = (
            <ButtonBar>
              <BackButton
                entityId={strgUnit.id}
                entityLink="/collection/storage-unit"
                byPassView={true}
              />
              <div className="ms-auto">
                {hasChildren ? (
                  <Tooltip
                    visibleElement={editButton}
                    setVisible={setVisible}
                    visible={visible}
                    id="notEditableWhenThereAreChildStorageUnits"
                  />
                ) : (
                  editButton
                )}
              </div>
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
