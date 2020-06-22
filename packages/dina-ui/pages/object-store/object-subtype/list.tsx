import {
  ButtonBar,
  ColumnDefinition,
  CreateButton,
  QueryTable,
  QueryTableProps
} from "common-ui";
import Link from "next/link";
import { ObjectSubtype } from "types/objectstore-api/resources/ObjectSubtype";
import { Head, Nav } from "../../../components";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";

const OBJECTSUBTYPE_TABLE_COLUMNS: Array<ColumnDefinition<ObjectSubtype>> = [
  {
    Cell: ({ original: { id, acSubtype } }) => (
      <Link href={`/object-store/object-subtype/edit?id=${id}`}>
        <a>{acSubtype}</a>
      </Link>
    ),
    Header: "AcSubtype",
    accessor: "acSubtype"
  },
  {
    Header: "DcType",
    accessor: "dcType"
  }
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
      <ButtonBar>
        <CreateButton entityLink="/object-store/object-subtype" />
      </ButtonBar>
      <div className="container-fluid">
        <h1>
          <DinaMessage id="objectSubtypeListTitle" />
        </h1>
        <div style={{ maxWidth: "50rem" }}>
          <QueryTable {...queryTableProps} />
        </div>
      </div>
    </>
  );
}
