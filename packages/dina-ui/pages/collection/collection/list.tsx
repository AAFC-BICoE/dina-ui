import {
  ButtonBar,
  ColumnDefinition,
  CreateButton,
  dateCell,
  FilterAttribute,
  ListPageLayout
} from "common-ui";
import Link from "next/link";
import { GroupSelectField, Head, Nav } from "../../../components";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { Collection } from "../../../types/collection-api";
import PageLayout from "packages/dina-ui/components/page/PageLayout";

const COLLECTION_TABLE_COLUMNS: ColumnDefinition<Collection>[] = [
  {
    Cell: ({ original: { id, name } }) => (
      <Link href={`/collection/collection/view?id=${id}`}>{name || id}</Link>
    ),
    accessor: "name"
  },
  "code",
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
  const { formatMessage } = useDinaIntl();
  const buttonBarContent = <CreateButton entityLink="/collection/collection" />

  return (
    <PageLayout
    titleId="collectionListTitle"
    headingTooltip={{
      id: "Needs tooltip",
      link: "https://aafc-bicoe.github.io/dina-documentation/#collection",
      linkText: "fromDinaUserGuide",
      placement: "right"
    }}
    buttonBarContent={buttonBarContent}
  >

        <ListPageLayout
          additionalFilters={filterForm => ({
            // Apply group filter:
            ...(filterForm.group && { rsql: `group==${filterForm.group}` })
          })}
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
        />
    </PageLayout>
  );
}
