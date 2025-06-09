import {
  ColumnDefinition,
  dateCell,
  descriptionCell,
  FieldHeader,
  intlContext,
  ListLayoutFilterType,
  ListPageLayout
} from "common-ui";
import Link from "next/link";
import { useRouter } from "next/router";
import { useContext, useState } from "react";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";
import { DINAUI_MESSAGES_ENGLISH } from "../../intl/dina-ui-en";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";

import { groupCell, GroupSelectField } from "../../components";
import PageLayout from "../../components/page/PageLayout";
import {
  COLLECTION_MODULE_TYPE_LABELS,
  CollectionModuleType,
  MANAGED_ATTRIBUTE_TYPE_OPTIONS,
  ManagedAttribute,
  SEQDB_MODULE_TYPE_LABELS,
  SeqDBModuleType
} from "../../types/collection-api";

export function useFilterManagedAttribute() {
  const { locale: language } = useContext(intlContext);
  const filterManagedAttributes = (
    filterForm: any,
    value: ManagedAttribute
  ) => {
    let result = true;
    if (filterForm?.group) {
      result = result && value.group === filterForm.group;
    }
    if (filterForm?.filterBuilderModel?.value) {
      result =
        result &&
        (value.name
          .toLowerCase()
          .indexOf(filterForm.filterBuilderModel.value.toLowerCase()) > -1 ||
          (
            value.multilingualDescription?.descriptions?.filter(
              (item) =>
                item.lang === language &&
                (item.desc ?? "")
                  .toLowerCase()
                  .indexOf(filterForm.filterBuilderModel.value.toLowerCase()) >
                  -1
            ) ?? []
          ).length > 0);
    }
    return result;
  };
  return { filterManagedAttributes };
}

export default function ManagedAttributesListPage() {
  const { formatMessage } = useDinaIntl();
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState<number>(
    router.query.step ? Number(router.query.step) : 0
  );

  return (
    <PageLayout titleId="managedAttributes">
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
          <Tab>{formatMessage("seqdbManagedAttributeTitle")}</Tab>
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
        <TabPanel>
          <SeqDBAttributeListView />
        </TabPanel>
      </Tabs>
    </PageLayout>
  );
}

interface CreateButtonProps {
  href: string;
}

function CreateNewSection({ href }: CreateButtonProps) {
  return (
    <Card bg="light" className="mb-4">
      <Card.Body className="ms-auto">
        <Link href={href} passHref={true} legacyBehavior>
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

  const { filterManagedAttributes } = useFilterManagedAttribute();

  const COLLECTIONS_ATTRIBUTES_FILTER_ATTRIBUTES = [
    "name",
    "multilingualDescription"
  ];

  const COLLECTION_ATTRIBUTES_LIST_COLUMNS: ColumnDefinition<
    ManagedAttribute<CollectionModuleType>
  >[] = [
    {
      cell: ({
        row: {
          original: { id, name }
        }
      }) => (
        <Link href={`/collection/managed-attribute/view?id=${id}`}>{name}</Link>
      ),
      header: "Name",
      accessorKey: "name"
    },
    {
      cell: ({ row: { original } }) => {
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
      accessorKey: "managedAttributeComponent"
    },
    {
      cell: ({
        row: {
          original: { acceptedValues, vocabularyElementType }
        }
      }) => {
        const labelKey: keyof typeof DINAUI_MESSAGES_ENGLISH | undefined =
          acceptedValues?.length
            ? "field_vocabularyElementType_picklist_label"
            : MANAGED_ATTRIBUTE_TYPE_OPTIONS.find(
                (option) => option.value === vocabularyElementType
              )?.labelKey;

        return <div>{labelKey && <DinaMessage id={labelKey} />}</div>;
      },
      accessorKey: "vocabularyElementType",
      // The API sorts alphabetically by key, not displayed intl-ized value,
      // so the displayed order wouldn't make sense.
      enableSorting: false
    },
    {
      accessorKey: "unit",
      header: () => <FieldHeader name={"unit"} />
    },
    {
      cell: ({
        row: {
          original: { acceptedValues }
        }
      }) => <div>{acceptedValues?.map((val) => `"${val}"`)?.join(", ")}</div>,
      accessorKey: "acceptedValues"
    },
    descriptionCell(false, false, "multilingualDescription"),
    groupCell("group"),
    "createdBy",
    dateCell("createdOn")
  ];

  return (
    <>
      <h3 className="mb-3">
        <DinaMessage id="collectionListTitle" />
      </h3>

      {/* Quick create menu */}
      <CreateNewSection href="/collection/managed-attribute/edit" />

      <ListPageLayout<ManagedAttribute<CollectionModuleType>>
        enableInMemoryFilter={true}
        filterFn={filterManagedAttributes}
        filterType={ListLayoutFilterType.FREE_TEXT}
        filterAttributes={COLLECTIONS_ATTRIBUTES_FILTER_ATTRIBUTES}
        id="collections-module-managed-attribute-list"
        queryTableProps={{
          columns: COLLECTION_ATTRIBUTES_LIST_COLUMNS,
          path: "collection-api/managed-attribute?page[limit]=1000"
        }}
        additionalFilters={(filterForm) => ({
          isCompleted: false,
          // Apply group filter:
          ...(filterForm.group && { rsql: `group==${filterForm.group}` })
        })}
        filterFormchildren={({ submitForm }) => (
          <div className="mb-3">
            <div style={{ width: "300px" }}>
              <GroupSelectField
                onChange={() => setImmediate(submitForm)}
                name="group"
                showAnyOption={true}
              />
            </div>
          </div>
        )}
      />
    </>
  );
}

function ObjectStoreAttributeListView() {
  const { filterManagedAttributes } = useFilterManagedAttribute();

  const OBJECT_STORE_ATTRIBUTES_FILTER_ATTRIBUTES = ["name"];

  const OBJECT_STORE_ATTRIBUTES_LIST_COLUMNS: ColumnDefinition<ManagedAttribute>[] =
    [
      {
        cell: ({
          row: {
            original: { id, name }
          }
        }) => (
          <Link href={`/object-store/managed-attribute/view?id=${id}`}>
            {name}
          </Link>
        ),
        header: "Name",
        accessorKey: "name"
      },
      descriptionCell(false, false, "multilingualDescription"),
      {
        cell: ({
          row: {
            original: { acceptedValues, vocabularyElementType }
          }
        }) => {
          const labelKey: keyof typeof DINAUI_MESSAGES_ENGLISH | undefined =
            acceptedValues?.length
              ? "field_vocabularyElementType_picklist_label"
              : MANAGED_ATTRIBUTE_TYPE_OPTIONS.find(
                  (option) => option.value === vocabularyElementType
                )?.labelKey;

          return <div>{labelKey && <DinaMessage id={labelKey} />}</div>;
        },
        accessorKey: "vocabularyElementType",
        // The API sorts alphabetically by key, not displayed intl-ized value,
        // so the displayed order wouldn't make sense.
        enableSorting: false
      },
      {
        cell: ({
          row: {
            original: { acceptedValues }
          }
        }) => <div>{acceptedValues?.map((val) => `"${val}"`)?.join(", ")}</div>,
        accessorKey: "acceptedValues"
      },
      "createdBy",
      {
        accessorKey: "group",
        header: () => <FieldHeader name={"group"} />
      }
    ];

  return (
    <>
      <h3 className="mb-3">
        <DinaMessage id="objectStoreTitle" />
      </h3>

      {/* Quick create menu */}
      <CreateNewSection href="/object-store/managed-attribute/edit" />

      <ListPageLayout
        enableInMemoryFilter={true}
        filterFn={filterManagedAttributes}
        filterType={ListLayoutFilterType.FREE_TEXT}
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
  const { filterManagedAttributes } = useFilterManagedAttribute();
  const TRANSACTION_ATTRIBUTES_FILTER_ATTRIBUTES = ["name"];

  const TRANSACTION_ATTRIBUTES_LIST_COLUMNS: ColumnDefinition<ManagedAttribute>[] =
    [
      {
        cell: ({
          row: {
            original: { id, name }
          }
        }) => (
          <Link href={`/loan-transaction/managed-attribute/view?id=${id}`}>
            {name}
          </Link>
        ),
        header: "Name",
        accessorKey: "name"
      },
      {
        cell: ({
          row: {
            original: { acceptedValues, vocabularyElementType }
          }
        }) => {
          const labelKey: keyof typeof DINAUI_MESSAGES_ENGLISH | undefined =
            acceptedValues?.length
              ? "field_vocabularyElementType_picklist_label"
              : MANAGED_ATTRIBUTE_TYPE_OPTIONS.find(
                  (option) => option.value === vocabularyElementType
                )?.labelKey;

          return <div>{labelKey && <DinaMessage id={labelKey} />}</div>;
        },
        accessorKey: "vocabularyElementType",
        // The API sorts alphabetically by key, not displayed intl-ized value,
        // so the displayed order wouldn't make sense.
        enableSorting: false
      },
      {
        cell: ({
          row: {
            original: { acceptedValues }
          }
        }) => <div>{acceptedValues?.map((val) => `"${val}"`)?.join(", ")}</div>,
        accessorKey: "acceptedValues"
      },
      descriptionCell(false, false, "multilingualDescription"),
      "createdBy",
      {
        accessorKey: "group",
        header: () => <FieldHeader name={"group"} />
      }
    ];

  return (
    <>
      <h3 className="mb-3">
        <DinaMessage id="loanTransactionsSectionTitle" />
      </h3>

      {/* Quick create menu */}
      <CreateNewSection href="/loan-transaction/managed-attribute/edit" />

      <ListPageLayout
        enableInMemoryFilter={true}
        filterFn={filterManagedAttributes}
        filterType={ListLayoutFilterType.FREE_TEXT}
        filterAttributes={TRANSACTION_ATTRIBUTES_FILTER_ATTRIBUTES}
        id="loan-transaction-module-managed-attribute-list"
        queryTableProps={{
          columns: TRANSACTION_ATTRIBUTES_LIST_COLUMNS,
          path: "loan-transaction-api/managed-attribute"
        }}
        additionalFilters={(filterForm) => ({
          isCompleted: false,
          // Apply group filter:
          ...(filterForm.group && { rsql: `group==${filterForm.group}` })
        })}
        filterFormchildren={({ submitForm }) => (
          <div className="mb-3">
            <div style={{ width: "300px" }}>
              <GroupSelectField
                onChange={() => setImmediate(submitForm)}
                name="group"
                showAnyOption={true}
              />
            </div>
          </div>
        )}
      />
    </>
  );
}

function SeqDBAttributeListView() {
  const { filterManagedAttributes } = useFilterManagedAttribute();
  const { formatMessage } = useDinaIntl();

  const SEQDB_ATTRIBUTES_FILTER_ATTRIBUTES = ["name"];

  const SEQDB_ATTRIBUTES_LIST_COLUMNS: ColumnDefinition<
    ManagedAttribute<SeqDBModuleType>
  >[] = [
    {
      cell: ({
        row: {
          original: { id, name }
        }
      }) => <Link href={`/seqdb/managed-attribute/view?id=${id}`}>{name}</Link>,
      header: "Name",
      accessorKey: "name"
    },
    {
      cell: ({ row: { original } }) => {
        const ma: ManagedAttribute<SeqDBModuleType> = original;
        return (
          <div>
            {formatMessage(
              SEQDB_MODULE_TYPE_LABELS[ma.managedAttributeComponent!] as any
            )}
          </div>
        );
      },
      accessorKey: "managedAttributeComponent"
    },
    descriptionCell(false, false, "multilingualDescription"),
    {
      cell: ({
        row: {
          original: { acceptedValues, vocabularyElementType }
        }
      }) => {
        const labelKey: keyof typeof DINAUI_MESSAGES_ENGLISH | undefined =
          acceptedValues?.length
            ? "field_vocabularyElementType_picklist_label"
            : MANAGED_ATTRIBUTE_TYPE_OPTIONS.find(
                (option) => option.value === vocabularyElementType
              )?.labelKey;

        return <div>{labelKey && <DinaMessage id={labelKey} />}</div>;
      },
      accessorKey: "vocabularyElementType",
      // The API sorts alphabetically by key, not displayed intl-ized value,
      // so the displayed order wouldn't make sense.
      enableSorting: false
    },
    {
      cell: ({
        row: {
          original: { acceptedValues }
        }
      }) => <div>{acceptedValues?.map((val) => `"${val}"`)?.join(", ")}</div>,
      accessorKey: "acceptedValues"
    },
    "createdBy",
    {
      accessorKey: "group",
      header: () => <FieldHeader name={"group"} />
    }
  ];

  return (
    <>
      <h3 className="mb-3">
        <DinaMessage id="seqdbManagedAttributeTitle" />
      </h3>

      {/* Quick create menu */}
      <CreateNewSection href="/seqdb/managed-attribute/edit" />

      <ListPageLayout
        enableInMemoryFilter={true}
        filterFn={filterManagedAttributes}
        filterType={ListLayoutFilterType.FREE_TEXT}
        filterAttributes={SEQDB_ATTRIBUTES_FILTER_ATTRIBUTES}
        id="seqdb-module-managed-attribute-list"
        queryTableProps={{
          columns: SEQDB_ATTRIBUTES_LIST_COLUMNS,
          path: "seqdb-api/managed-attribute"
        }}
      />
    </>
  );
}
