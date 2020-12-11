import {
  ButtonBar,
  ColumnDefinition,
  CreateButton,
  dateCell,
  QueryTable,
  QueryTableProps
} from "common-ui";
import Link from "next/link";
import { Footer, Head, Nav } from "../../../components";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { ObjectSubtype } from "../../../types/objectstore-api/resources/ObjectSubtype";

const OBJECTSUBTYPE_TABLE_COLUMNS: ColumnDefinition<ObjectSubtype>[] = [
  {
    Cell: ({ original: { id, acSubtype } }) => (
      <Link href={`/object-store/object-subtype/edit?id=${id}`}>
        <a>{acSubtype}</a>
      </Link>
    ),
    accessor: "acSubtype"
  },
  "dcType",
  "createdBy",
  dateCell("createdOn")
];

const queryTableProps: QueryTableProps<ObjectSubtype> = {
  columns: OBJECTSUBTYPE_TABLE_COLUMNS,
  path: "objectstore-api/object-subtype"
};

export default function ObjectSubtypeListPage() {
  const { formatMessage } = useDinaIntl();

  return (
    <>
      <Head title={formatMessage("objectSubtypeListTitle")} />
      <Nav />
      <main className="container-fluid">
        <h1>
          <DinaMessage id="objectSubtypeListTitle" />
        </h1>
        <ButtonBar>
          <CreateButton entityLink="/object-store/object-subtype" />
        </ButtonBar>
        <div style={{ maxWidth: "50rem" }}>
          <QueryTable {...queryTableProps} />
        </div>
      </main>
      <Footer />
    </>
  );
}
