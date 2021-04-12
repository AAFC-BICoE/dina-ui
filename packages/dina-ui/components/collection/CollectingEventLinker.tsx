import {
  ColumnDefinition,
  DinaForm,
  DinaFormSubmitParams,
  FormikButton,
  QueryTable,
  TextField
} from "common-ui";
import { FormikContextType, FormikProps } from "formik";
import { FilterParam } from "kitsu";
import Link from "next/link";
import { useRef, useState } from "react";
import { DinaMessage } from "../../intl/dina-ui-intl";
import { CollectingEvent } from "../../types/collection-api";
import { Person } from "../../types/objectstore-api";

export interface CollectingEventFilterFormValues {
  createdBy?: string;
  agent?: Person;
  location?: string;
  dateRange?: { low?: string; high?: string };
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
    "createdBy",
    {
      Cell: ({ original: { dwcVerbatimLocality, geographicPlaceName } }) => (
        <>{dwcVerbatimLocality || geographicPlaceName}</>
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
            <a target="_blank" className="flex-grow-1 my-auto">
              <DinaMessage id="viewDetails" />
            </a>
          </Link>
          <FormikButton
            className="flex-grow-1 btn btn-link"
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
    submittedValues: { createdBy, location }
  }: DinaFormSubmitParams<CollectingEventFilterFormValues>) {
    // Build the RSQL filter string:
    const rsqlFilters: string[] = [];
    if (createdBy) {
      rsqlFilters.push(`createdBy==*${createdBy}*`);
    }
    if (location) {
      rsqlFilters.push(
        `dwcVerbatimLocality==*${location}* or geographicPlaceName==*${location}*`
      );
    }
    setFilterParam({
      rsql: rsqlFilters.join(" and ")
    });
  }

  /** Pressing enter on the search inputs should submit the filter form, not the outer Catalogued Object form. */
  const nestedFormInputProps = {
    onKeyDown(e) {
      if (e.keyCode === 13) {
        e.preventDefault();
        filterFormRef.current?.submitForm();
      }
    }
  };

  return (
    <div>
      <div className="form-group">
        <DinaForm<CollectingEventFilterFormValues>
          initialValues={{}}
          onSubmit={setFilters}
          horizontal={[4, 8]}
          innerRef={filterFormRef}
        >
          <div className="row">
            {/* Filter by agent? Un-comment when the back-end can allow this. */}
            {/* <ResourceSelectField<Person>
              className="col-md-4"
              name="agent"
              filter={filterBy(["displayName"])}
              model="agent-api/person"
              optionLabel={person => person.displayName}
            /> */}
            <TextField
              name="createdBy"
              className="col-md-4"
              inputProps={nestedFormInputProps}
            />
            <TextField
              name="location"
              className="col-md-4"
              inputProps={nestedFormInputProps}
            />
            <FormikButton onClick={() => filterFormRef.current?.submitForm()}>
              <DinaMessage id="search" />
            </FormikButton>
          </div>
        </DinaForm>
      </div>
      <div
        className="form-group"
        style={{ maxHeight: "50rem", overflowY: "scroll" }}
      >
        <QueryTable
          path="collection-api/collecting-event"
          columns={COLLECTING_EVENT_TABLE_COLUMNS}
          filter={filterParam}
        />
      </div>
    </div>
  );
}
