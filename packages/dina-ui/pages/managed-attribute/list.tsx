import {
  ButtonBar,
  ColumnDefinition,
  CommonMessage,
  descriptionCell,
  ListPageLayout
} from "common-ui";
import Container from "react-bootstrap/Container";
import Tabs from "react-bootstrap/Tabs";
import Tab from "react-bootstrap/Tab";
import Card from "react-bootstrap/Card";
import Button from "react-bootstrap/Button";
import Link from "next/link";
import { Footer, Head, Nav } from "../../components";
import { DINAUI_MESSAGES_ENGLISH } from "../../intl/dina-ui-en";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";
import {
  CollectionModuleType,
  COLLECTION_MODULE_TYPE_LABELS,
  ManagedAttribute,
  MANAGED_ATTRIBUTE_TYPE_OPTIONS
} from "../../types/collection-api/resources/ManagedAttribute";

const COLLECTIONS_ATTRIBUTES_FILTER_ATTRIBUTES = ["name"];
const OBJECT_STORE_ATTRIBUTES_FILTER_ATTRIBUTES = ["name"];
const TRANSACTION_ATTRIBUTES_FILTER_ATTRIBUTES = ["name"];

export default function ManagedAttributesListPage() {
  const { formatMessage } = useDinaIntl();

  const COLLECTION_ATTRIBUTES_LIST_COLUMNS: ColumnDefinition<
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
    },
    descriptionCell("multilingualDescription")
  ];

  const OBJECT_STORE_ATTRIBUTES_LIST_COLUMNS: ColumnDefinition<ManagedAttribute>[] =
    [
      {
        Cell: ({ original: { id, name } }) => (
          <Link
            href={`/object-store/managedAttributesView/detailsView?id=${id}`}
          >
            <a>{name}</a>
          </Link>
        ),
        Header: "Name",
        accessor: "name"
      },
      "createdBy",
      descriptionCell("multilingualDescription"),
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

  const TRANSACTION_ATTRIBUTES_LIST_COLUMNS: ColumnDefinition<ManagedAttribute>[] =
    [
      {
        Cell: ({ original: { id, name } }) => (
          <Link href={`/loan-transaction/managed-attribute/edit?id=${id}`}>
            <a>{name}</a>
          </Link>
        ),
        Header: "Name",
        accessor: "name"
      },
      "createdBy",
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
      },
      descriptionCell("multilingualDescription")
    ];

  return (
    <div>
      <Head title={formatMessage("loanTransactionManagedAttributeListTitle")} />
      <Nav />
      <main role="main">
        <Container fluid={true} className="px-5">
          <h1 id="wb-cont">
            <DinaMessage id="managedAttributes" />
          </h1>

          <Tabs
            defaultActiveKey="profile"
            id="uncontrolled-tab-example"
            className="mb-3"
          >
            <Tab eventKey="home" title="Collections">
              {/* Quick create menu */}
              <Card bg="light" className="mb-4">
                <Card.Body>
                  <Button variant="info" className="mx-1 my-1">
                    Create New
                  </Button>
                </Card.Body>
              </Card>

              <ListPageLayout
                filterAttributes={COLLECTIONS_ATTRIBUTES_FILTER_ATTRIBUTES}
                id="collections-module-managed-attribute-list"
                queryTableProps={{
                  columns: COLLECTION_ATTRIBUTES_LIST_COLUMNS,
                  path: "collection-api/managed-attribute"
                }}
              />
            </Tab>
            <Tab eventKey="profile" title="Object Store">
              <ListPageLayout
                filterAttributes={OBJECT_STORE_ATTRIBUTES_FILTER_ATTRIBUTES}
                id="object-store-module-managed-attribute-list"
                queryTableProps={{
                  columns: OBJECT_STORE_ATTRIBUTES_LIST_COLUMNS,
                  path: "objectstore-api/managed-attribute"
                }}
              />
            </Tab>
            <Tab eventKey="contact" title="Transactions">
              <ListPageLayout
                filterAttributes={TRANSACTION_ATTRIBUTES_FILTER_ATTRIBUTES}
                id="loan-transaction-module-managed-attribute-list"
                queryTableProps={{
                  columns: TRANSACTION_ATTRIBUTES_LIST_COLUMNS,
                  path: "loan-transaction-api/managed-attribute"
                }}
              />
            </Tab>
          </Tabs>
        </Container>
      </main>
      <Footer />
    </div>
  );
}
