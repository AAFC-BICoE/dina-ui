import "@testing-library/jest-dom";
import { mountWithAppContext, waitForLoadingToDisappear } from "common-ui";
import { QueryPage } from "../QueryPage";
import { Row } from "@tanstack/react-table";
import { TableColumn } from "../types";
import Link from "next/link";
import { FieldHeader } from "../../field-header/FieldHeader";
import { stringArrayCell } from "../../table/StringArrayCell";
import { dateCell } from "../../table/DateCell";

import { mockResponses } from "./__mocks__/QueryPageMocks";
import { waitFor } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";

const mockGet = jest.fn<any, any>(async (path) => {
  return mockResponses[path] ?? { data: [] };
});

const mockPost = jest.fn<any, any>(async (path) => {
  return mockResponses[path];
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

/** Helper function to create a test QueryPage component with standard configuration */
function createTestQueryPage() {
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
          {data?.attributes?.materialSampleName ||
            data?.attributes?.dwcOtherCatalogNumbers?.join?.(", ") ||
            id}
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
            {included?.collection?.attributes?.name}
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

  return mountWithAppContext(
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
}

describe("QueryPage test", () => {
  it("Render QueryPage for material-samples", async () => {
    const component = createTestQueryPage();
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

  it("Bulk Delete button works for material-samples", async () => {
    const wrapper = createTestQueryPage();

    const reactTable = await wrapper.findByTestId("ReactTable");
    expect(reactTable).toBeInTheDocument();

    // Click the "Select All" checkbox to select all items
    userEvent.click(
      wrapper.getByRole("checkbox", {
        name: /check all/i
      })
    );

    // Click the Bulk Delete button
    userEvent.click(
      wrapper.getByRole("button", {
        name: /delete selected/i
      })
    );

    await waitFor(() => {
      expect(wrapper.getByText(/delete selected \(2\)/i)).toBeInTheDocument();
    });
    userEvent.click(wrapper.getByRole("button", { name: /yes/i }));
    await waitForLoadingToDisappear();

    // screen.logTestingPlaygroundURL();
  });
});
