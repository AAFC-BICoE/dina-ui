import {
  ButtonBar,
  ColumnDefinition8,
  CreateButton,
  dateCell8,
  ListPageLayout,
  stringArrayCell8
} from "common-ui";
import Link from "next/link";
import { Footer, GroupSelectField, Head, Nav } from "../../../components";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import PageLayout from "packages/dina-ui/components/page/PageLayout";
import { CollectingEvent } from "packages/dina-ui/types/collection-api";

export default function CollectingEventListPage() {
  const { formatMessage } = useDinaIntl();

  const COLLECTING_EVENT_FILTER_ATTRIBUTES = [
    "createdBy",
    "dwcFieldNumber",
    "dwcRecordNumber"
  ];
  const COLLECTING_EVENT_TABLE_COLUMNS: ColumnDefinition8<CollectingEvent>[] = [
    {
      cell: ({
        row: {
          original: { id }
        }
      }) => (
        <Link href={`/collection/collecting-event/view?id=${id}`}>
          <a>
            <DinaMessage id="viewDetails" />
          </a>
        </Link>
      ),
      accessorKey: "id",
      header: () => <DinaMessage id="viewDetails" />,
      enableSorting: false
    },
    "dwcFieldNumber",
    "dwcRecordNumber",
    stringArrayCell8("otherRecordNumbers"),
    "createdBy",
    "startEventDateTime",
    "endEventDateTime",
    "verbatimEventDateTime",
    dateCell8("createdOn")
  ];

  return (
    <PageLayout
      titleId="collectingEventListTitle"
      buttonBarContent={
        <CreateButton entityLink="/collection/collecting-event" />
      }
    >
      <Head title={formatMessage("collectingEventListTitle")} />
      <ListPageLayout
        additionalFilters={(filterForm) => ({
          // Apply group filter:
          ...(filterForm.group && { rsql: `group==${filterForm.group}` })
        })}
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
      />
    </PageLayout>
  );
}
