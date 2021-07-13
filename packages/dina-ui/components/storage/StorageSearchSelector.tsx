import { PersistedResource } from "kitsu";
import Link from "next/link";
import { useState } from "react";
import { Promisable } from "type-fest";
import {
  ColumnDefinition,
  FilterGroupModel,
  FormikButton,
  QueryTable,
  rsql
} from "../../../common-ui/lib";
import { DinaMessage } from "../../intl/dina-ui-intl";
import { StorageUnit } from "../../types/collection-api";
import { StorageFilter } from "./StorageFilter";
import {
  StorageUnitBreadCrumb,
  storageUnitDisplayName
} from "./StorageUnitBreadCrumb";

export interface StorageSearchSelectorProps {
  onChange: (newValue: PersistedResource<StorageUnit>) => Promisable<void>;
  excludeOptionId?: string;
}

/** Table UI to search for and select a Storage Unit. */
export function StorageSearchSelector({
  onChange,
  excludeOptionId = "00000000-0000-0000-0000-000000000000"
}: StorageSearchSelectorProps) {
  const [filter, setFilter] = useState<FilterGroupModel | null>();

  const tableColumns: ColumnDefinition<StorageUnit>[] = [
    {
      Cell: ({ original }) => (
        <Link href={`/collection/storage-unit/view?id=${original.id}`}>
          <a>{storageUnitDisplayName(original)}</a>
        </Link>
      ),
      width: 400,
      accessor: "name"
    },
    {
      Cell: ({ original }) => <StorageUnitBreadCrumb storageUnit={original} />,
      accessor: "location",
      sortable: false
    },
    {
      Cell: ({ original }) => (
        <FormikButton
          className="btn btn-primary select-storage"
          onClick={async () => await onChange(original)}
        >
          <DinaMessage id="assignToStorage" />
        </FormikButton>
      ),
      width: 250,
      accessor: "assignToStorage",
      sortable: false
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
      <QueryTable
        columns={tableColumns}
        path="collection-api/storage-unit"
        include="hierarchy,storageUnitType"
        // Sort by newest:
        defaultSort={[{ id: "createdOn", desc: true }]}
        reactTableProps={() => ({ sortable: false })}
        filter={{
          rsql: rsql({
            type: "FILTER_GROUP",
            id: -123,
            operator: "AND",
            children: [
              {
                id: -321,
                type: "FILTER_ROW" as const,
                attribute: "uuid",
                predicate: "IS NOT" as const,
                searchType: "EXACT_MATCH" as const,
                value: excludeOptionId
              },
              ...(filter ? [filter] : [])
            ]
          })
        }}
      />
    </div>
  );
}
