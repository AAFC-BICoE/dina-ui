import {
  ColumnDefinition8,
  FilterGroupModel,
  FormikButton,
  QueryTable8,
  rsql,
  useDinaFormContext
} from "common-ui";
import { KitsuResourceLink } from "kitsu";
import Link from "next/link";
import { useState } from "react";
import { Promisable } from "type-fest";
import { DinaMessage } from "../../intl/dina-ui-intl";
import { StorageUnit } from "../../types/collection-api";
import { StorageFilter } from "./StorageFilter";
import {
  StorageUnitBreadCrumb,
  storageUnitDisplayName
} from "./StorageUnitBreadCrumb";

export interface StorageSearchSelectorProps {
  onChange: (newValue: KitsuResourceLink) => Promisable<void>;
}

/** Table UI to search for and select a Storage Unit. */
export function StorageSearchSelector({
  onChange
}: StorageSearchSelectorProps) {
  const [filter, setFilter] = useState<FilterGroupModel | null>();
  const { readOnly } = useDinaFormContext();

  const tableColumns: ColumnDefinition8<StorageUnit>[] = [
    {
      cell: ({ row: { original } }) => (
        <Link href={`/collection/storage-unit/view?id=${original.id}`}>
          <a target="_blank">{storageUnitDisplayName(original)}</a>
        </Link>
      ),
      size: 400,
      accessorKey: "name"
    },
    {
      cell: ({ row: { original } }) => (
        <StorageUnitBreadCrumb
          storageUnit={original}
          // Do not repeat the unit name because it's in the "name" column:
          hideThisUnit={true}
        />
      ),
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
      <StorageFilter onChange={setFilter} />
      <QueryTable8
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
