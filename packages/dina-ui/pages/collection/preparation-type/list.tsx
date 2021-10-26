import { ButtonBar, CreateButton, ListPageLayout, dateCell } from "common-ui";
import Link from "next/link";
import { Footer, GroupSelectField, Head, Nav } from "../../../components";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";

const PREPARATION_TYPE_FILTER_ATTRIBUTES = ["createdBy"];
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
  const { formatMessage } = useDinaIntl();

  return (
    <div>
      <Head
        title={formatMessage("preparationTypeListTitle")}
        lang={formatMessage("languageOfPage")}
        creator={formatMessage("agricultureCanada")}
        subject={formatMessage("subjectTermsForPage")}
      />
      <Nav />
      <main className="container-fluid">
        <h1 id="wb-cont">
          <DinaMessage id="preparationTypeListTitle" />
        </h1>
        <ButtonBar>
          <CreateButton entityLink="/collection/preparation-type" />
        </ButtonBar>
        <ListPageLayout
          additionalFilters={filterForm => ({
            // Apply group filter:
            ...(filterForm.group && { rsql: `group==${filterForm.group}` })
          })}
          filterAttributes={PREPARATION_TYPE_FILTER_ATTRIBUTES}
          id="preparation-type-list"
          queryTableProps={{
            columns: PREPARATION_TYPE_TABLE_COLUMNS,
            path: "collection-api/preparation-type"
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
