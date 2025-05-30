import {
  ButtonBar,
  ColumnDefinition,
  CreateButton,
  dateCell,
  descriptionCell,
  ListPageLayout
} from "common-ui";
import Link from "next/link";
import {
  Footer,
  groupCell,
  GroupSelectField,
  Head,
  Nav
} from "../../../components";
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
      <Link href={`/collection/collection-method/view?id=${id}`} legacyBehavior>
        {name}
      </Link>
    ),
    accessorKey: "name"
  },
  descriptionCell(false, false, "multilingualDescription"),
  groupCell("group"),
  "createdBy",
  dateCell("createdOn")
];

export default function collectionMethodListPage() {
  const { formatMessage } = useDinaIntl();

  return (
    <div>
      <Head title={formatMessage("collectionMethodListTitle")} />
      <Nav marginBottom={false} />
      <ButtonBar>
        <div className="flex d-flex ms-auto">
          <CreateButton entityLink="/collection/collection-method" />
        </div>
      </ButtonBar>
      <main className="container-fluid">
        <h1 id="wb-cont">
          <DinaMessage id="collectionMethodListTitle" />
        </h1>
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
