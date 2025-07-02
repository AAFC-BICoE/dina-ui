import {
  ColumnDefinition,
  FilterGroupModel,
  FormikButton,
  QueryTable,
  rsql
} from "common-ui";
import { KitsuResourceLink } from "kitsu";
import Link from "next/link";
import { useState } from "react";
import { Promisable } from "type-fest";
import { DinaMessage } from "../../intl/dina-ui-intl";
import { StorageUnit } from "../../types/collection-api";
import { StorageFilter } from "./StorageFilter";
import { storageUnitDisplayName } from "./StorageUnitBreadCrumb";

export interface StorageSearchSelectorProps {
  /**
   * To prevent displaying itself in the search results, this UUID will be filtered from the
   * results.
   */
  parentStorageUnitUUID?: string;

  onChange: (newValue: KitsuResourceLink) => Promisable<void>;
}

/** Table UI to search for and select a Storage Unit. */
export function StorageSearchSelector({
  onChange,
  parentStorageUnitUUID
}: StorageSearchSelectorProps) {
  const [filter, setFilter] = useState<FilterGroupModel | null>();

  const tableColumns: ColumnDefinition<StorageUnit>[] = [
    {
      cell: ({ row: { original } }) => (
        <Link
          href={`/collection/storage-unit/view?id=${original.id}`}
          target="_blank"
        >
          {storageUnitDisplayName(original)}
        </Link>
      ),
      size: 400,
      accessorKey: "name"
    },
    {
      cell: ({ row: { original } }) =>
        // Display location if storage unit has a parent
        original.hierarchy &&
        original.hierarchy.length > 1 && <>{original.hierarchy[1].name}</>,
      accessorKey: "location",
      enableSorting: false
    },
    {
      cell: ({ row: { original } }) => (
        <FormikButton
          className="btn btn-primary select-storage"
          onClick={async () =>
            await onChange({ id: original.id ?? "", type: original.type })
          }
        >
          <DinaMessage id="select" />
        </FormikButton>
      ),
      size: 250,
      accessorKey: "select",
      enableSorting: false
    }
  ];

  return (
    <div className="storage-search-selector">
      <style>{`
        .storage-search-selector .rt-tr-group:hover {
          background-color: rgb(222, 252, 222) !important;
        }
      `}</style>
      <StorageFilter
        onChange={setFilter}
        parentStorageUnitUUID={parentStorageUnitUUID}
      />
      <QueryTable
        columns={tableColumns}
        path="collection-api/storage-unit"
        include="hierarchy,storageUnitType"
        // Sort by newest:
        defaultSort={[{ id: "createdOn", desc: true }]}
        reactTableProps={() => ({ enableSorting: false })}
        filter={{
          rsql: rsql({
            type: "FILTER_GROUP",
            id: -123,
            operator: "AND",
            children: [...(filter ? [filter] : [])]
          })
        }}
      />
    </div>
  );
}
