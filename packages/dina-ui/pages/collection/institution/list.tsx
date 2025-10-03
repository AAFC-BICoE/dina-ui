import {
  ButtonBar,
  ColumnDefinition,
  CreateButton,
  dateCell,
  FilterAttribute,
  ListPageLayout
} from "common-ui";
import Link from "next/link";
import { Footer, groupCell, Head, Nav } from "../../../components";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { Institution } from "../../../types/collection-api";

const TABLE_COLUMNS: ColumnDefinition<Institution>[] = [
  {
    cell: ({
      row: {
        original: { id, name }
      }
    }) => (
      <Link href={`/collection/institution/view?id=${id}`} legacyBehavior>
        {name || id}
      </Link>
    ),
    accessorKey: "name"
  },
  groupCell("group"),
  "createdBy",
  dateCell("createdOn")
];

const FILTER_ATTRIBUTES: FilterAttribute[] = [
  "name",
  { name: "createdOn", type: "DATE" },
  "createdBy"
];

export default function InstitutionListPage() {
  const { formatMessage } = useDinaIntl();

  return (
    <>
      <Head title={formatMessage("institutionListTitle")} />
      <Nav marginBottom={false} />
      <ButtonBar>
        <div className="flex d-flex ms-auto">
          <CreateButton entityLink="/collection/institution" />
        </div>
      </ButtonBar>
      <main className="container-fluid">
        <h1 id="wb-cont">
          <DinaMessage id="institutionListTitle" />
        </h1>
        <ListPageLayout
          filterAttributes={FILTER_ATTRIBUTES}
          id="institution-list"
          queryTableProps={{
            columns: TABLE_COLUMNS,
            path: "collection-api/institution"
          }}
          useFiql={true}
        />
      </main>
      <Footer />
    </>
  );
}
