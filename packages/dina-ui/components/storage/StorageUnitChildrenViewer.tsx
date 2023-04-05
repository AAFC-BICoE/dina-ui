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
import { useState, useRef } from "react";
import { DinaMessage } from "../../intl/dina-ui-intl";
import { MaterialSample, StorageUnit } from "../../types/collection-api";
import { StorageTreeList } from "./BrowseStorageTree";
import { StorageLinker } from "./StorageLinker";

export interface StorageTreeFieldProps {
  storageUnit: StorageUnit;
}

export type StorageActionMode = "VIEW" | "MOVE_ALL" | "ADD_EXISTING_AS_CHILD";

export function StorageUnitChildrenViewer({
  storageUnit
}: StorageTreeFieldProps) {
  const { readOnly } = useDinaFormContext();
  const router = useRouter();
  const { apiClient, save } = useApiClient();
  const [actionMode, setActionMode] = useState<StorageActionMode>("VIEW");
  const [hideMoveContents, setHideMoveContents] = useState<boolean>(false);

  const samplesQueryParams = {
    path: "collection-api/material-sample",
    filter: { rsql: `storageUnit.uuid==${storageUnit?.id}` }
  };

  async function moveAllContent(targetUnit: PersistedResource<StorageUnit>) {
    const childStoragePath = `collection-api/storage-unit/${storageUnit?.id}?include=storageUnitChildren`;

    const {
      data: { storageUnitChildren: nestedStorages }
    } = await apiClient.get<StorageUnit>(
      childStoragePath,
      // As of writing this code the "limit" is ignored and the API returns all children:
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
      ...(nestedStorages?.map((it) => ({
        id: it.uuid ?? it.id,
        type: "storage-unit"
      })) ?? []),
      ...childSamples
    ];

    // Set first level children to new parent
    if (children) {
      await save(
        children.map((child) => ({
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
      parentStorageUnit: { type: "storage-unit", id: storageUnit?.id ?? "" }
    };
    await save([{ resource: input, type: "storage-unit" }], {
      apiBaseUrl: "/collection-api"
    });

    await router.reload();
  }

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
            <StorageLinker
              actionMode="ADD_EXISTING_AS_CHILD"
              onChange={addExistingStorageUnitAsChild}
              createStorageMode={false}
            />
          )}
        </FieldSet>
      )}
      {actionMode === "VIEW" && (
        <div>
          <div className="d-flex align-items-center gap-2 mb-3">
            <strong>
              <DinaMessage id="browseContents" />
            </strong>
            {readOnly && (
              <>
                <button
                  className="btn btn-primary enable-move-content"
                  onClick={() => setActionMode("MOVE_ALL")}
                  disabled={hideMoveContents}
                >
                  <DinaMessage id="moveAllContent" />
                </button>
                <Link
                  href={`/collection/storage-unit/edit?parentId=${storageUnit.id}`}
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
          <StorageUnitContents
            onEmptyMaterialSamples={() => setHideMoveContents(true)}
            storageUnit={storageUnit}
          />
        </div>
      )}
    </div>
  );
}

export interface StorageUnitContentsProps {
  storageUnit: StorageUnit;
  onEmptyMaterialSamples: () => void;
}

/** Material Sample table and nested Storage Units UI. */
export function StorageUnitContents({
  storageUnit,
  onEmptyMaterialSamples
}: StorageUnitContentsProps) {
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
    "materialSampleType",
    {
      Cell: ({ original: { tags } }) => <>{tags?.join(", ")}</>,
      accessor: "tags"
    }
  ];

  return (
    <>
      <div
        className="p-2 mb-3"
        style={{ border: "1px solid #d3d7cf", backgroundColor: "#f3f3f3" }}
      >
        <strong>
          <DinaMessage id="childrenStorageUnits" />
        </strong>
        <StorageTreeList
          storageUnitChildren={
            storageUnit.storageUnitChildren as PersistedResource<StorageUnit>[]
          }
          disabled={true}
        />
      </div>
      <div
        className="p-2 mb-3"
        style={{ border: "1px solid #d3d7cf", backgroundColor: "#f3f3f3" }}
      >
        <strong>
          <DinaMessage id="materialSamples" />
        </strong>

        <QueryTable
          columns={materialSampleColumns}
          path="collection-api/material-sample"
          filter={{
            rsql: `storageUnit.uuid==${storageUnit.id}`
          }}
          onSuccess={({ meta }) => {
            if (meta.totalResourceCount === 0) {
              onEmptyMaterialSamples();
            }
          }}
        />
      </div>
    </>
  );
}
