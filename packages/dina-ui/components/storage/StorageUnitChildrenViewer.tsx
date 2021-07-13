import {
  FieldSet,
  MetaWithTotal,
  useApiClient,
  useDinaFormContext,
  useQuery,
  withResponse
} from "common-ui";
import { PersistedResource } from "kitsu";
import { useState } from "react";
import { DinaMessage } from "../../intl/dina-ui-intl";
import { StorageUnit } from "../../types/collection-api";
import { StorageTreeList } from "./BrowseStorageTree";
import { StorageLinker } from "./StorageLinker";
import { useRouter } from "next/router";

export interface StorageTreeFieldProps {
  parentId: string;
}

export function StorageUnitChildrenViewer({ parentId }: StorageTreeFieldProps) {
  const { readOnly } = useDinaFormContext();
  const router = useRouter();
  const { apiClient, save } = useApiClient();

  const [moveAllMode, setMoveAllMode] = useState(false);

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

  return withResponse(
    childrenQuery,
    ({ data: { length: numberOfChildren } }) => (
      <div className="mb-3">
        {moveAllMode ? (
          <FieldSet
            legend={
              <div className="d-flex align-items-center gap-2 mb-2">
                <strong>
                  <DinaMessage id="assignContentsToNewStorage" />
                </strong>
                <button
                  className="btn btn-dark"
                  onClick={() => setMoveAllMode(false)}
                >
                  <DinaMessage id="cancelButtonText" />
                </button>
              </div>
            }
          >
            <StorageLinker onChange={moveAllContent} />
          </FieldSet>
        ) : (
          <div>
            <div className="d-flex align-items-center gap-2 mb-2">
              <strong>
                <DinaMessage id="browseContents" />
              </strong>
              {readOnly && (
                <button
                  className="btn btn-primary enable-move-content"
                  onClick={() => setMoveAllMode(true)}
                  disabled={!numberOfChildren}
                >
                  <DinaMessage id="moveAllContent" />
                </button>
              )}
            </div>
            <div style={{ borderStyle: "dotted" }}>
              <StorageTreeList
                className="col-md-6 mb-2"
                parentId={parentId}
                disabled={true}
              />
            </div>
          </div>
        )}
      </div>
    )
  );
}
