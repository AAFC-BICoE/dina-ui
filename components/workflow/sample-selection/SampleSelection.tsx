import { Form, Formik, FormikActions } from "formik";
import { FilterParam } from "kitsu";
import { useState } from "react";
import {
  ColumnDefinition,
  FilterBuilderField,
  LoadingSpinner,
  QueryTable
} from "../..";
import { StepResource } from "../../../types/seqdb-api";
import { rsql } from "../../filter-builder/rsql";
import { useGroupedCheckBoxes } from "../../formik-connected/GroupedCheckBoxFields";
import { StepRendererProps } from "../StepRenderer";
import { useSelectionControls } from "./useSelectionControls";

export function SampleSelection({
  chain,
  chainStepTemplates,
  step
}: StepRendererProps) {
  const [filter, setFilter] = useState<FilterParam>();

  const {
    deleteAllCheckedStepResources,
    loading,
    randomNumber,
    deleteStepResources,
    selectAllCheckedSamples,
    selectSamples
  } = useSelectionControls({ chain, chainStepTemplates, step });

  const {
    CheckBoxField: SampleSelectCheckBox,
    setAvailableItems: setAvailableSamples
  } = useGroupedCheckBoxes({
    fieldName: "sampleIdsToSelect"
  });

  const {
    CheckBoxField: SampleDeselectCheckBox,
    setAvailableItems: setStepResources
  } = useGroupedCheckBoxes({
    fieldName: "stepResourceIdsToDelete"
  });

  const SELECTABLE_SAMPLE_COLUMNS: Array<ColumnDefinition<any>> = [
    {
      Header: "Group",
      accessor: "group.groupName"
    },
    "name",
    "version",
    {
      Cell: ({ original: sample }) => (
        <div className="row" key={sample.id}>
          <button
            className="btn btn-primary btn-sm col-6"
            onClick={() => selectSamples([sample])}
          >
            Select
          </button>
          <div className="col-6">
            <SampleSelectCheckBox resource={sample} />
          </div>
        </div>
      ),
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
      Cell: ({ original: sr }) => (
        <div className="row" key={sr.id}>
          <button
            className="btn btn-dark btn-sm col-6"
            onClick={() => deleteStepResources([sr])}
          >
            Remove
          </button>
          <div className="col-6">
            <SampleDeselectCheckBox resource={sr} />
          </div>
        </div>
      )
    }
  ];

  function onFilterSubmit(values, { setSubmitting }: FormikActions<any>) {
    setFilter({ rsql: rsql(values.filter) });
    setSubmitting(false);
  }

  return (
    <>
      <h2>Sample Selection</h2>
      <strong>Filter available samples:</strong>
      <Formik initialValues={{ filter: null }} onSubmit={onFilterSubmit}>
        <Form className="form-group">
          <FilterBuilderField
            filterAttributes={[
              "name",
              {
                allowRange: true,
                label: "Specimen Number List/Range",
                name: "specimenReplicate.specimen.number"
              }
            ]}
            name="filter"
          />
          <button className="btn btn-primary" type="submit">
            Search
          </button>
        </Form>
      </Formik>
      <div className="row form-group">
        <Formik
          initialValues={{ sampleIdsToSelect: {}, stepResourcesToDelete: {} }}
          onSubmit={null}
        >
          {formikProps => (
            <>
              <div className="col-5">
                <strong>Available Samples</strong>
                <QueryTable
                  columns={SELECTABLE_SAMPLE_COLUMNS}
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
                        className="btn btn-primary"
                        onClick={() => selectAllCheckedSamples(formikProps)}
                      >
                        Select all checked samples -->
                      </button>
                    </div>
                    <div className="col-6">
                      <button
                        className="btn btn-dark"
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
              <div className="col-5">
                <strong>Selected Samples</strong>
                <QueryTable<StepResource>
                  columns={SELECTED_SAMPLE_COLUMNS}
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
