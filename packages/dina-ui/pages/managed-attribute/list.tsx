import {
  ColumnDefinition,
  CreateButton,
  dateCell,
  descriptionCell,
  FieldHeader,
  ListPageLayout
} from "common-ui";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
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

  const [currentTab, setCurrentTab] = useState<number>(
    router.query.tab ? Number(router.query.tab) : 0
  );

  /* Managed Attribute Tab Configuration */
  const tabs = [
    {
      titleKey: "collectionListTitle",
      apiPath: "/collection-api/managed-attribute",
      prependLink: "/collection/managed-attribute",
      componentSupport: true,
      useFiql: true
    },
    {
      titleKey: "objectStoreTitle",
      apiPath: "/objectstore-api/managed-attribute",
      prependLink: "/object-store/managed-attribute",
      componentSupport: false,
      useFiql: true
    },
    {
      titleKey: "loanTransactionsSectionTitle",
      apiPath: "/loan-transaction-api/managed-attribute",
      prependLink: "/loan-transaction/managed-attribute",
      componentSupport: false,
      useFiql: true
    },
    {
      titleKey: "seqdbManagedAttributeTitle",
      apiPath: "/seqdb-api/managed-attribute",
      prependLink: "/seqdb/managed-attribute",
      componentSupport: false,
      useFiql: false
    }
  ] as const;

  // Create new button, generated for each tab.
  const buttonBar = (
    <div className="flex d-flex ms-auto">
      <CreateButton entityLink={tabs[currentTab].prependLink} />
    </div>
  );

  return (
    <PageLayout titleId="managedAttributes" buttonBarContent={buttonBar}>
      <Tabs
        selectedIndex={currentTab}
        onSelect={setCurrentTab}
        id="managedAttributeListTab"
        className="mb-3"
      >
        <TabList>
          {tabs.map((tab) => (
            <Tab key={tab.titleKey}>{formatMessage(tab.titleKey)}</Tab>
          ))}
        </TabList>

        {tabs.map((tab) => (
          <TabPanel key={tab.titleKey}>
            <h3 className="mb-3">
              <DinaMessage id={tab.titleKey as any} />
            </h3>

            <GenericManagedAttributeListView
              apiPath={tab.apiPath}
              useFiql={tab.useFiql}
              prependLink={tab.prependLink}
              componentSupport={tab.componentSupport}
              titleKey={tab.titleKey}
            />
          </TabPanel>
        ))}
      </Tabs>
    </PageLayout>
  );
}

interface GenericManagedAttributeListViewProps {
  /**
   * Example: "/collection-api/managed-attribute"
   */
  apiPath: string;

  /**
   * If FIQL is used for filtering.
   */
  useFiql: boolean;

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
  useFiql,
  prependLink,
  componentSupport,
  titleKey
}: GenericManagedAttributeListViewProps) {
  const { formatMessage } = useDinaIntl();

  const MANAGED_ATTRIBUTE_FILTER_COLUMNS = [
    "name",
    "key",
    "unit",
    "createdBy",
    ...(componentSupport ? ["managedAttributeComponent"] : [])
  ];
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
    <ListPageLayout
      filterAttributes={MANAGED_ATTRIBUTE_FILTER_COLUMNS}
      id={`managed-attribute-${titleKey}-list`}
      queryTableProps={{
        columns: MANAGED_ATTRIBUTE_COLUMNS,
        path: apiPath
      }}
      useFiql={useFiql}
    />
  );
}
