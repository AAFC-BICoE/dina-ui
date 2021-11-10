import {
  ColumnDefinition,
  FieldSet,
  MetaWithTotal,
  QueryTable,
  useApiClient,
  useDinaFormContext,
  useQuery,
  withResponse
} from "common-ui";
import { InputResource, PersistedResource } from "kitsu";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import { DinaMessage } from "../../intl/dina-ui-intl";
import { MaterialSample, StorageUnit } from "../../types/collection-api";
import { StorageTreeList } from "./BrowseStorageTree";
import { StorageLinker } from "./StorageLinker";

export interface StorageTreeFieldProps {
  parentId: string;
}

type StorageActionMode = "VIEW" | "MOVE_ALL" | "ADD_EXISTING_AS_CHILD";

export function StorageUnitChildrenViewer({ parentId }: StorageTreeFieldProps) {
  const { readOnly } = useDinaFormContext();
  const router = useRouter();
  const { apiClient, save } = useApiClient();

  const [actionMode, setActionMode] = useState<StorageActionMode>("VIEW");

  const childStoragePath = `collection-api/storage-unit/${parentId}?include=storageUnitChildren`;

  const childStorageQuery = useQuery<StorageUnit, MetaWithTotal>({
    path: childStoragePath
  });
  const samplesQueryParams = {
    path: "collection-api/material-sample",
    filter: { rsql: `storageUnit.uuid==${parentId}` }
  };

  const samplesQuery = useQuery<MaterialSample[], MetaWithTotal>(
    samplesQueryParams
  );

  async function moveAllContent(targetUnit: PersistedResource<StorageUnit>) {
    const {
      data: { storageUnitChildren: nestedStorages }
    } = await apiClient.get<StorageUnit>(
      childStoragePath,
      // As of writing this code the "limit" is ignored and the API returns all chlidren:
      { page: { limit: 1000 } }
    );

    const { data: childSamples } = await apiClient.get<MaterialSample[]>(
      samplesQueryParams.path,
      {
        filter: samplesQueryParams.filter,
        page: { limit: 1000 }
      }
    );

    const children = [
      ...(nestedStorages?.map(it => ({
        id: it.uuid ?? it.id,
        type: "storage-unit"
      })) ?? []),
      ...childSamples
    ];

    // Set first level children to new parent
    if (children) {
      await save(
        children.map(child => ({
          resource: {
            id: child.id,
            type: child.type,
            [child.type === "storage-unit"
              ? "parentStorageUnit"
              : "storageUnit"]: { type: targetUnit.type, id: targetUnit.id }
          },
          type: child.type
        })),
        { apiBaseUrl: "/collection-api" }
      );
    }

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

  return withResponse(childStorageQuery, ({ data: childStorages }) =>
    withResponse(samplesQuery, ({ data: samples }) => {
      const isEmpty = !(
        (childStorages.storageUnitChildren?.length ?? 0) + samples.length
      );
      return (
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
                      disabled={isEmpty}
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
              <StorageUnitContents storageId={parentId} />
            </div>
          )}
        </div>
      );
    })
  );
}

export interface StorageUnitContentsProps {
  storageId: string;
  excludeContentId?: string;
}

/** Material Sample table and nested Storage Units UI. */
export function StorageUnitContents({
  excludeContentId = "00000000-0000-0000-0000-000000000000",
  storageId
}) {
  const materialSampleColumns: ColumnDefinition<MaterialSample>[] = [
    {
      Cell: ({
        original: { id, materialSampleName, dwcOtherCatalogNumbers }
      }) => (
        <Link href={`/collection/material-sample/view?id=${id}`}>
          {materialSampleName || dwcOtherCatalogNumbers?.join?.(", ") || id}
        </Link>
      ),
      accessor: "materialSampleName"
    },
    "materialSampleType.name",
    {
      Cell: ({ original: { tags } }) => <>{tags?.join(", ")}</>,
      accessor: "tags"
    }
  ];

  return (
    <div className="p-2 mb-3" style={{ borderStyle: "dotted" }}>
      <div className="mb-3">
        <strong>
          <DinaMessage id="materialSamples" />
        </strong>
        <QueryTable
          columns={materialSampleColumns}
          path="collection-api/material-sample"
          filter={{
            rsql: `storageUnit.uuid==${storageId} and uuid!=${excludeContentId}`
          }}
        />
      </div>
      <div className="mb-3">
        <strong>
          <DinaMessage id="nestedStorageUnits" />
        </strong>
        <StorageTreeList parentId={storageId} disabled={true} />
      </div>
    </div>
  );
}
