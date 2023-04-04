import { ColumnDefinition, descriptionCell, ListPageLayout } from "common-ui";
import { useState } from "react";
import { useRouter } from "next/router";
import Container from "react-bootstrap/Container";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";
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
} from "../../types/collection-api";

export default function ManagedAttributesListPage() {
  const { formatMessage } = useDinaIntl();
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState<number>(
    router.query.step ? Number(router.query.step) : 0
  );

  return (
    <div>
      <Head title={formatMessage("managedAttributes")} />
      <Nav />
      <main role="main">
        <Container fluid={true} className="px-5">
          <h1 id="wb-cont">
            <DinaMessage id="managedAttributes" />
          </h1>

          <Tabs
            selectedIndex={currentStep}
            onSelect={setCurrentStep}
            id="managedAttributeListTab"
            className="mb-3"
          >
            <TabList>
              <Tab>{formatMessage("collectionListTitle")}</Tab>
              <Tab>{formatMessage("objectStoreTitle")}</Tab>
              <Tab>{formatMessage("loanTransactionsSectionTitle")}</Tab>
            </TabList>
            <TabPanel>
              <CollectionAttributeListView />
            </TabPanel>
            <TabPanel>
              <ObjectStoreAttributeListView />
            </TabPanel>
            <TabPanel>
              <TransactionAttributeListView />
            </TabPanel>
          </Tabs>
        </Container>
      </main>
      <Footer />
    </div>
  );
}

interface CreateButtonProps {
  href: string;
}

function CreateNewSection({ href }: CreateButtonProps) {
  return (
    <Card bg="light" className="mb-4">
      <Card.Body>
        <Link href={href} passHref={true}>
          <Button variant="info" className="mx-1 my-1">
            <DinaMessage id="createNewLabel" />
          </Button>
        </Link>
      </Card.Body>
    </Card>
  );
}

function CollectionAttributeListView() {
  const { formatMessage } = useDinaIntl();

  const COLLECTIONS_ATTRIBUTES_FILTER_ATTRIBUTES = ["name"];

  const COLLECTION_ATTRIBUTES_LIST_COLUMNS: ColumnDefinition<
    ManagedAttribute<CollectionModuleType>
  >[] = [
    {
      Cell: ({ original: { id, name } }) => (
        <Link href={`/collection/managed-attribute/view?id=${id}`}>
          <a>{name}</a>
        </Link>
      ),
      Header: "Name",
      accessor: "name"
    },
    {
      Cell: ({ original }) => {
        const ma: ManagedAttribute<CollectionModuleType> = original;
        return (
          <div>
            {formatMessage(
              COLLECTION_MODULE_TYPE_LABELS[
                ma.managedAttributeComponent ?? "MATERIAL_SAMPLE"
              ] as any
            )}
          </div>
        );
      },
      accessor: "managedAttributeComponent"
    },
    {
      Cell: ({ original: { acceptedValues, vocabularyElementType } }) => {
        const labelKey: keyof typeof DINAUI_MESSAGES_ENGLISH | undefined =
          acceptedValues?.length
            ? "field_vocabularyElementType_picklist_label"
            : MANAGED_ATTRIBUTE_TYPE_OPTIONS.find(
                (option) => option.value === vocabularyElementType
              )?.labelKey;

        return <div>{labelKey && <DinaMessage id={labelKey} />}</div>;
      },
      accessor: "vocabularyElementType",
      // The API sorts alphabetically by key, not displayed intl-ized value,
      // so the displayed order wouldn't make sense.
      sortable: false
    },
    {
      Cell: ({ original: { acceptedValues } }) => (
        <div>{acceptedValues?.map((val) => `"${val}"`)?.join(", ")}</div>
      ),
      accessor: "acceptedValues"
    },
    descriptionCell("multilingualDescription"),
    "createdBy"
  ];

  return (
    <>
      <h3 className="mb-3">
        <DinaMessage id="collectionListTitle" />
      </h3>

      {/* Quick create menu */}
      <CreateNewSection href="/collection/managed-attribute/edit" />

      <ListPageLayout
        filterAttributes={COLLECTIONS_ATTRIBUTES_FILTER_ATTRIBUTES}
        id="collections-module-managed-attribute-list"
        queryTableProps={{
          columns: COLLECTION_ATTRIBUTES_LIST_COLUMNS,
          path: "collection-api/managed-attribute"
        }}
      />
    </>
  );
}

function ObjectStoreAttributeListView() {
  const OBJECT_STORE_ATTRIBUTES_FILTER_ATTRIBUTES = ["name"];

  const OBJECT_STORE_ATTRIBUTES_LIST_COLUMNS: ColumnDefinition<ManagedAttribute>[] =
    [
      {
        Cell: ({ original: { id, name } }) => (
          <Link href={`/object-store/managed-attribute/view?id=${id}`}>
            <a>{name}</a>
          </Link>
        ),
        Header: "Name",
        accessor: "name"
      },
      descriptionCell("multilingualDescription"),
      {
        Cell: ({ original: { acceptedValues, vocabularyElementType } }) => {
          const labelKey: keyof typeof DINAUI_MESSAGES_ENGLISH | undefined =
            acceptedValues?.length
              ? "field_vocabularyElementType_picklist_label"
              : MANAGED_ATTRIBUTE_TYPE_OPTIONS.find(
                  (option) => option.value === vocabularyElementType
                )?.labelKey;

          return <div>{labelKey && <DinaMessage id={labelKey} />}</div>;
        },
        accessor: "vocabularyElementType",
        // The API sorts alphabetically by key, not displayed intl-ized value,
        // so the displayed order wouldn't make sense.
        sortable: false
      },
      {
        Cell: ({ original: { acceptedValues } }) => (
          <div>{acceptedValues?.map((val) => `"${val}"`)?.join(", ")}</div>
        ),
        accessor: "acceptedValues"
      },
      "createdBy"
    ];

  return (
    <>
      <h3 className="mb-3">
        <DinaMessage id="objectStoreTitle" />
      </h3>

      {/* Quick create menu */}
      <CreateNewSection href="/object-store/managed-attribute/edit" />

      <ListPageLayout
        filterAttributes={OBJECT_STORE_ATTRIBUTES_FILTER_ATTRIBUTES}
        id="object-store-module-managed-attribute-list"
        queryTableProps={{
          columns: OBJECT_STORE_ATTRIBUTES_LIST_COLUMNS,
          path: "objectstore-api/managed-attribute"
        }}
      />
    </>
  );
}

function TransactionAttributeListView() {
  const TRANSACTION_ATTRIBUTES_FILTER_ATTRIBUTES = ["name"];

  const TRANSACTION_ATTRIBUTES_LIST_COLUMNS: ColumnDefinition<ManagedAttribute>[] =
    [
      {
        Cell: ({ original: { id, name } }) => (
          <Link href={`/loan-transaction/managed-attribute/view?id=${id}`}>
            <a>{name}</a>
          </Link>
        ),
        Header: "Name",
        accessor: "name"
      },
      {
        Cell: ({ original: { acceptedValues, vocabularyElementType } }) => {
          const labelKey: keyof typeof DINAUI_MESSAGES_ENGLISH | undefined =
            acceptedValues?.length
              ? "field_vocabularyElementType_picklist_label"
              : MANAGED_ATTRIBUTE_TYPE_OPTIONS.find(
                  (option) => option.value === vocabularyElementType
                )?.labelKey;

          return <div>{labelKey && <DinaMessage id={labelKey} />}</div>;
        },
        accessor: "vocabularyElementType",
        // The API sorts alphabetically by key, not displayed intl-ized value,
        // so the displayed order wouldn't make sense.
        sortable: false
      },
      {
        Cell: ({ original: { acceptedValues } }) => (
          <div>{acceptedValues?.map((val) => `"${val}"`)?.join(", ")}</div>
        ),
        accessor: "acceptedValues"
      },
      descriptionCell("multilingualDescription"),
      "createdBy"
    ];

  return (
    <>
      <h3 className="mb-3">
        <DinaMessage id="loanTransactionsSectionTitle" />
      </h3>

      {/* Quick create menu */}
      <CreateNewSection href="/loan-transaction/managed-attribute/edit" />

      <ListPageLayout
        filterAttributes={TRANSACTION_ATTRIBUTES_FILTER_ATTRIBUTES}
        id="loan-transaction-module-managed-attribute-list"
        queryTableProps={{
          columns: TRANSACTION_ATTRIBUTES_LIST_COLUMNS,
          path: "loan-transaction-api/managed-attribute"
        }}
      />
    </>
  );
}
