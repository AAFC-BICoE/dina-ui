import { connect, Form, Formik, FormikActions } from "formik";
import { FilterParam } from "kitsu";
import { useState } from "react";
import {
  ColumnDefinition,
  FilterBuilderField,
  LoadingSpinner,
  QueryTable
} from "..";
import { rsql } from "../../components/filter-builder/rsql";
import { useGroupedCheckBoxes } from "../../components/formik-connected/CheckBoxField";
import { StepRendererProps } from "../workflow/StepRenderer";
import { useSelectionControls } from "./useSelectionControls";

export function SampleSelection({
  chain,
  chainStepTemplates,
  step
}: StepRendererProps) {
  const [filter, setFilter] = useState<FilterParam>();

  const {
    loading,
    randomNumber,
    removeSample,
    selectAllCheckedSamples,
    selectSamples
  } = useSelectionControls({ chain, chainStepTemplates, step });

  const { CheckBoxField, setAvailableItems } = useGroupedCheckBoxes();

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
      Cell: ({ original }) => (
        <button className="btn btn-dark" onClick={() => removeSample(original)}>
          Remove
        </button>
      )
    }
  ];

  const SELECTABLE_SAMPLE_COLUMNS: Array<ColumnDefinition<any>> = [
    {
      Header: "Group Name",
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
            -->
          </button>
          <div className="col-6">
            <CheckBoxField resource={sample} />
          </div>
        </div>
      ),
      sortable: false
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
          <FilterBuilderField filterAttributes={["name"]} name="filter" />
          <button className="btn btn-primary" type="submit">
            Search
          </button>
        </Form>
      </Formik>
      <div className="row form-group">
        <Formik initialValues={{ checkedIds: {} }} onSubmit={null}>
          {formikProps => (
            <>
              <div className="col-5">
                <strong>Available Samples</strong>
                <QueryTable
                  columns={SELECTABLE_SAMPLE_COLUMNS}
                  filter={filter}
                  include="group"
                  onSuccess={response => setAvailableItems(response.data)}
                  path="sample"
                />
              </div>
              <div className="col-2" style={{ marginTop: "100px" }}>
                {loading ? (
                  <LoadingSpinner loading={loading} />
                ) : (
                  <button
                    className="btn btn-primary"
                    onClick={() => selectAllCheckedSamples(formikProps)}
                  >
                    Select all checked samples -->
                  </button>
                )}
              </div>
            </>
          )}
        </Formik>
        <div className="col-5">
          <strong>Selected Samples</strong>
          <QueryTable
            columns={SELECTED_SAMPLE_COLUMNS}
            filter={{
              "chain.chainId": chain.id,
              "chainStepTemplate.chainStepTemplateId": step.id,
              rsql: `sample.name!=${randomNumber}`
            }}
            include="sample,sample.group"
            path="stepResource"
          />
        </div>
      </div>
    </>
  );
}
