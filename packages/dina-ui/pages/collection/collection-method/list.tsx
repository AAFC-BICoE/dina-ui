import {
  ButtonBar,
  ColumnDefinition,
  CreateButton,
  descriptionCell,
  ListPageLayout
} from "common-ui";
import Link from "next/link";
import { Footer, GroupSelectField, Head, Nav } from "../../../components";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { CollectionMethod } from "../../../types/collection-api";

const COLLECTION_METHOD_FILTER_ATTRIBUTES = ["name"];
const COLLECTION_METHOD_TABLE_COLUMNS: ColumnDefinition<CollectionMethod>[] = [
  {
    cell: ({
      row: {
        original: { id, name }
      }
    }) => (
      <Link href={`/collection/collection-method/view?id=${id}`}>{name}</Link>
    ),
    accessorKey: "name"
  },
  "group",
  descriptionCell(false, false, "multilingualDescription")
];

export default function collectionMethodListPage() {
  const { formatMessage } = useDinaIntl();

  return (
    <div>
      <Head title={formatMessage("collectionMethodListTitle")} />
      <Nav />
      <main className="container-fluid">
        <h1 id="wb-cont">
          <DinaMessage id="collectionMethodListTitle" />
        </h1>
        <ButtonBar>
          <CreateButton entityLink="/collection/collection-method" />
        </ButtonBar>
        <ListPageLayout
          additionalFilters={(filterForm) => ({
            // Apply group filter:
            ...(filterForm.group && { rsql: `group==${filterForm.group}` })
          })}
          filterAttributes={COLLECTION_METHOD_FILTER_ATTRIBUTES}
          id="collection-method-list"
          queryTableProps={{
            columns: COLLECTION_METHOD_TABLE_COLUMNS,
            path: "collection-api/collection-method",
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
