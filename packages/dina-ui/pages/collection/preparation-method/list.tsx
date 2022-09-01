import { CreateButton, ListPageLayout, dateCell } from "common-ui";
import Link from "next/link";
import { GroupSelectField } from "../../../components";
import PageLayout from "../../../components/page/PageLayout";

const PREPARATION_METHOD_FILTER_ATTRIBUTES = ["name"];
const PREPARATION_METHOD_TABLE_COLUMNS = [
  {
    Cell: ({ original: { id, name } }) => (
      <Link href={`/collection/preparation-method/view?id=${id}`}>{name}</Link>
    ),
    accessor: "name"
  },
  "group",
  "createdBy",
  dateCell("createdOn")
];

export default function preparationMethodListPage() {
  const buttonBarContent = (
    <CreateButton entityLink="/collection/preparation-method" />
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
          path: "collection-api/preparation-method",
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
