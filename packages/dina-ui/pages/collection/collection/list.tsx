import {
  ColumnDefinition,
  CreateButton,
  dateCell,
  FieldHeader,
  FilterAttribute,
  ListPageLayout,
  SimpleSearchFilterBuilder
} from "common-ui";
import Link from "next/link";
import PageLayout from "packages/dina-ui/components/page/PageLayout";
import { groupCell, GroupSelectField } from "../../../components";
import { Collection } from "../../../types/collection-api";

const COLLECTION_TABLE_COLUMNS: ColumnDefinition<Collection>[] = [
  {
    cell: ({
      row: {
        original: { id, name }
      }
    }) => (
      <Link href={`/collection/collection/view?id=${id}`} legacyBehavior>
        {name || id}
      </Link>
    ),
    accessorKey: "name",
    header: () => <FieldHeader name="name" />
  },
  "code",
  groupCell("group"),
  "createdBy",
  dateCell("createdOn")
];

const COLLECTION_FILTER_ATTRIBUTES: FilterAttribute[] = [
  "name",
  "code",
  {
    name: "createdOn",
    type: "DATE"
  },
  "createdBy"
];

export default function CollectionListPage() {
  const buttonBarContent = (
    <div className="flex d-flex ms-auto">
      <CreateButton entityLink="/collection/collection" />
    </div>
  );

  return (
    <PageLayout
      titleId="collectionListTitle"
      buttonBarContent={buttonBarContent}
    >
      <ListPageLayout
        additionalFilters={(filterForm) =>
          SimpleSearchFilterBuilder.create<Collection>()
            .whereProvided("group", "EQ", filterForm.group)
            .build()
        }
        filterAttributes={COLLECTION_FILTER_ATTRIBUTES}
        id="collection-list"
        queryTableProps={{
          columns: COLLECTION_TABLE_COLUMNS,
          path: "collection-api/collection"
        }}
        filterFormchildren={({ submitForm }) => (
          <div className="mb-3">
            <div style={{ width: "300px" }}>
              <GroupSelectField
                onChange={() => setImmediate(submitForm)}
                name="group"
                showAnyOption={true}
                showAllGroups={true}
              />
            </div>
          </div>
        )}
        useFiql={true}
      />
    </PageLayout>
  );
}
