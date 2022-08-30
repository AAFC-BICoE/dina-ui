import { CreateButton, ListPageLayout, dateCell } from "common-ui";
import Link from "next/link";
import { GroupSelectField } from "../../../components";
import PageLayout from "../../../components/page/PageLayout";

const PREPARATION_TYPE_FILTER_ATTRIBUTES = ["name"];
const PREPARATION_TYPE_TABLE_COLUMNS = [
  {
    Cell: ({ original: { id, name } }) => (
      <Link href={`/collection/preparation-type/view?id=${id}`}>{name}</Link>
    ),
    accessor: "name"
  },
  "group",
  "createdBy",
  dateCell("createdOn")
];

export default function preparationTypeListPage() {
  const buttonBarContent = (
    <CreateButton entityLink="/collection/preparation-type" />
  );

  return (
    <PageLayout
      titleId="preparationTypeListTitle"
      headingTooltip={{
        id: "field_preparationType_tooltip",
        link: "https://aafc-bicoe.github.io/dina-documentation/#preparation-type",
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
        filterAttributes={PREPARATION_TYPE_FILTER_ATTRIBUTES}
        id="preparation-type-list"
        queryTableProps={{
          columns: PREPARATION_TYPE_TABLE_COLUMNS,
          path: "collection-api/preparation-type",
          defaultSort: [
            {
              id: "name",
              desc: false
            }
          ]
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
