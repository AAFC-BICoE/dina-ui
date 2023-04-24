import {
  ButtonBar,
  ColumnDefinition,
  CreateButton,
  dateCell,
  DeleteButton,
  FilterAttribute,
  ListPageLayout,
  QueryPage,
  stringArrayCell
} from "common-ui";
import { PersistedResource } from "kitsu";
import Link from "next/link";
import { Footer, GroupSelectField, Head, Nav } from "../../../components";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { MaterialSample } from "../../../types/collection-api";
import { useState } from "react";
import { TableColumn } from "common-ui/lib/list-page/types";

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
export const getColumnDefinition = () => {
  return [
    {
      Cell: ({
        original: { id, materialSampleName, dwcOtherCatalogNumbers }
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
      accessor: "materialSampleName"
    },
    {
      Cell: ({ original: { collection } }) =>
        collection?.id ? (
          <Link href={`/collection/collection/view?id=${collection?.id}`}>
            {collection?.name}
          </Link>
        ) : null,
      accessor: "collection.name"
    },
    stringArrayCell("dwcOtherCatalogNumbers"),
    { accessor: "materialSampleType" },
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
            Cell: ({ original: sample }) => (
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
            Header: formatMessage("actions"),
            sortable: false
          }
        ]
      : [
          {
            Cell: ({ original: sample }) => (
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
            Header: "",
            sortable: false
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
  const columns: TableColumn<MaterialSample>[] = [
    // Material Sample Name
    {
      Cell: ({ original: { id, data } }) => (
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
      label: "materialSampleName",
      accessor: "data.attributes.materialSampleName",
      isKeyword: true
    },

    // Collection Name (External Relationship)
    {
      Cell: ({ original: { included } }) =>
        included?.collection?.id ? (
          <Link
            href={`/collection/collection/view?id=${included?.collection?.id}`}
          >
            {included?.collection?.attributes?.name}
          </Link>
        ) : null,
      label: "collection.name",
      accessor: "included.attributes.name",
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
      label: "materialSampleType",
      accessor: "data.attributes.materialSampleType",
      isKeyword: true
    },

    // Created By
    {
      label: "createdBy",
      accessor: "data.attributes.createdBy",
      isKeyword: true
    },

    // Created On
    dateCell("createdOn", "data.attributes.createdOn"),

    // Action buttons for each row.
    ...[
      {
        Cell: ({ original: sample }) => (
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
            />
          </div>
        ),
        Header: "",
        sortable: false
      }
    ]
  ];

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
