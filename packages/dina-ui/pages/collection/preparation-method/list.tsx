import { ButtonBar, CreateButton, ListPageLayout, dateCell } from "common-ui";
import Link from "next/link";
import { Footer, GroupSelectField, Head, Nav } from "../../../components";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";

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
  const { formatMessage } = useDinaIntl();

  return (
    <div>
      <Head title={formatMessage("title_preparationMethod")} />
      <Nav />
      <main className="container-fluid px-5">
        <h1 id="wb-cont">
          <DinaMessage id="title_preparationMethod" />
        </h1>
        <ButtonBar>
          <CreateButton entityLink="/collection/preparation-method" />
        </ButtonBar>
        <ListPageLayout
          additionalFilters={filterForm => ({
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
      </main>
      <Footer />
    </div>
  );
}
