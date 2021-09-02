import {
  FieldSet,
  MetaWithTotal,
  useApiClient,
  useDinaFormContext,
  useQuery,
  withResponse
} from "common-ui";
import { InputResource, PersistedResource } from "kitsu";
import { useState } from "react";
import { DinaMessage } from "../../intl/dina-ui-intl";
import { StorageUnit } from "../../types/collection-api";
import { StorageTreeList } from "./BrowseStorageTree";
import { StorageLinker } from "./StorageLinker";
import { useRouter } from "next/router";
import Link from "next/link";

export interface StorageTreeFieldProps {
  parentId: string;
}

type StorageActionMode = "VIEW" | "MOVE_ALL" | "ADD_EXISTING_AS_CHILD";

export function StorageUnitChildrenViewer({ parentId }: StorageTreeFieldProps) {
  const { readOnly } = useDinaFormContext();
  const router = useRouter();
  const { apiClient, save } = useApiClient();

  const [actionMode, setActionMode] = useState<StorageActionMode>("VIEW");

  const childrenPath = `collection-api/storage-unit/${parentId}/storageUnitChildren`;

  const childrenQuery = useQuery<StorageUnit[], MetaWithTotal>({
    path: childrenPath
  });

  async function moveAllContent(targetUnit: PersistedResource<StorageUnit>) {
    const { data: children } = await apiClient.get<StorageUnit[]>(
      childrenPath,
      // As of writing this code the "limit" is ignored and the API returns all chlidren:
      { page: { limit: 1000 } }
    );

    // Set first level children to new parent
    await save(
      children.map(child => ({
        resource: {
          type: child.type,
          id: child.id,
          parentStorageUnit: { type: targetUnit.type, id: targetUnit.id }
        },
        type: "storage-unit"
      })),
      { apiBaseUrl: "/collection-api" }
    );

    // Move to the new parent unit's page:
    await router.push(`/collection/storage-unit/view?id=${targetUnit.id}`);
  }

  async function addExistingStorageUnitAsChild(
    newChild: PersistedResource<StorageUnit>
  ) {
    const input: InputResource<StorageUnit> = {
      type: newChild.type,
      id: newChild.id,
      parentStorageUnit: { type: "storage-unit", id: parentId }
    };
    await save([{ resource: input, type: "storage-unit" }], {
      apiBaseUrl: "/collection-api"
    });

    await router.reload();
  }

  return withResponse(
    childrenQuery,
    ({ data: { length: numberOfChildren } }) => (
      <div className="mb-3">
        {actionMode !== "VIEW" && (
          <FieldSet
            legend={
              <div className="d-flex align-items-center gap-2 mb-2">
                <strong>
                  {actionMode === "MOVE_ALL" && (
                    <DinaMessage id="assignContentsToNewStorage" />
                  )}
                  {actionMode === "ADD_EXISTING_AS_CHILD" && (
                    <DinaMessage id="addExistingStorageUnitAsChild" />
                  )}
                </strong>
                <button
                  className="btn btn-dark"
                  onClick={() => setActionMode("VIEW")}
                >
                  <DinaMessage id="cancelButtonText" />
                </button>
              </div>
            }
          >
            {actionMode === "MOVE_ALL" && (
              <StorageLinker onChange={moveAllContent} />
            )}
            {actionMode === "ADD_EXISTING_AS_CHILD" && (
              <StorageLinker onChange={addExistingStorageUnitAsChild} />
            )}
          </FieldSet>
        )}
        {actionMode === "VIEW" && (
          <div>
            <div className="d-flex align-items-center gap-2 mb-2">
              <strong>
                <DinaMessage id="browseContents" />
              </strong>
              {readOnly && (
                <>
                  <button
                    className="btn btn-primary enable-move-content"
                    onClick={() => setActionMode("MOVE_ALL")}
                    disabled={!numberOfChildren}
                  >
                    <DinaMessage id="moveAllContent" />
                  </button>
                  <Link
                    href={`/collection/storage-unit/edit?parentId=${parentId}`}
                  >
                    <a className="btn btn-primary add-child-storage-unit">
                      <DinaMessage id="addNewChildStorageUnit" />
                    </a>
                  </Link>
                  <button
                    className="btn btn-primary add-existing-as-child"
                    onClick={() => setActionMode("ADD_EXISTING_AS_CHILD")}
                  >
                    <DinaMessage id="addExistingStorageUnitAsChild" />
                  </button>
                </>
              )}
            </div>
            <div style={{ borderStyle: "dotted" }}>
              <StorageTreeList parentId={parentId} disabled={true} />
            </div>
          </div>
        )}
      </div>
    )
  );
}
