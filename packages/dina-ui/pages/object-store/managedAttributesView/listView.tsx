import {
  ColumnDefinition,
  ListPageLayout,
  ButtonBar,
  CreateButton
} from "common-ui";
import Link from "next/link";
import { Footer, Head, Nav } from "../../../components";
import { DinaMessage } from "../../../intl/dina-ui-intl";
import { ManagedAttribute } from "../../../types/objectstore-api/resources/ManagedAttribute";
import { CommonMessage } from "common-ui/lib/intl/common-ui-intl";

const ATTRIBUTES_LIST_COLUMNS: ColumnDefinition<ManagedAttribute>[] = [
  {
    Cell: ({ original: { id, name } }) => (
      <Link href={`/object-store/managedAttributesView/detailsView?id=${id}`}>
        <a>{name}</a>
      </Link>
    ),
    Header: "Name",
    accessor: "name"
  },
  "createdBy",
  {
    Cell: ({ original: { description } }) =>
      description?.en && description?.fr ? (
        <>
          en : {description?.en} | fr : {description?.fr}
        </>
      ) : description?.en ? (
        description.en
      ) : (
        description.fr
      ),
    accessor: "description"
  },
  "managedAttributeType",
  {
    Cell: ({ original: { acceptedValues } }) => (
      <div>{acceptedValues?.join(", ")}</div>
    ),
    accessor: "acceptedValues"
  }
];

const ATTRIBUTES_FILTER_ATTRIBUTES = ["name"];

export default function ManagedAttributesListPage() {
  return (
    <div>
      <Head title="Managed Attributes" />
      <Nav />
      <div className="container-fluid">
        <h1>
          <DinaMessage id="managedAttributeListTitle" />
        </h1>
        <ButtonBar>
          <Link href="/object-store/managedAttributesView/detailsView">
            <a className="btn btn-primary">
              <CommonMessage id="createButtonText" />
            </a>
          </Link>
        </ButtonBar>
        <ListPageLayout
          filterAttributes={ATTRIBUTES_FILTER_ATTRIBUTES}
          id="managed-attribute-list"
          queryTableProps={{
            columns: ATTRIBUTES_LIST_COLUMNS,
            path: "objectstore-api/managed-attribute"
          }}
        />
      </div>
      <Footer />
    </div>
  );
}
