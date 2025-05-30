import {
  ColumnDefinition,
  CreateButton,
  ListPageLayout,
  dateCell
} from "common-ui";
import Link from "next/link";
import { GroupSelectField, groupCell } from "../../../components";
import PageLayout from "../../../components/page/PageLayout";
import { PreparationMethod } from "../../../types/collection-api";

const PREPARATION_METHOD_FILTER_ATTRIBUTES = ["name"];
const PREPARATION_METHOD_TABLE_COLUMNS: ColumnDefinition<PreparationMethod>[] =
  [
    {
      cell: ({
        row: {
          original: { id, name }
        }
      }) => (
        <Link
          href={`/collection/preparation-method/view?id=${id}`}
          legacyBehavior
        >
          {name}
        </Link>
      ),
      accessorKey: "name"
    },
    groupCell("group"),
    "createdBy",
    dateCell("createdOn")
  ];

export default function preparationMethodListPage() {
  const buttonBarContent = (
    <div className="flex d-flex ms-auto">
      <CreateButton entityLink="/collection/preparation-method" />
    </div>
  );

  return (
    <PageLayout
      titleId="title_preparationMethod"
      headingTooltip={{
        id: "field_preparationMethod_tooltip",
        link: "https://aafc-bicoe.github.io/dina-documentation/#preparation-method",
        linkText: "fromDinaUserGuide",
        placement: "right"
      }}
      buttonBarContent={buttonBarContent}
    >
      <ListPageLayout
        additionalFilters={(filterForm) => ({
          // Apply group filter:
          ...(filterForm.group && { rsql: `group==${filterForm.group}` })
        })}
        filterAttributes={PREPARATION_METHOD_FILTER_ATTRIBUTES}
        id="preparation-method-list"
        queryTableProps={{
          columns: PREPARATION_METHOD_TABLE_COLUMNS,
          path: "collection-api/preparation-method"
        }}
        filterFormchildren={({ submitForm }) => (
          <div className="mb-3">
            <div style={{ width: "300px" }}>
              <GroupSelectField
                onChange={() => setImmediate(submitForm)}
                name="group"
                showAnyOption={true}
              />
            </div>
          </div>
        )}
      />
    </PageLayout>
  );
}
