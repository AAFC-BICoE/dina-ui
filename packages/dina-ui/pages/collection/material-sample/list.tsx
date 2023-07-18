import { Row } from "@tanstack/react-table";
import {
  ButtonBar,
  ColumnDefinition,
  ColumnDefinition8,
  CreateButton,
  dateCell,
  dateCell8,
  DeleteButton,
  FieldHeader,
  FilterAttribute,
  ListPageLayout,
  QueryPage,
  stringArrayCell,
  stringArrayCell8
} from "common-ui";
import { PersistedResource } from "kitsu";
import Link from "next/link";
import { TableColumn8 } from "packages/common-ui/lib/list-page/types";
import { useState } from "react";
import { Footer, GroupSelectField, Head, Nav } from "../../../components";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { MaterialSample } from "../../../types/collection-api";

export interface SampleListLayoutProps {
  onSelect?: (sample: PersistedResource<MaterialSample>) => void;
  classNames?: string;
  btnMsg?: string;
  hideTopPagination?: boolean;
  hideGroupFilter?: boolean;
  showBulkActions?: boolean;
}

/**
 * This getColumnDefinition is used for the QueryTable, not the new elastic search stuff.
 *
 * The old version of the listing is still when searching for associated samples.
 */
export const getColumnDefinition: () => ColumnDefinition8<MaterialSample>[] =
  () => {
    return [
      {
        cell: ({
          row: {
            original: { id, materialSampleName, dwcOtherCatalogNumbers }
          }
        }) => (
          <Link
            href={`/collection/material-sample/view?id=${id}`}
            passHref={true}
          >
            <a>
              {materialSampleName || dwcOtherCatalogNumbers?.join?.(", ") || id}
            </a>
          </Link>
        ),
        accessorKey: "materialSampleName"
      },
      {
        cell: ({
          row: {
            original: { collection }
          }
        }) =>
          collection?.id ? (
            <Link href={`/collection/collection/view?id=${collection?.id}`}>
              {collection?.name}
            </Link>
          ) : null,
        accessorKey: "collection.name"
      },
      stringArrayCell8("dwcOtherCatalogNumbers"),
      { accessorKey: "materialSampleType" },
      "createdBy",
      dateCell8("createdOn")
    ];
  };

/**
 * This getColumnDefinition is used for the QueryTable, not the new elastic search stuff.
 *
 * The old version of the listing is still when searching for associated samples.
 */
export function getColumnDefinition8(): ColumnDefinition8<MaterialSample>[] {
  return [
    {
      cell: ({
        row: {
          original: { id, materialSampleName, dwcOtherCatalogNumbers }
        }
      }) => (
        <Link
          href={`/collection/material-sample/view?id=${id}`}
          passHref={true}
        >
          <a>
            {materialSampleName || dwcOtherCatalogNumbers?.join?.(", ") || id}
          </a>
        </Link>
      ),
      accessorKey: "materialSampleName"
    },
    {
      cell: ({
        row: {
          original: { collection }
        }
      }) =>
        collection?.id ? (
          <Link href={`/collection/collection/view?id=${collection?.id}`}>
            {collection?.name}
          </Link>
        ) : null,
      accessorKey: "collection.name"
    },
    stringArrayCell8("dwcOtherCatalogNumbers"),
    { accessorKey: "materialSampleType" },
    "createdBy",
    dateCell8("createdOn")
  ];
}

export function SampleListLayout({
  onSelect,
  classNames,
  btnMsg,
  hideTopPagination,
  hideGroupFilter,
  showBulkActions
}: SampleListLayoutProps) {
  const { formatMessage } = useDinaIntl();
  const MATERIAL_SAMPLE_FILTER_ATTRIBUTES: FilterAttribute[] = [
    "materialSampleName",
    "dwcOtherCatalogNumbers",
    "createdBy",
    "collection.name",
    "collection.code",
    "materialSampleType",
    {
      name: "createdOn",
      type: "DATE"
    }
  ];
  const [queryKey, setQueryKey] = useState("");

  // The old style columns, but add the action buttons at the end.
  const columns: ColumnDefinition8<MaterialSample>[] = [
    ...getColumnDefinition8(),
    ...(onSelect
      ? [
          {
            cell: ({ row: { original: sample } }) => (
              <div className="d-flex">
                <button
                  type="button"
                  className={classNames}
                  onClick={() => onSelect(sample)}
                >
                  {btnMsg}
                </button>
              </div>
            ),
            header: formatMessage("actions"),
            enableSorting: false
          }
        ]
      : [
          {
            cell: ({ row: { original: sample } }) => (
              <div className="d-flex">
                <Link href={`/collection/material-sample/view?id=${sample.id}`}>
                  <a className="btn btn-link">
                    <DinaMessage id="view" />
                  </a>
                </Link>
                <Link href={`/collection/material-sample/edit?id=${sample.id}`}>
                  <a className="btn btn-link">
                    <DinaMessage id="editButtonText" />
                  </a>
                </Link>
                <DeleteButton
                  replaceClassName="btn btn-link"
                  type="material-sample"
                  id={sample.id}
                  options={{ apiBaseUrl: "/collection-api" }}
                  onDeleted={() => setQueryKey(String(Math.random()))}
                />
              </div>
            ),
            header: "",
            enableSorting: false
          }
        ])
  ];
  return (
    <ListPageLayout
      additionalFilters={(filterForm) => ({
        // Apply group filter:
        ...(filterForm.group && { rsql: `group==${filterForm.group}` })
      })}
      filterAttributes={MATERIAL_SAMPLE_FILTER_ATTRIBUTES}
      id="material-sample-list"
      queryTableProps={{
        columns,
        path: "collection-api/material-sample",
        include: "collection",
        hideTopPagination,
        deps: [queryKey]
      }}
      filterFormchildren={({ submitForm }) =>
        !hideGroupFilter ? (
          <div className="mb-3">
            <div style={{ width: "300px" }}>
              <GroupSelectField
                onChange={() => setImmediate(submitForm)}
                name="group"
                showAnyOption={true}
              />
            </div>
          </div>
        ) : (
          <></>
        )
      }
      bulkDeleteButtonProps={
        showBulkActions
          ? {
              typeName: "material-sample",
              apiBaseUrl: "/collection-api"
            }
          : undefined
      }
      bulkEditPath={
        showBulkActions ? "/collection/material-sample/bulk-edit" : undefined
      }
    />
  );
}

export default function MaterialSampleListPage() {
  const { formatMessage } = useDinaIntl();

  // Columns for the elastic search list page.
  const columns: TableColumn8<any>[] = [
    // Material Sample Name
    {
      id: "materialSampleName",
      cell: ({
        row: {
          original: { id, data }
        }
      }) => (
        <Link
          href={`/collection/material-sample/view?id=${id}`}
          passHref={true}
        >
          <a>
            {data?.attributes?.materialSampleName ||
              data?.attributes?.dwcOtherCatalogNumbers?.join?.(", ") ||
              id}
          </a>
        </Link>
      ),
      header: () => <FieldHeader name="materialSampleName" />,
      accessorKey: "data.attributes.materialSampleName",
      isKeyword: true
    },

    // Collection Name (External Relationship)
    {
      id: "collectionName",
      cell: ({
        row: {
          original: { included }
        }
      }) =>
        included?.collection?.id ? (
          <Link
            href={`/collection/collection/view?id=${included?.collection?.id}`}
          >
            <a>{included?.collection?.attributes?.name}</a>
          </Link>
        ) : null,
      header: () => <FieldHeader name="collection.name" />,
      accessorKey: "included.attributes.name",
      relationshipType: "collection",
      isKeyword: true
    },

    // List of catalogue numbers
    stringArrayCell8(
      "dwcOtherCatalogNumbers",
      "data.attributes.dwcOtherCatalogNumbers"
    ),

    // Material Sample Type
    {
      id: "materialSampleType",
      header: () => <FieldHeader name="materialSampleType" />,
      accessorKey: "data.attributes.materialSampleType",
      isKeyword: true
    },

    // Created By
    {
      id: "createdBy",
      header: () => <FieldHeader name="createdBy" />,
      accessorKey: "data.attributes.createdBy",
      isKeyword: true
    },

    // Created On
    dateCell8("createdOn", "data.attributes.createdOn"),

    // Material Sample State
    {
      id: "materialSampleState",
      header: () => <FieldHeader name="materialSampleState" />,
      accessorKey: "data.attributes.materialSampleState",
      isKeyword: true,
      isColumnVisible: false
    }
  ];

  function rowStyling(row: Row<MaterialSample>) {
    return {
      style: {
        opacity: row?.original?.materialSampleState && 0.4
      }
    };
  }

  return (
    <div>
      <Head title={formatMessage("materialSampleListTitle")} />
      <Nav />
      <main className="container-fluid">
        <h1 id="wb-cont">
          <DinaMessage id="materialSampleListTitle" />
        </h1>
        <ButtonBar>
          <CreateButton entityLink="/collection/material-sample" />
          <Link href={`/collection/material-sample/bulk-create`}>
            <a className="btn btn-primary">
              <DinaMessage id="bulkCreate" />
            </a>
          </Link>
        </ButtonBar>
        <QueryPage
          rowStyling={rowStyling}
          indexName={"dina_material_sample_index"}
          dynamicFieldMapping={{
            fields: [
              // Managed Attributes
              {
                type: "managedAttribute",
                label: "managedAttributes",
                component: "MATERIAL_SAMPLE",
                path: "data.attributes.managedAttributes",
                apiEndpoint: "collection-api/managed-attribute"
              },

              // Field Extensions
              {
                type: "fieldExtension",
                label: "fieldExtensions",
                component: "MATERIAL_SAMPLE",
                path: "data.attributes.extensionValues",
                apiEndpoint: "collection-api/extension"
              },

              // Restrictions
              {
                type: "fieldExtension",
                label: "restrictions",
                component: "RESTRICTION",
                path: "data.attributes.restrictionFieldsExtension",
                apiEndpoint: "collection-api/extension"
              }
            ],
            relationshipFields: [
              // Assemblage
              {
                type: "managedAttribute",
                label: "managedAttributes",
                component: "ASSEMBLAGE",
                path: "included.attributes.managedAttributes",
                referencedBy: "assemblages",
                referencedType: "assemblage",
                apiEndpoint: "collection-api/managed-attribute"
              },

              // Collecting Event
              {
                type: "managedAttribute",
                label: "managedAttributes",
                component: "COLLECTING_EVENT",
                path: "included.attributes.managedAttributes",
                referencedBy: "collectingEvent",
                referencedType: "collecting-event",
                apiEndpoint: "collection-api/managed-attribute"
              },
              {
                type: "fieldExtension",
                label: "fieldExtensions",
                component: "COLLECTING_EVENT",
                path: "included.attributes.extensionValues",
                referencedBy: "collectingEvent",
                referencedType: "collecting-event",
                apiEndpoint: "collection-api/extension"
              },

              // Determination
              {
                type: "managedAttribute",
                label: "managedAttributes",
                component: "DETERMINATION",
                path: "included.attributes.determination.managedAttributes",
                referencedBy: "organism",
                referencedType: "organism",
                apiEndpoint: "collection-api/managed-attribute"
              }
            ]
          }}
          columns={columns}
          bulkDeleteButtonProps={{
            typeName: "material-sample",
            apiBaseUrl: "/collection-api"
          }}
          bulkEditPath="/collection/material-sample/bulk-edit"
          // bulkSplitPath="/collection/material-sample/bulk-split"
        />
      </main>
      <Footer />
    </div>
  );
}
