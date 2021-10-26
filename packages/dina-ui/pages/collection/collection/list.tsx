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

  return (
    <div>
      <Head
        title={formatMessage("collectionListTitle")}
        lang={formatMessage("languageOfPage")}
        creator={formatMessage("agricultureCanada")}
        subject={formatMessage("subjectTermsForPage")}
      />
      <Nav />
      <main className="container-fluid">
        <h1 id="wb-cont">
          <DinaMessage id="collectionListTitle" />
        </h1>
        <ButtonBar>
          <CreateButton entityLink="/collection/collection" />
        </ButtonBar>
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
      </main>
    </div>
  );
}
