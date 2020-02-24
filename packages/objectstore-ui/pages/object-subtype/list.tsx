import {
  ColumnDefinition,
  CreateButton,
  QueryTable,
  QueryTableProps
} from "common-ui";
import Link from "next/link";
import { ObjectSubtype } from "types/objectstore-api/resources/ObjectSubtype";
import { ButtonBar, Head } from "../../components";
import {
  ObjectStoreMessage,
  useObjectStoreIntl
} from "../../intl/objectstore-intl";

const OBJECTSUBTYPE_TABLE_COLUMNS: Array<ColumnDefinition<ObjectSubtype>> = [
  {
    Cell: ({ original: { id, dcType } }) => (
      <Link href={`/object-subtype/view?id=${id}`}>
        <a>{dcType}</a>
      </Link>
    ),
    Header: "DcType",
    accessor: "dcType"
  },
  {
    Header: "AcSubtype",
    accessor: "acSubtype"
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
      <Head title={formatMessage("objectSubtypeTitle")} />
      <ButtonBar>
        <CreateButton entityLink="object-subtype" />
      </ButtonBar>
      <div className="container-fluid">
        <h1>
          <ObjectStoreMessage id="objectSubtypeTitle" />
        </h1>
        <QueryTable {...queryTableProps} />
      </div>
    </>
  );
}
