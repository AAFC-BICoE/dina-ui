import {
  FilterAttribute,
  filterBy,
  FormikButton,
  ListPageLayout
} from "common-ui";
import { PersistedResource } from "kitsu";
import Link from "next/link";
import { Promisable } from "type-fest";
import { GroupSelectField } from "..";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";
import { AcquisitionEvent } from "../../types/collection-api";
import { Person } from "../../types/objectstore-api";

export interface AcquisitionEventLinkerProps {
  onAcquisitionEventSelect: (selected: AcquisitionEvent) => Promisable<void>;
}

export function AcquisitionEventLinker({
  onAcquisitionEventSelect
}: AcquisitionEventLinkerProps) {
  return (
    <AcquisitionEventListLayout
      onSelect={async event => await onAcquisitionEventSelect(event)}
      hideGroupFilter={true}
      hideTopPagination={true}
    />
  );
}

export interface AcquisitionEventListLayoutProps {
  hideTopPagination?: boolean;
  hideGroupFilter?: boolean;
  onSelect?: (sample: PersistedResource<AcquisitionEvent>) => Promisable<void>;
}

export function AcquisitionEventListLayout({
  hideGroupFilter,
  hideTopPagination,
  onSelect
}: AcquisitionEventListLayoutProps) {
  const { formatMessage } = useDinaIntl();

  const FILTER_ATTRIBUTES: FilterAttribute[] = [
    "receivedDate",
    "receptionRemarks",
    {
      name: "receivedFrom.uuid",
      type: "DROPDOWN",
      resourcePath: "agent-api/person",
      filter: filterBy(["displayName"]),
      optionLabel: (it: PersistedResource<Person>) => it.displayName
    }
  ];

  const TABLE_COLUMNS = [
    {
      Cell: ({ original: { id, receivedDate } }) => (
        <Link href={`/collection/acquisition-event/view?id=${id}`}>
          {receivedDate || id}
        </Link>
      ),
      accessor: "receivedDate"
    },
    "receptionRemarks",
    "receivedFrom.displayName",
    ...(onSelect
      ? [
          {
            Cell: ({ original: acqEvent }) => (
              <div className="d-flex">
                <FormikButton
                  className="btn btn-primary"
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
            idField: "receivedFrom",
            joinField: "receivedFrom",
            path: (acqEvent: AcquisitionEvent) =>
              `person/${acqEvent.receivedFrom?.id}`
          }
        ],
        path: "collection-api/material-sample",
        include: "collection,materialSampleType",
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
