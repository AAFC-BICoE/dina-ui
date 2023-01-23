import {
  ButtonBar,
  CreateButton,
  dateCell,
  ListPageLayout,
  stringArrayCell
} from "common-ui";
import Link from "next/link";
import { Footer, GroupSelectField, Head, Nav } from "../../../components";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";

export default function CollectingEventListPage() {
  const { formatMessage } = useDinaIntl();

  const COLLECTING_EVENT_FILTER_ATTRIBUTES = [
    "createdBy",
    "dwcFieldNumber",
    "dwcRecordNumber"
  ];
  const COLLECTING_EVENT_TABLE_COLUMNS = [
    {
      Cell: ({ original: { id } }) => (
        <Link href={`/collection/collecting-event/view?id=${id}`}>
          <a>
            <DinaMessage id="viewDetails" />
          </a>
        </Link>
      ),
      accessor: "id",
      Header: <DinaMessage id="viewDetails" />,
      sortable: false
    },
    "dwcFieldNumber",
    "dwcRecordNumber",
    stringArrayCell("otherRecordNumbers"),
    "createdBy",
    "startEventDateTime",
    "endEventDateTime",
    "verbatimEventDateTime",
    dateCell("createdOn")
  ];

  return (
    <div>
      <Head title={formatMessage("collectingEventListTitle")} />
      <Nav />
      <main className="container-fluid">
        <h1 id="wb-cont">
          <DinaMessage id="collectingEventListTitle" />
        </h1>
        <ButtonBar>
          <CreateButton entityLink="/collection/collecting-event" />
        </ButtonBar>
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
      </main>
      <Footer />
    </div>
  );
}
