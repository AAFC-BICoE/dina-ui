import { ButtonBar, ColumnDefinition, ListPageLayout } from "common-ui";
import { CommonMessage } from "common-ui";
import Link from "next/link";
import { Footer, Head, Nav } from "../../../components";
import { DINAUI_MESSAGES_ENGLISH } from "../../../intl/dina-ui-en";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import {
  CollectionModuleType,
  COLLECTION_MODULE_TYPE_LABELS,
  ManagedAttribute,
  MANAGED_ATTRIBUTE_TYPE_OPTIONS
} from "../../../types/collection-api/resources/ManagedAttribute";

const ATTRIBUTES_FILTER_ATTRIBUTES = ["name"];

export default function ManagedAttributesListPage() {
  const { formatMessage } = useDinaIntl();

  const ATTRIBUTES_LIST_COLUMNS: ColumnDefinition<
    ManagedAttribute<CollectionModuleType>
  >[] = [
    {
      Cell: ({ original: { id, name } }) => (
        <Link href={`/collection/managed-attribute/edit?id=${id}`}>
          <a>{name}</a>
        </Link>
      ),
      Header: "Name",
      accessor: "name"
    },
    "createdBy",
    {
      Cell: ({ original }) => {
        const ma: ManagedAttribute<CollectionModuleType> = original;
        return (
          <div>
            {formatMessage(
              COLLECTION_MODULE_TYPE_LABELS[ma.managedAttributeComponent] as any
            )}
          </div>
        );
      },
      accessor: "managedAttributeComponent"
    },
    {
      Cell: ({ original: { acceptedValues, managedAttributeType } }) => {
        const labelKey: keyof typeof DINAUI_MESSAGES_ENGLISH | undefined =
          acceptedValues?.length
            ? "field_managedAttributeType_picklist_label"
            : MANAGED_ATTRIBUTE_TYPE_OPTIONS.find(
                option => option.value === managedAttributeType
              )?.labelKey;

        return <div>{labelKey && <DinaMessage id={labelKey} />}</div>;
      },
      accessor: "managedAttributeType",
      // The API sorts alphabetically by key, not displayed intl-ized value,
      // so the displayed order wouldn't make sense.
      sortable: false
    },
    {
      Cell: ({ original: { acceptedValues } }) => (
        <div>{acceptedValues?.map(val => `"${val}"`)?.join(", ")}</div>
      ),
      accessor: "acceptedValues"
    }
  ];

  return (
    <div>
      <Head title={formatMessage("collectionManagedAttributeListTitle")} />
      <Nav />
      <main className="container-fluid">
        <h1 id="wb-cont">
          <DinaMessage id="collectionManagedAttributeListTitle" />
        </h1>
        <ButtonBar>
          <Link href="/collection/managed-attribute/edit">
            <a className="btn btn-primary">
              <CommonMessage id="createNew" />
            </a>
          </Link>
        </ButtonBar>
        <ListPageLayout
          filterAttributes={ATTRIBUTES_FILTER_ATTRIBUTES}
          id="collection-module-managed-attribute-list"
          queryTableProps={{
            columns: ATTRIBUTES_LIST_COLUMNS,
            path: "collection-api/managed-attribute"
          }}
        />
      </main>
      <Footer />
    </div>
  );
}
