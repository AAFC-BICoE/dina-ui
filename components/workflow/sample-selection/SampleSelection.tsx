import { connect, Formik } from "formik";
import { FilterParam } from "kitsu";
import { useState } from "react";
import {
  ColumnDefinition,
  FilterForm,
  LoadingSpinner,
  QueryTable,
  ResourceSelectField
} from "../..";
import { Group, StepResource } from "../../../types/seqdb-api";
import { filterBy } from "../../../util/rsql";
import { rsql } from "../../filter-builder/rsql";
import { useGroupedCheckBoxes } from "../../formik-connected/GroupedCheckBoxFields";
import { StepRendererProps } from "../StepRenderer";
import { useSelectionControls } from "./useSelectionControls";

export function SampleSelection(props: StepRendererProps) {
  const { chain, step } = props;

  const [filter, setFilter] = useState<FilterParam>();

  const {
    deleteAllCheckedStepResources,
    loading,
    randomNumber,
    deleteStepResources,
    selectAllCheckedSamples,
    selectSamples
  } = useSelectionControls(props);

  const {
    CheckBoxHeader: SampleSelectCheckBoxHeader,
    CheckBoxField: SampleSelectCheckBox,
    setAvailableItems: setAvailableSamples
  } = useGroupedCheckBoxes({
    fieldName: "sampleIdsToSelect"
  });

  const {
    CheckBoxHeader: SampleDeselectCheckBoxHeader,
    CheckBoxField: SampleDeselectCheckBox,
    setAvailableItems: setStepResources
  } = useGroupedCheckBoxes({
    fieldName: "stepResourceIdsToDelete"
  });

  const SAMPLE_FILTER_ATTRIBUTES = [
    "name",
    {
      allowRange: true,
      label: "Specimen Number List/Range",
      name: "specimenReplicate.specimen.number"
    }
  ];

  const SELECTABLE_SAMPLE_COLUMNS: Array<ColumnDefinition<any>> = [
    {
      Header: "Group",
      accessor: "group.groupName"
    },
    "name",
    "version",
    {
      Cell: connect(({ formik, original: sample }) => (
        <div className="row" key={sample.id}>
          <button
            className="btn btn-primary btn-sm col-6 single-select-button"
            onClick={() => {
              selectSamples([sample]);
              formik.setFieldValue(
                `sampleIdsToSelect[${sample.id}]`,
                undefined
              );
            }}
          >
            Select
          </button>
          <div className="col-6">
            <SampleSelectCheckBox resource={sample} />
          </div>
        </div>
      )),
      Header: SampleSelectCheckBoxHeader,
      sortable: false
    }
  ];

  const SELECTED_SAMPLE_COLUMNS: Array<ColumnDefinition<any>> = [
    {
      Header: "Group Name",
      accessor: "sample.group.groupName"
    },
    {
      Header: "Name",
      accessor: "sample.name"
    },
    {
      Header: "Version",
      accessor: "sample.version"
    },
    {
      Cell: connect(({ formik, original: sr }) => (
        <div className="row" key={sr.id}>
          <button
            className="btn btn-dark btn-sm col-6 single-deselect-button"
            onClick={() => {
              deleteStepResources([sr]);
              formik.setFieldValue(
                `stepResourceIdsToDelete[${sr.id}]`,
                undefined
              );
            }}
          >
            Deselect
          </button>
          <div className="col-6">
            <SampleDeselectCheckBox resource={sr} />
          </div>
        </div>
      )),
      Header: SampleDeselectCheckBoxHeader,
      sortable: false
    }
  ];

  function onFilterSubmit(values) {
    const rsqlFilters = [];

    const filterBuilderRsql = rsql(values.filterBuilderModel);
    if (filterBuilderRsql) {
      rsqlFilters.push(filterBuilderRsql);
    }

    if (values.groups && values.groups.length) {
      const groupIds = values.groups.map(g => g.id).join(",");
      rsqlFilters.push(`group.groupId=in=(${groupIds})`);
    }

    const filterParam: FilterParam = {
      rsql: rsqlFilters.join(" and ")
    };

    setFilter(filterParam);
  }

  return (
    <>
      <h2>Sample Selection</h2>
      <FilterForm
        filterAttributes={SAMPLE_FILTER_ATTRIBUTES}
        id="sample-selection"
        onFilterFormSubmit={onFilterSubmit}
      >
        {({ submitForm }) => (
          <div className="form-group">
            <div style={{ width: "300px" }}>
              <ResourceSelectField<Group>
                filter={filterBy(["groupName"])}
                isMulti={true}
                label="Filter by group"
                name="groups"
                model="group"
                onChange={() => setImmediate(submitForm)}
                optionLabel={group => group.groupName}
              />
            </div>
          </div>
        )}
      </FilterForm>
      <div className="row form-group">
        <Formik
          initialValues={{ sampleIdsToSelect: {}, stepResourcesToDelete: {} }}
          onSubmit={null}
        >
          {formikProps => (
            <>
              <div className="col-5 available-samples">
                <strong>Available Samples</strong>
                <QueryTable
                  columns={SELECTABLE_SAMPLE_COLUMNS}
                  defaultPageSize={100}
                  filter={filter}
                  include="group"
                  onSuccess={response => setAvailableSamples(response.data)}
                  path="sample"
                />
              </div>
              <div className="col-2" style={{ marginTop: "100px" }}>
                {loading ? (
                  <LoadingSpinner loading={loading} />
                ) : (
                  <div className="row">
                    <div className="col-6">
                      <button
                        className="btn btn-primary select-all-checked-button"
                        onClick={() => selectAllCheckedSamples(formikProps)}
                      >
                        Select all checked samples -->
                      </button>
                    </div>
                    <div className="col-6">
                      <button
                        className="btn btn-dark deselect-all-checked-button"
                        onClick={() =>
                          deleteAllCheckedStepResources(formikProps)
                        }
                      >
                        {"<--"} Deselect all checked samples
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <div className="col-5 selected-samples">
                <strong>Selected Samples</strong>
                <QueryTable<StepResource>
                  columns={SELECTED_SAMPLE_COLUMNS}
                  defaultPageSize={100}
                  filter={{
                    "chain.chainId": chain.id,
                    "chainStepTemplate.chainStepTemplateId": step.id,
                    rsql: `sample.name!=${randomNumber}`
                  }}
                  include="sample,sample.group"
                  onSuccess={res => setStepResources(res.data)}
                  path="stepResource"
                />
              </div>
            </>
          )}
        </Formik>
      </div>
    </>
  );
}
