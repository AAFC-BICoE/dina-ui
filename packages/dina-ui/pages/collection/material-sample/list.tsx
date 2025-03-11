import { Row } from "@tanstack/react-table";
import {
  ButtonBar,
  ColumnDefinition,
  CreateButton,
  dateCell,
  DeleteButton,
  FieldHeader,
  FilterAttribute,
  ListPageLayout,
  QueryPage,
  stringArrayCell
} from "common-ui";
import { PersistedResource } from "kitsu";
import Link from "next/link";
import {
  DynamicFieldsMappingConfig,
  TableColumn
} from "../../../../common-ui/lib/list-page/types";
import { useState, CSSProperties } from "react";
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
export const getColumnDefinition: () => ColumnDefinition<MaterialSample>[] =
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
      stringArrayCell("dwcOtherCatalogNumbers"),
      { accessorKey: "materialSampleType" },
      "createdBy",
      dateCell("createdOn")
    ];
  };

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
  const columns: ColumnDefinition<MaterialSample>[] = [
    ...getColumnDefinition(),
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

export const dynamicFieldMappingForMaterialSample: DynamicFieldsMappingConfig =
  {
    fields: [
      // Material Sample - Managed Attributes
      {
        type: "managedAttribute",
        label: "materialSampleManagedAttributes",
        component: "MATERIAL_SAMPLE",
        path: "data.attributes.managedAttributes",
        apiEndpoint: "collection-api/managed-attribute"
      },
      // Material Sample - Field Extensions
      {
        type: "fieldExtension",
        label: "fieldExtensions",
        component: "MATERIAL_SAMPLE",
        path: "data.attributes.extensionValues",
        apiEndpoint: "collection-api/extension"
      },
      // Material Sample - Identifiers
      {
        type: "identifier",
        label: "identifiers",
        component: "MATERIAL_SAMPLE",
        path: "data.attributes.identifiers",
        apiEndpoint: "collection-api/identifier-type"
      },

      // Preparation - Managed Attributes
      {
        type: "managedAttribute",
        label: "preparationManagedAttributes",
        component: "PREPARATION",
        path: "data.attributes.preparationManagedAttributes",
        apiEndpoint: "collection-api/managed-attribute"
      },

      // Restrictions
      {
        type: "fieldExtension",
        label: "restrictions",
        component: "RESTRICTION",
        path: "data.attributes.restrictionFieldsExtension",
        apiEndpoint: "collection-api/extension"
      },

      // Classification
      {
        type: "scientificNameDetails",
        label: "targetOrganismPrimaryClassification",
        component: "MATERIAL_SAMPLE",
        path: "data.attributes.targetOrganismPrimaryClassification"
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
      },

      // Attachment
      {
        type: "managedAttribute",
        label: "managedAttributes",
        path: "included.attributes.managedAttributes",
        apiEndpoint: "objectstore-api/managed-attribute",
        component: "ENTITY",
        referencedBy: "attachment",
        referencedType: "metadata"
      },

      // Parent Material Sample - Material Sample - Managed Attributes
      {
        type: "managedAttribute",
        label: "materialSampleManagedAttributes",
        path: "included.attributes.managedAttributes",
        apiEndpoint: "collection-api/managed-attribute",
        component: "MATERIAL_SAMPLE",
        referencedBy: "parentMaterialSample",
        referencedType: "material-sample"
      },
      // Parent Material Sample - Preparation - Managed Attributes
      {
        type: "managedAttribute",
        label: "preparationManagedAttributes",
        path: "included.attributes.preparationManagedAttributes",
        apiEndpoint: "collection-api/managed-attribute",
        component: "PREPARATION",
        referencedBy: "parentMaterialSample",
        referencedType: "material-sample"
      },
      // Parent Material Sample - Material Sample - Field Extensions
      {
        type: "fieldExtension",
        label: "fieldExtensions",
        component: "MATERIAL_SAMPLE",
        path: "included.attributes.extensionValues",
        apiEndpoint: "collection-api/extension",
        referencedBy: "parentMaterialSample",
        referencedType: "material-sample"
      },
      // Parent Material Sample - Material Sample - Restrictions
      {
        type: "fieldExtension",
        label: "restrictions",
        component: "RESTRICTION",
        path: "included.attributes.restrictionFieldsExtension",
        apiEndpoint: "collection-api/extension",
        referencedBy: "parentMaterialSample",
        referencedType: "material-sample"
      },
      // Parent Material Sample - Material Sample - Identifiers
      {
        type: "identifier",
        label: "identifiers",
        component: "MATERIAL_SAMPLE",
        path: "included.attributes.identifiers",
        apiEndpoint: "collection-api/identifier-type",
        referencedBy: "parentMaterialSample",
        referencedType: "material-sample"
      },
      // Parent Material Sample - Material Sample - Classification
      {
        type: "scientificNameDetails",
        label: "targetOrganismPrimaryClassification",
        component: "MATERIAL_SAMPLE",
        path: "included.attributes.targetOrganismPrimaryClassification",
        referencedBy: "parentMaterialSample",
        referencedType: "material-sample"
      }
    ]
  };

export default function MaterialSampleListPage() {
  const { formatMessage } = useDinaIntl();

  // Columns for the elastic search list page.
  const columns: TableColumn<any>[] = [
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
      id: "collection.name",
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
    stringArrayCell(
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

    // Material Sample State
    {
      id: "materialSampleState",
      header: () => <FieldHeader name="materialSampleState" />,
      accessorKey: "data.attributes.materialSampleState",
      isKeyword: true
    },

    // Group
    {
      id: "group",
      header: () => <FieldHeader name="group" />,
      accessorKey: "data.attributes.group"
    },

    // Created By
    {
      id: "createdBy",
      header: () => <FieldHeader name="createdBy" />,
      accessorKey: "data.attributes.createdBy",
      isKeyword: true
    },

    // Created On
    dateCell("createdOn", "data.attributes.createdOn")
  ];

  const rowStyling = (row: Row<any>): CSSProperties | undefined => {
    if (row?.original?.data?.attributes?.materialSampleState) {
      return { opacity: 0.4 };
    }
    return undefined;
  };

  return (
    <div>
      <Head title={formatMessage("materialSampleListTitle")} />
      <Nav marginBottom={false} />
      <ButtonBar>
        <div className="col-md-12 d-flex gap-2">
          <div className="ms-auto" />
          <CreateButton entityLink="/collection/material-sample" />
          <Link href={`/collection/material-sample/bulk-create`}>
            <a className="btn btn-primary">
              <DinaMessage id="bulkCreate" />
            </a>
          </Link>
        </div>
      </ButtonBar>
      <main className="container-fluid">
        <h1 id="wb-cont">
          <DinaMessage id="materialSampleListTitle" />
        </h1>
        <QueryPage
          rowStyling={rowStyling}
          indexName={"dina_material_sample_index"}
          uniqueName="material-sample-list"
          reactTableProps={{
            enableSorting: true,
            enableMultiSort: true
          }}
          enableRelationshipPresence={true}
          dynamicFieldMapping={dynamicFieldMappingForMaterialSample}
          columns={columns}
          mandatoryDisplayedColumns={["selectColumn", "materialSampleName"]}
          nonExportableColumns={[
            "selectColumn",
            "assemblages.",
            "projects.",
            "organism."
          ]}
          bulkDeleteButtonProps={{
            typeName: "material-sample",
            apiBaseUrl: "/collection-api"
          }}
          bulkEditPath="/collection/material-sample/bulk-edit"
          dataExportProps={{
            dataExportPath: "/export/data-export/export",
            entityLink: "/collection/material-sample"
          }}
          bulkSplitPath="/collection/material-sample/bulk-split"
        />
      </main>
      <Footer />
    </div>
  );
}
