import {
  ColumnDefinition,
  DinaForm,
  DinaFormSubmitParams,
  FieldSet,
  FormikButton,
  QueryTable,
  stringArrayCell,
  TextField
} from "common-ui";
import { FormikContextType, FormikProps } from "formik";
import { FilterParam } from "kitsu";
import Link from "next/link";
import { useRef, useState } from "react";
import { DinaMessage } from "../../../intl/dina-ui-intl";
import { CollectingEvent } from "../../../types/collection-api";
import { Person } from "../../../types/objectstore-api";

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
  const filterFormRef = useRef<FormikProps<any>>(null);

  const COLLECTING_EVENT_TABLE_COLUMNS: ColumnDefinition<CollectingEvent>[] = [
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

  function setFilters({
    submittedValues: { createdBy, location, date }
  }: DinaFormSubmitParams<CollectingEventFilterFormValues>) {
    // Build the RSQL filter string:
    const rsqlFilters: string[] = [];
    if (createdBy) {
      rsqlFilters.push(`createdBy==*${createdBy}*`);
    }
    if (location) {
      rsqlFilters.push(`(dwcVerbatimLocality==*${location}*)`);
    }
    if (date?.min) {
      rsqlFilters.push(`startEventDateTime=ge=${date.min}`);
    }
    if (date?.max) {
      rsqlFilters.push(`startEventDateTime=le=${date.max}`);
    }
    setFilterParam({
      rsql: rsqlFilters.join(" and ")
    });
  }

  /** Pressing enter on the search inputs should submit the filter form, not the outer Catalogued Object form. */
  function onKeyDown(e) {
    if (e.keyCode === 13) {
      e.preventDefault();
      filterFormRef.current?.submitForm();
    }
  }

  return (
    <div>
      <div className="mb-3">
        <DinaForm<CollectingEventFilterFormValues>
          initialValues={{}}
          onSubmit={setFilters}
          innerRef={filterFormRef}
        >
          <FieldSet legend={<DinaMessage id="search" />} className="non-strip">
            <div className="row">
              {/* Filter by agent? Un-comment when the back-end can allow this. */}
              {/* <PersonSelectField
              className="col-md-4"
              name="agent"
            /> */}
              <TextField
                name="createdBy"
                className="col-md-3"
                inputProps={{
                  onKeyDown,
                  className: "col-md-3 search-input"
                }}
              />
              <TextField
                name="location"
                className="col-md-3"
                inputProps={{
                  onKeyDown,
                  className: "col-md-3 search-input"
                }}
              />
              {/* Commented out due to filtering issue (https://redmine.biodiversity.agr.gc.ca/issues/22300) */}
              {/* <DateField
                name="date.min"
                className="col-md-3"
                onKeyDown={nestedFormInputProps.onKeyDown}
              />
              <DateField
                name="date.max"
                className="col-md-3"
                onKeyDown={nestedFormInputProps.onKeyDown}
              /> */}
              <div className="col-md-3">
                <FormikButton
                  className="btn btn-primary mb-3"
                  buttonProps={() => ({
                    style: { width: "10rem", marginTop: "2rem" }
                  })}
                  onClick={() => filterFormRef.current?.submitForm()}
                >
                  <DinaMessage id="search" />
                </FormikButton>
              </div>
            </div>
          </FieldSet>
        </DinaForm>
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
