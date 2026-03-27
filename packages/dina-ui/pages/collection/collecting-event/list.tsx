import Link from "next/link";
import {
  CreateButton,
  dateCell,
  QueryPage,
  stringArrayCell,
  FieldHeader
} from "common-ui";
import PageLayout from "packages/dina-ui/components/page/PageLayout";
import { DinaMessage } from "../../../intl/dina-ui-intl";
import { TableColumn } from "packages/common-ui/lib/list-page/types";
import { CollectingEvent } from "packages/dina-ui/types/collection-api";

const NON_EXPORTABLE_COLUMNS = ["selectColumn"];

export const columns: TableColumn<CollectingEvent>[] = [
  {
    cell: ({
      row: {
        original: { id }
      }
    }) => {
      return (
        <Link href={`/collection/collecting-event/view?id=${id}`}>
          <DinaMessage id="viewDetails" />
        </Link>
      );
    },
    accessorKey: "data.attributes.id",
    header: () => <FieldHeader name="viewDetails" />,
    enableSorting: false,
    id: "viewDetails"
  },
  {
    id: "dwcFieldNumber",
    header: () => <FieldHeader name="dwcFieldNumber" />,
    accessorKey: "data.attributes.dwcFieldNumber"
  },
  {
    id: "dwcRecordNumber",
    header: () => <FieldHeader name="dwcRecordNumber" />,
    accessorKey: "data.attributes.dwcRecordNumber"
  },
  stringArrayCell("otherRecordNumbers"),
  {
    id: "startEventDateTime",
    header: () => <FieldHeader name="startEventDateTime" />,
    accessorKey: "data.attributes.startEventDateTime"
  },
  {
    id: "endEventDateTime",
    header: () => <FieldHeader name="endEventDateTime" />,
    accessorKey: "data.attributes.endEventDateTime"
  },
  {
    id: "verbatimEventDateTime",
    header: () => <FieldHeader name="verbatimEventDateTime" />,
    accessorKey: "data.attributes.verbatimEventDateTime"
  },
  {
    id: "group",
    header: () => <FieldHeader name="group" />,
    accessorKey: "data.attributes.group"
  },
  {
    id: "createdBy",
    header: () => <FieldHeader name="createdBy" />,
    accessorKey: "data.attributes.createdBy"
  },
  dateCell("createdOn", "data.attributes.createdOn")
];

export default function CollectingEventListPage() {
  return (
    <PageLayout
      titleId="collectingEventListTitle"
      buttonBarContent={
        <div className="flex d-flex ms-auto">
          <CreateButton entityLink="/collection/collecting-event" />
        </div>
      }
    >
      <QueryPage
        indexName={"dina_collecting_event_index"}
        uniqueName="collecting-event-list"
        reactTableProps={{
          enableSorting: true,
          enableMultiSort: true
        }}
        enableRelationshipPresence={true}
        mandatoryDisplayedColumns={[
          "selectColumn",
          "viewDetails",
          "dwcFieldNumber"
        ]}
        nonExportableColumns={NON_EXPORTABLE_COLUMNS}
        columns={columns}
        bulkDeleteButtonProps={{
          typeName: "collecting-event",
          apiBaseUrl: "/collection-api"
        }}
        dynamicFieldMapping={{
          fields: [],
          relationshipFields: [
            {
              label: "siteGeom",
              path: "included.attributes.siteGeom",
              type: "geoShape",
              referencedBy: "site",
              referencedType: "site"
            }
          ]
        }}
      />
    </PageLayout>
  );
}
