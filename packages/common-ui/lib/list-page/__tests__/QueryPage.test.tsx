import "@testing-library/jest-dom";
import { mountWithAppContext } from "../../test-util/mock-app-context";
import { QueryPage } from "../QueryPage";
import { Row } from "@tanstack/react-table";
import { TableColumn } from "../types";
import Link from "next/link";
import { FieldHeader } from "../../field-header/FieldHeader";
import { stringArrayCell } from "../../table/StringArrayCell";
import { dateCell } from "../../table/DateCell";

const mockGet = jest.fn<any, any>(async (path) => {
  switch (path) {
    case "user-api/group":
      return {
        data: [
          {
            id: "2b4549e9-9a95-489f-8e30-74c2d877d8a8",
            type: "group",
            name: "cnc",
            labels: { en: "CNC" }
          }
        ],
        links: {
          first: "/api/v1/group?page[limit]=1000&filter[name]=cnc",
          last: "/api/v1/group?page[limit]=1000&filter[name]=cnc"
        },
        meta: { totalResourceCount: 1, moduleVersion: "0.16" }
      };
    case "search-api/search-ws/mapping":
      return {
        attributes: [
          { name: "createdOn", type: "date", path: "data.attributes" },
          {
            name: "materialSampleName",
            type: "text",
            fields: ["keyword"],
            path: "data.attributes"
          },
          {
            name: "preparationDate",
            type: "date",
            path: "data.attributes",
            subtype: "local_date"
          },
          {
            name: "publiclyReleasable",
            type: "boolean",
            path: "data.attributes"
          },
          {
            name: "tags",
            type: "text",
            fields: ["keyword"],
            path: "data.attributes"
          },
          {
            name: "createdBy",
            type: "text",
            fields: ["keyword"],
            path: "data.attributes"
          }
        ],
        relationships: [
          {
            referencedBy: "collectingEvent",
            name: "type",
            path: "included",
            value: "collecting-event",
            attributes: [
              { name: "createdBy", type: "text", path: "attributes" },
              { name: "createdOn", type: "date", path: "attributes" },
              { name: "tags", type: "text", path: "attributes" },
              { name: "habitat", type: "text", path: "attributes" },
              { name: "substrate", type: "text", path: "attributes" },
              {
                name: "dwcOtherRecordNumbers",
                type: "text",
                path: "attributes"
              },
              { name: "dwcRecordNumber", type: "text", path: "attributes" },
              { name: "startEventDateTime", type: "date", path: "attributes" },
              { name: "endEventDateTime", type: "date", path: "attributes" },
              { name: "host", type: "text", path: "attributes" },
              { name: "dwcVerbatimLocality", type: "text", path: "attributes" }
            ]
          },
          {
            referencedBy: "preparationMethod",
            name: "type",
            path: "included",
            value: "preparation-method",
            attributes: [
              {
                name: "name",
                type: "text",
                path: "attributes",
                distinct_term_agg: true
              }
            ]
          },
          {
            referencedBy: "projects",
            name: "type",
            path: "included",
            value: "project",
            attributes: [
              {
                name: "name",
                type: "text",
                path: "attributes",
                distinct_term_agg: true
              }
            ]
          },
          {
            referencedBy: "storageUnit",
            name: "type",
            path: "included",
            value: "storage-unit",
            attributes: [{ name: "name", type: "text", path: "attributes" }]
          },
          {
            referencedBy: "organism",
            name: "type",
            path: "included",
            value: "organism",
            attributes: [
              {
                name: "verbatimScientificName",
                type: "text",
                path: "attributes.determination"
              },
              {
                name: "scientificName",
                type: "text",
                path: "attributes.determination"
              },
              {
                name: "typeStatus",
                type: "text",
                path: "attributes.determination"
              }
            ]
          },
          {
            referencedBy: "collection",
            name: "type",
            path: "included",
            value: "collection",
            attributes: [
              {
                name: "name",
                type: "text",
                path: "attributes",
                distinct_term_agg: true
              },
              {
                name: "code",
                type: "text",
                path: "attributes",
                distinct_term_agg: true
              }
            ]
          },
          {
            referencedBy: "assemblages",
            name: "type",
            path: "included",
            value: "assemblage",
            attributes: [{ name: "name", type: "text", path: "attributes" }]
          },
          {
            referencedBy: "preparationType",
            name: "type",
            path: "included",
            value: "preparation-type",
            attributes: [
              {
                name: "name",
                type: "text",
                path: "attributes",
                distinct_term_agg: true
              }
            ]
          }
        ],
        index_name: "dina_material_sample_index"
      };
    default:
      return { data: [] };
  }
});

const mockPost = jest.fn<any, any>(async (path) => {
  switch (path) {
    // Elastic search response with object store mock metadata data.
    case "search-api/search-ws/search":
      return {
        data: {
          took: 9,
          timed_out: false,
          _shards: { failed: 0.0, successful: 1.0, total: 1.0, skipped: 0.0 },
          hits: {
            total: { relation: "eq", value: 2 },
            hits: [
              {
                _index: "dina_material_sample_index",
                _id: "074e745e-7ef1-449c-965a-9a4dc754391f",
                _type: "_doc",
                _source: {
                  data: {
                    attributes: {
                      materialSampleType: null,
                      dwcOtherCatalogNumbers: null,
                      createdBy: "cnc-su",
                      materialSampleName: "Sample 1",
                      createdOn: "2023-12-14T18:48:13.080841Z",
                      materialSampleState: null
                    },
                    id: "074e745e-7ef1-449c-965a-9a4dc754391f",
                    type: "material-sample"
                  }
                },
                sort: [1702579693080]
              },
              {
                _index: "dina_material_sample_index",
                _id: "7c2b6795-02bb-4edd-97af-589527ef3e7f",
                _type: "_doc",
                _source: {
                  data: {
                    attributes: {
                      materialSampleType: null,
                      dwcOtherCatalogNumbers: null,
                      createdBy: "cnc-su",
                      materialSampleName: "Sample 2",
                      createdOn: "2023-12-09T16:53:14.363355Z",
                      materialSampleState: "decommissioned"
                    },
                    id: "7c2b6795-02bb-4edd-97af-589527ef3e7f",
                    type: "material-sample"
                  },
                  included: [
                    {
                      attributes: { name: "Collection 1" },
                      id: "25a1b789-a315-4ac2-8cbf-415dacf2f0de",
                      type: "collection"
                    },
                    {
                      id: "492c8679-fc1f-44f1-8839-69f8e6fdd79a",
                      type: "metadata"
                    }
                  ]
                },
                sort: [1702140794363]
              }
            ]
          }
        }
      };
  }
});

const testCtx = {
  apiContext: {
    apiClient: {
      get: mockGet,
      axios: {
        post: mockPost,
        get: mockGet
      }
    },
    bulkGet: jest.fn()
  }
} as any;

describe("QueryPage test", () => {
  it("Render QueryPage for material-samples", async () => {
    const rowStyling = (row: Row<any>) =>
      row?.original?.data?.attributes?.materialSampleState && {
        opacity: 0.4
      };

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

    const component = mountWithAppContext(
      <QueryPage
        rowStyling={rowStyling}
        indexName={"dina_material_sample_index"}
        uniqueName="material-sample-list"
        reactTableProps={{
          enableSorting: true,
          enableMultiSort: true
        }}
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
        dataExportProps={{
          dataExportPath: "/export/data-export/export",
          entityLink: "/collection/material-sample"
        }}
        // bulkSplitPath="/collection/material-sample/bulk-split"
      />,
      testCtx
    );
    const reactTable = await component.findByTestId("ReactTable");
    expect(reactTable).toBeInTheDocument();
    expect(reactTable.querySelectorAll("table tbody tr").length).toBe(2);
    expect(
      reactTable.querySelectorAll("table tbody tr")[0].getAttribute("style")
    ).toBeNull();
    expect(
      reactTable.querySelectorAll("table tbody tr")[1].getAttribute("style")
    ).toEqual("opacity: 0.4;");
  });
});
