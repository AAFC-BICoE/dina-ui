import {
  ColumnDefinition,
  FilterForm,
  FormikButton,
  QueryTable,
  rsql,
  stringArrayCell
} from "common-ui";
import { FormikContextType } from "formik";
import { FilterParam } from "kitsu";
import Link from "next/link";
import { useState } from "react";
import { DinaMessage } from "../../../intl/dina-ui-intl";
import { CollectingEvent } from "../../../types/collection-api";
import { Person } from "../../../types/objectstore-api";
import { GroupSelectField } from "../../group-select/GroupSelectField";

export interface CollectingEventFilterFormValues {
  createdBy?: string;
  agent?: Person;
  location?: string;
  date?: { min?: string; max?: string };
}

export interface CollectingEventLinkerProps {
  onCollectingEventSelect: (
    collectingEvent: CollectingEvent,
    formik: FormikContextType<any>
  ) => void | Promise<void>;
}

/** Linking form to link to an existing CollectingEvent. */
export function CollectingEventLinker({
  onCollectingEventSelect
}: CollectingEventLinkerProps) {
  const COLLECTING_EVENT_TABLE_COLUMNS: ColumnDefinition<CollectingEvent>[] = [
    "dwcFieldNumber",
    stringArrayCell("otherRecordNumbers"),
    "createdBy",
    {
      Cell: ({ original: { dwcVerbatimLocality } }) => (
        <>{dwcVerbatimLocality}</>
      ),
      Header: <DinaMessage id="locationLabel" />,
      sortable: false
    },
    "startEventDateTime",
    {
      Cell: ({ original: collectingEvent }) => (
        <div className="d-flex">
          <Link
            href={`/collection/collecting-event/view?id=${collectingEvent.id}`}
          >
            <a className="flex-grow-1 my-auto">
              <DinaMessage id="viewDetails" />
            </a>
          </Link>
          <FormikButton
            className="flex-grow-1 btn btn-link collecting-event-link-button"
            buttonProps={() => ({ style: { textDecorationLine: "underline" } })}
            onClick={(_, formik) =>
              onCollectingEventSelect(collectingEvent, formik)
            }
          >
            <DinaMessage id="select" />
          </FormikButton>
        </div>
      ),
      Header: "",
      sortable: false
    }
  ];

  const [filterParam, setFilterParam] = useState<FilterParam>();

  function onFilterSubmit(values) {
    const rsqlFilters: string[] = [];

    if (values && values.group) {
      rsqlFilters.push(`group==${values.group}`);
    }

    const filterBuilderRsql = rsql(values.filterBuilderModel);
    if (filterBuilderRsql) {
      rsqlFilters.push(filterBuilderRsql);
    }

    const filters: FilterParam = {
      rsql: rsqlFilters.join(" and ")
    };

    setFilterParam(filters);
  }

  return (
    <div>
      <div className="mb-3">
        <FilterForm
          filterAttributes={["createdBy", "dwcFieldNumber", "dwcRecordNumber"]}
          id="collectingEventFilterForm"
          onFilterFormSubmit={onFilterSubmit}
        >
          {() => (
            <div className="mb-3">
              <div style={{ width: "300px" }}>
                <GroupSelectField name="group" showAnyOption={true} />
              </div>
            </div>
          )}
        </FilterForm>
      </div>
      <div className="mb-3" style={{ maxHeight: "50rem", overflowY: "scroll" }}>
        <QueryTable
          path="collection-api/collecting-event"
          columns={COLLECTING_EVENT_TABLE_COLUMNS}
          filter={filterParam}
        />
      </div>
    </div>
  );
}
