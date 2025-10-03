import {
  ColumnDefinition,
  CreateButton,
  dateCell,
  ListPageLayout,
  SimpleSearchFilterBuilder,
  stringArrayCell
} from "common-ui";
import Link from "next/link";
import PageLayout from "packages/dina-ui/components/page/PageLayout";
import { CollectingEvent } from "packages/dina-ui/types/collection-api";
import { groupCell, GroupSelectField, Head } from "../../../components";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";

export default function CollectingEventListPage() {
  const { formatMessage } = useDinaIntl();

  const COLLECTING_EVENT_FILTER_ATTRIBUTES = [
    "createdBy",
    "dwcFieldNumber",
    "dwcRecordNumber"
  ];

  const COLLECTING_EVENT_TABLE_COLUMNS: ColumnDefinition<CollectingEvent>[] = [
    {
      cell: ({
        row: {
          original: { id }
        }
      }) => (
        <Link href={`/collection/collecting-event/view?id=${id}`}>
          <DinaMessage id="viewDetails" />
        </Link>
      ),
      accessorKey: "id",
      header: () => <DinaMessage id="viewDetails" />,
      enableSorting: false
    },
    "dwcFieldNumber",
    "dwcRecordNumber",
    stringArrayCell("otherRecordNumbers"),
    "startEventDateTime",
    "endEventDateTime",
    "verbatimEventDateTime",
    groupCell("group"),
    "createdBy",
    dateCell("createdOn")
  ];

  return (
    <PageLayout
      titleId="collectingEventListTitle"
      buttonBarContent={
        <div className="flex d-flex ms-auto">
          <CreateButton entityLink="/collection/collecting-event" />
        </div>
      }
    >
      <Head title={formatMessage("collectingEventListTitle")} />
      <ListPageLayout
        additionalFilters={(filterForm) =>
          SimpleSearchFilterBuilder.create<CollectingEvent>()
            .whereProvided("group", "EQ", filterForm.group)
            .build()
        }
        filterAttributes={COLLECTING_EVENT_FILTER_ATTRIBUTES}
        id="collecting-event-list"
        queryTableProps={{
          columns: COLLECTING_EVENT_TABLE_COLUMNS,
          path: "collection-api/collecting-event"
        }}
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
        useFiql={true}
      />
    </PageLayout>
  );
}
