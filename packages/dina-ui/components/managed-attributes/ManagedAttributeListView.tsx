import {
  ColumnDefinition,
  dateCell,
  descriptionCell,
  FieldHeader,
  ListPageLayout
} from "common-ui";
import Link from "next/link";
import { DINAUI_MESSAGES_ENGLISH } from "../../intl/dina-ui-en";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";

import { groupCell } from "../index";
import {
  COLLECTION_MODULE_TYPE_LABELS,
  CollectionModuleType,
  VOCABULARY_ELEMENT_TYPE_OPTIONS,
  ManagedAttribute
} from "../../types/collection-api";

export interface ManagedAttributeListViewProps {
  /** API path, e.g. "/collection-api/managed-attribute" */
  apiPath: string;
  /** Link prefix for the view page, e.g. "/collection/managed-attribute" */
  prependLink: string;
  /** Whether the endpoint supports managed attribute components */
  componentSupport: boolean;
  /** Unique key for the list element ID */
  listKey: string;
}

/**
 * List view for a single managed-attribute endpoint.  Used on the
 * (deprecated) managed-attribute page inside module tabs.
 */
export function ManagedAttributeListView({
  apiPath,
  prependLink,
  componentSupport,
  listKey
}: ManagedAttributeListViewProps) {
  const { formatMessage } = useDinaIntl();

  const filterAttributes = [
    "name",
    "key",
    "unit",
    "createdBy",
    ...(componentSupport ? ["managedAttributeComponent"] : [])
  ];

  const columns: ColumnDefinition<ManagedAttribute<CollectionModuleType>>[] = [
    {
      cell: ({
        row: {
          original: { id, name }
        }
      }) => <Link href={`${prependLink}/view?id=${id}`}>{name}</Link>,
      header: () => <FieldHeader name="name" />,
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
            : VOCABULARY_ELEMENT_TYPE_OPTIONS.find(
                (option) => option.value === vocabularyElementType
              )?.labelKey;

        return <div>{labelKey && <DinaMessage id={labelKey} />}</div>;
      },
      accessorKey: "vocabularyElementType",
      enableSorting: false
    },
    {
      accessorKey: "unit",
      header: () => <FieldHeader name="unit" />
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
      filterAttributes={filterAttributes}
      id={`managed-attribute-${listKey}-list`}
      queryTableProps={{ columns, path: apiPath }}
    />
  );
}
