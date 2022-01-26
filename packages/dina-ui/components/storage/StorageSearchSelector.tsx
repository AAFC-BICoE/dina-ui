import {
  ColumnDefinition,
  FilterGroupModel,
  FormikButton,
  QueryTable,
  rsql,
  useDinaFormContext
} from "common-ui";
import { KitsuResourceLink, PersistedResource } from "kitsu";
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
      Cell: ({ original }) => (
        <StorageUnitBreadCrumb storageUnit={original} readOnly={readOnly} />
      ),
      accessor: "location",
      sortable: false
    },
    {
      Cell: ({ original }) => (
        <FormikButton
          className="btn btn-primary select-storage"
          onClick={async () =>
            await onChange({ id: original.id, type: original.type })
          }
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
            children: [...(filter ? [filter] : [])]
          })
        }}
      />
    </div>
  );
}
