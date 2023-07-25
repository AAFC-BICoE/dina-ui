import {
  ButtonBar,
  ColumnDefinition8,
  CreateButton,
  dateCell,
  ListPageLayout
} from "common-ui";
import Link from "next/link";
import {
  Footer,
  GroupSelectField,
  Head,
  Nav,
  VocabularyReadOnlyView
} from "../../../components";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { Protocol } from "../../../types/collection-api";

const PROTOCOL_FILTER_ATTRIBUTES = ["name"];
const PROTOCOL_TABLE_COLUMNS: ColumnDefinition8<Protocol>[] = [
  {
    cell: ({
      row: {
        original: { id, name }
      }
    }) => <Link href={`/collection/protocol/view?id=${id}`}>{name}</Link>,
    accessorKey: "name"
  },
  {
    cell: ({
      row: {
        original: { protocolType }
      }
    }) => (
      <VocabularyReadOnlyView
        path={"collection-api/vocabulary/protocolType"}
        value={protocolType}
      />
    ),
    accessorKey: "protocolType"
  },
  "group",
  "createdBy",
  dateCell("createdOn")
];

export default function protocolListPage() {
  const { formatMessage } = useDinaIntl();

  return (
    <div>
      <Head title={formatMessage("protocolListTitle")} />
      <Nav />
      <main className="container-fluid">
        <h1 id="wb-cont">
          <DinaMessage id="protocolListTitle" />
        </h1>
        <ButtonBar>
          <CreateButton entityLink="/collection/protocol" />
        </ButtonBar>
        <ListPageLayout
          additionalFilters={(filterForm) => ({
            // Apply group filter:
            ...(filterForm.group && { rsql: `group==${filterForm.group}` })
          })}
          filterAttributes={PROTOCOL_FILTER_ATTRIBUTES}
          id="protocol-list"
          queryTableProps={{
            columns: PROTOCOL_TABLE_COLUMNS,
            path: "collection-api/protocol",
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
