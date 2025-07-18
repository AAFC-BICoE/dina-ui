import {
  QueryPage,
  FieldHeader,
  dateCell,
  FormikButton,
  generateUUIDTree
} from "common-ui";
import { TableColumn } from "common-ui/lib/list-page/types";
import { KitsuResourceLink } from "kitsu";
import Link from "next/link";
import { Promisable } from "type-fest";
import { DinaMessage } from "../../intl/dina-ui-intl";

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
  // const [filter, setFilter] = useState<FilterGroupModel | null>();

  // Columns for the elastic search list page.
  const columns: TableColumn<any>[] = [
    // Name
    {
      id: "name",
      cell: ({
        row: {
          original: { id, data }
        }
      }) => (
        <Link href={`/collection/storage-unit/view?id=${id}`} passHref={true}>
          {data?.attributes?.name}
        </Link>
      ),
      header: () => <FieldHeader name="name" />,
      accessorKey: "data.attributes.name",
      isKeyword: true
    },

    // Storage Unit Type
    {
      id: "storageUnitType.name",
      cell: ({
        row: {
          original: { included }
        }
      }) => {
        if (!included?.storageUnitType?.id) {
          return null;
        }

        return (
          <Link
            href={`/collection/storage-unit-type/view?id=${included?.storageUnitType?.id}`}
            passHref={true}
          >
            {included?.storageUnitType?.attributes?.name}
          </Link>
        );
      },
      header: () => <FieldHeader name="storageUnitType" />,
      accessorKey: "included.attributes.name",
      relationshipType: "storage-unit-type",
      enableSorting: false,
      isKeyword: true
    },

    // Location
    {
      id: "location",
      cell: ({
        row: {
          original: { data }
        }
      }) => {
        const parentRank = data?.attributes?.hierarchy?.find(
          (item) => item.rank === 2
        );
        return <>{parentRank?.name}</>;
      },
      header: () => <FieldHeader name="location" />,
      enableSorting: false,
      isKeyword: true,
      additionalAccessors: ["data.attributes.hierarchy"]
    },

    // Group
    {
      id: "group",
      header: () => <FieldHeader name="group" />,
      accessorKey: "data.attributes.group",
      isKeyword: true
    },

    // Created By
    {
      id: "createdBy",
      header: () => <FieldHeader name="createdBy" />,
      accessorKey: "data.attributes.createdBy",
      isKeyword: true
    },

    // Created On
    dateCell("createdOn", "data.attributes.createdOn"),

    {
      id: "select",
      header: () => <FieldHeader name="select" />,
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
      <QueryPage
        indexName={"dina_storage_index"}
        uniqueName="storage-unit-list"
        reactTableProps={{
          enableSorting: true,
          enableMultiSort: true
        }}
        enableRelationshipPresence={true}
        columns={columns}
        mandatoryDisplayedColumns={["name", "select"]}
        customViewQuery={generateUUIDTree(
          parentStorageUnitUUID || "",
          "data.id"
        )} // this should be the opposite, just for testing.
      />
    </div>
  );
}
