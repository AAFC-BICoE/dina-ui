import {
  ColumnDefinition,
  dateCell,
  descriptionCell,
  FieldHeader,
  ListPageLayout
} from "common-ui";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";
import { DINAUI_MESSAGES_ENGLISH } from "../../intl/dina-ui-en";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";

import { groupCell } from "../../components";
import PageLayout from "../../components/page/PageLayout";
import {
  COLLECTION_MODULE_TYPE_LABELS,
  CollectionModuleType,
  MANAGED_ATTRIBUTE_TYPE_OPTIONS,
  ManagedAttribute
} from "../../types/collection-api";

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
          <GenericManagedAttributeListView
            apiPath="/collection-api/managed-attribute"
            prependLink="/collection/managed-attribute"
            componentSupport={true}
            titleKey="collectionListTitle"
          />
        </TabPanel>
        <TabPanel>
          <GenericManagedAttributeListView
            apiPath="/objectstore-api/managed-attribute"
            prependLink="/object-store/managed-attribute"
            componentSupport={false}
            titleKey="objectStoreTitle"
          />
        </TabPanel>
        <TabPanel>
          <GenericManagedAttributeListView
            apiPath="/loan-transaction-api/managed-attribute"
            prependLink="/loan-transaction/managed-attribute"
            componentSupport={false}
            titleKey="loanTransactionsSectionTitle"
          />
        </TabPanel>
        <TabPanel>
          <GenericManagedAttributeListView
            apiPath="/seqdb-api/managed-attribute"
            prependLink="/seqdb/managed-attribute"
            componentSupport={false}
            titleKey="seqdbManagedAttributeTitle"
          />
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

interface GenericManagedAttributeListViewProps {
  /**
   * Example: "/collection-api/managed-attribute"
   */
  apiPath: string;

  /**
   * Example: "/collection/managed-attribute" which will add /view?id=ID to the link
   */
  prependLink: string;

  /**
   * If data components are supported by the endpoint.
   */
  componentSupport: boolean;

  /**
   * Example: "collectionListTitle"
   */
  titleKey: string;
}

function GenericManagedAttributeListView({
  apiPath,
  prependLink,
  componentSupport,
  titleKey
}: GenericManagedAttributeListViewProps) {
  const { formatMessage } = useDinaIntl();

  const MANAGED_ATTRIBUTE_FILTER_COLUMNS = ["name", "key", "unit", "createdBy"];
  const MANAGED_ATTRIBUTE_COLUMNS: ColumnDefinition<
    ManagedAttribute<CollectionModuleType>
  >[] = [
    {
      cell: ({
        row: {
          original: { id, name }
        }
      }) => <Link href={`${prependLink}/view?id=${id}`}>{name}</Link>,
      header: "Name",
      accessorKey: "name"
    },
    ...(componentSupport
      ? [
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
          }
        ]
      : []),
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
      {/* Title */}
      <h3 className="mb-3">
        <DinaMessage id={titleKey as any} />
      </h3>

      {/* Quick create menu */}
      <CreateNewSection href={`${prependLink}/edit`} />

      {/* List Page */}
      <ListPageLayout
        filterAttributes={MANAGED_ATTRIBUTE_FILTER_COLUMNS}
        id={`managed-attribute-${titleKey}-list`}
        queryTableProps={{
          columns: MANAGED_ATTRIBUTE_COLUMNS,
          path: apiPath
        }}
        useFiql={true}
      />
    </>
  );
}
