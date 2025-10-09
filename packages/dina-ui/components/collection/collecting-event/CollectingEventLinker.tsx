import {
  ColumnDefinition,
  FilterForm,
  FormikButton,
  QueryTable,
  stringArrayCell
} from "common-ui";
import { FormikContextType } from "formik";
import Link from "next/link";
import { useState } from "react";
import { DinaMessage } from "../../../intl/dina-ui-intl";
import { CollectingEvent } from "../../../types/collection-api";
import { Person } from "../../../types/objectstore-api";
import { GroupSelectField } from "../../group-select/GroupSelectField";
import { fiql } from "../../../../common-ui/lib/filter-builder/fiql";

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
    {
      id: "viewDetails",
      cell: ({ row: { original: collectingEvent } }) => (
        <div className="d-flex">
          <Link
            href={`/collection/collecting-event/view?id=${collectingEvent.id}`}
            className="flex-grow-1 my-auto"
          >
            <DinaMessage id="viewDetails" />
          </Link>
        </div>
      ),
      header: () => <DinaMessage id="viewDetails" />,
      enableSorting: false
    },
    "dwcFieldNumber",
    stringArrayCell("otherRecordNumbers"),
    "createdBy",
    {
      id: "locationLabel",
      cell: ({
        row: {
          original: { dwcVerbatimLocality }
        }
      }) => <>{dwcVerbatimLocality}</>,
      header: () => <DinaMessage id="locationLabel" />,
      enableSorting: false
    },
    "startEventDateTime",
    {
      id: "action",
      enableSorting: false,
      cell: ({ row: { original: collectingEvent } }) => (
        <div className="d-flex">
          <FormikButton
            className="flex-grow-1 btn btn-primary collecting-event-link-button"
            onClick={(_, formik) =>
              onCollectingEventSelect(collectingEvent, formik)
            }
          >
            <DinaMessage id="select" />
          </FormikButton>
        </div>
      ),
      header: () => <DinaMessage id="select" />
    }
  ];

  const [filterParam, setFilterParam] = useState<string>();

  function onFilterSubmit(values) {
    const fiqlFilters: string[] = [];

    if (values && values.group) {
      fiqlFilters.push(`group==${values.group}`);
    }

    const filterBuilderFiql = fiql(values.filterBuilderModel);
    if (filterBuilderFiql) {
      fiqlFilters.push(filterBuilderFiql);
    }

    if (fiqlFilters.length === 0) {
      setFilterParam(undefined);
      return;
    }

    setFilterParam(fiqlFilters.join(";"));
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
          fiql={filterParam}
        />
      </div>
    </div>
  );
}
