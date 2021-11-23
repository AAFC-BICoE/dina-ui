import {
  ButtonBar,
  CreateButton,
  dateCell,
  FilterAttribute,
  filterBy,
  FormikButton,
  ListPageLayout
} from "common-ui";
import { PersistedResource } from "kitsu";
import Link from "next/link";
import { Promisable } from "type-fest";
import { Footer, GroupSelectField, Head, Nav } from "../../../components";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { AcquisitionEvent } from "../../../types/collection-api";
import { Person } from "../../../types/objectstore-api";

export default function AcquisitionEVentListPage() {
  const { formatMessage } = useDinaIntl();

  const title = "acquisitionEventListTitle";

  return (
    <div>
      <Head title={formatMessage(title)} />
      <Nav />
      <main className="container-fluid">
        <h1 id="wb-cont">
          <DinaMessage id={title} />
        </h1>
        <ButtonBar>
          <CreateButton entityLink="/collection/acquisition-event" />
        </ButtonBar>
        <AcquisitionEventListLayout />
      </main>
      <Footer />
    </div>
  );
}

export interface AcquisitionEventListLayoutProps {
  briefColumns?: boolean;
  hideTopPagination?: boolean;
  hideGroupFilter?: boolean;
  onSelect?: (sample: PersistedResource<AcquisitionEvent>) => Promisable<void>;
}

export function AcquisitionEventListLayout({
  briefColumns,
  hideGroupFilter,
  hideTopPagination,
  onSelect
}: AcquisitionEventListLayoutProps) {
  const { formatMessage } = useDinaIntl();

  const FILTER_ATTRIBUTES: FilterAttribute[] = [
    "receptionRemarks",
    {
      name: "receivedFrom",
      type: "DROPDOWN",
      resourcePath: "agent-api/person",
      filter: filterBy(["displayName"]),
      optionLabel: (it: PersistedResource<Person>) => it.displayName
    },
    {
      name: "externallyIsolatedBy",
      type: "DROPDOWN",
      resourcePath: "agent-api/person",
      filter: filterBy(["displayName"]),
      optionLabel: (it: PersistedResource<Person>) => it.displayName
    },
    "externallyIsolationRemarks"
  ];

  const TABLE_COLUMNS = [
    {
      Cell: ({ original: { id } }) => (
        <Link href={`/collection/acquisition-event/view?id=${id}`}>
          <a>
            <DinaMessage id="detailsPageLink" />
          </a>
        </Link>
      ),
      accessor: "id",
      sortable: false,
      Header: <DinaMessage id="detailsPageLink" />
    },
    {
      Cell: ({ original: { receivedFrom } }) => (
        <Link href={`/person/view?id=${receivedFrom?.id}`}>
          <a>{receivedFrom?.displayName}</a>
        </Link>
      ),
      accessor: "receivedFrom",
      sortable: false
    },
    dateCell("receivedDate"),
    "receptionRemarks",
    ...(briefColumns
      ? []
      : [
          {
            Cell: ({ original: { externallyIsolatedBy: agent } }) =>
              agent?.id ? (
                <Link href={`/person/view?id=${agent.id}`}>
                  {agent.displayName}
                </Link>
              ) : null,
            accessor: "externallyIsolatedBy",
            sortable: false
          },
          "externallyIsolationRemarks",
          dateCell("externallyIsolatedOn")
        ]),
    ...(onSelect
      ? [
          {
            Cell: ({ original: acqEvent }) => (
              <div className="d-flex">
                <FormikButton
                  className="btn btn-primary acquisition-event-link-button"
                  onClick={async () => await onSelect(acqEvent)}
                >
                  <DinaMessage id="select" />
                </FormikButton>
              </div>
            ),
            Header: formatMessage("actions"),
            sortable: false
          }
        ]
      : [])
  ];

  return (
    <ListPageLayout
      id="acquisition-event-list"
      filterAttributes={FILTER_ATTRIBUTES}
      queryTableProps={{
        columns: TABLE_COLUMNS,
        joinSpecs: [
          {
            apiBaseUrl: "/agent-api",
            idField: "receivedFrom.id",
            joinField: "receivedFrom",
            path: (acqEvent: AcquisitionEvent) =>
              `person/${acqEvent.receivedFrom?.id}`
          },
          {
            apiBaseUrl: "/agent-api",
            idField: "externallyIsolatedBy.id",
            joinField: "externallyIsolatedBy",
            path: (acqEvent: AcquisitionEvent) =>
              `person/${acqEvent.externallyIsolatedBy?.id}`
          }
        ],
        path: "collection-api/acquisition-event",
        include: "receivedFrom,externallyIsolatedBy",
        hideTopPagination
      }}
      {...(hideGroupFilter
        ? {}
        : {
            additionalFilters: filterForm => ({
              // Apply group filter:
              ...(filterForm.group && { rsql: `group==${filterForm.group}` })
            }),
            filterFormchildren: ({ submitForm }) => (
              <div className="mb-3">
                <div style={{ width: "300px" }}>
                  <GroupSelectField
                    onChange={() => setImmediate(submitForm)}
                    name="group"
                    showAnyOption={true}
                  />
                </div>
              </div>
            )
          })}
    />
  );
}
