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
import ReactTable from "react-table";

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

  const samplesQueryParams = {
    path: "collection-api/material-sample",
    filter: { rsql: `storageUnit.uuid==${storageUnit?.id}` }
  };

  const { response } = useQuery<MaterialSample[], MetaWithTotal>(
    samplesQueryParams
  );
  const materialSamples: MaterialSample[] = response?.data ?? [];

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
      parentStorageUnit: { type: "storage-unit", id: storageUnit?.id ?? "" }
    };
    await save([{ resource: input, type: "storage-unit" }], {
      apiBaseUrl: "/collection-api"
    });

    await router.reload();
  }

  const isEmpty = !(
    (storageUnit?.storageUnitChildren?.length ?? 0) + materialSamples.length
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
            <StorageLinker
              actionMode="ADD_EXISTING_AS_CHILD"
              onChange={addExistingStorageUnitAsChild}
            />
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
            materialSamples={materialSamples}
            storageUnit={storageUnit}
          />
        </div>
      )}
    </div>
  );
}

export interface StorageUnitContentsProps {
  storageUnit: StorageUnit;
  materialSamples: MaterialSample[];
}

/** Material Sample table and nested Storage Units UI. */
export function StorageUnitContents({
  storageUnit,
  materialSamples
}: StorageUnitContentsProps) {
  return (
    <div
      className="p-2 mb-3"
      style={{ border: "1px solid #d3d7cf", backgroundColor: "#f3f3f3" }}
    >
      <div className="mb-3">
        <strong>
          <DinaMessage id="materialSamples" />
        </strong>

        <ReactTable
          className="-striped"
          columns={[
            {
              Cell: ({
                original: { id, materialSampleName, dwcOtherCatalogNumbers }
              }) => (
                <Link href={`/collection/material-sample/view?id=${id}`}>
                  {materialSampleName ||
                    dwcOtherCatalogNumbers?.join?.(", ") ||
                    id}
                </Link>
              ),
              accessor: "materialSampleName",
              Header: <DinaMessage id="materialSampleName" />
            },
            {
              accessor: "materialSampleType",
              Header: <DinaMessage id="field_materialSampleType.name" />
            },
            {
              Cell: ({ original: { tags } }) => <>{tags?.join(", ")}</>,
              accessor: "tags",
              Header: <DinaMessage id="tags" />
            }
          ]}
          data={materialSamples as any}
          minRows={1}
          showPagination={false}
        />
      </div>
      <div className="mb-3">
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
    </div>
  );
}
