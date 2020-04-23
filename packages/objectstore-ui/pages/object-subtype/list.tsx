import {
  ButtonBar,
  ColumnDefinition,
  CreateButton,
  QueryTable,
  QueryTableProps
} from "common-ui";
import Link from "next/link";
import { ObjectSubtype } from "types/objectstore-api/resources/ObjectSubtype";
import { Head, Nav } from "../../components";
import {
  ObjectStoreMessage,
  useObjectStoreIntl
} from "../../intl/objectstore-intl";

const OBJECTSUBTYPE_TABLE_COLUMNS: Array<ColumnDefinition<ObjectSubtype>> = [
  {
    Cell: ({ original: { id, acSubtype } }) => (
      <Link href={`/object-subtype/edit?id=${id}`}>
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
  path: "object-subtype"
};

export default function ObjectSubtypeListPage() {
  const { formatMessage } = useObjectStoreIntl();

  return (
    <>
      <Head title={formatMessage("objectSubtypeListTitle")} />
      <div className="container-fluid">
        <div style={{ marginTop: "10px" }}>
          <CreateButton entityLink="object-subtype" />
        </div>
        <h1>
          <ObjectStoreMessage id="objectSubtypeListTitle" />
        </h1>
        <div>
          <QueryTable {...queryTableProps} />
        </div>
      </div>
    </>
  );
}
