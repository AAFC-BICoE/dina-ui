import {
  ButtonBar,
  ColumnDefinition8,
  CreateButton,
  dateCell8,
  FilterAttribute,
  ListPageLayout
} from "common-ui";
import Link from "next/link";
import { Head, Nav } from "../../../components";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { Institution } from "../../../types/collection-api";

const TABLE_COLUMNS: ColumnDefinition8<Institution>[] = [
  {
    cell: ({
      row: {
        original: { id, name }
      }
    }) => (
      <Link href={`/collection/institution/view?id=${id}`}>{name || id}</Link>
    ),
    accessorKey: "name"
  },
  "createdBy",
  dateCell8("createdOn")
];

const FILTER_ATTRIBUTES: FilterAttribute[] = [
  "name",
  { name: "createdOn", type: "DATE" },
  "createdBy"
];

export default function InstitutionListPage() {
  const { formatMessage } = useDinaIntl();

  return (
    <div>
      <Head title={formatMessage("institutionListTitle")} />
      <Nav />
      <main className="container-fluid">
        <h1 id="wb-cont">
          <DinaMessage id="institutionListTitle" />
        </h1>
        <ButtonBar>
          <CreateButton entityLink="/collection/institution" />
        </ButtonBar>
        <ListPageLayout
          filterAttributes={FILTER_ATTRIBUTES}
          id="institution-list"
          queryTableProps={{
            columns: TABLE_COLUMNS,
            path: "collection-api/institution"
          }}
        />
      </main>
    </div>
  );
}
