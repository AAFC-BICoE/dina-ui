import { connect, Form, Formik, FormikActions } from "formik";
import { FilterParam } from "kitsu";
import { useState } from "react";
import { ColumnDefinition, FilterBuilderField, QueryTable } from "..";
import { rsql } from "../../components/filter-builder/rsql";
import { CheckBoxField } from "../../components/formik-connected/CheckBoxField";
import { Chain, StepTemplate } from "../../types/seqdb-api";
import { useSelectionControls } from "./useSelectionControls";

interface SampleSelectionProps {
  chain: Chain;
  stepTemplate: StepTemplate;
}

export function SampleSelection({ chain, stepTemplate }: SampleSelectionProps) {
  const [filter, setFilter] = useState<FilterParam>();

  const {
    onCheckBoxClick,
    randomNumber,
    removeSample,
    selectAllCheckedSamples,
    selectSamples,
    setAvailableSamples
  } = useSelectionControls({ chain, stepTemplate });

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
      Cell: connect(({ formik, original: sample }) => (
        <div className="row" key={sample.id}>
          <button
            className="btn btn-primary btn-sm col-6"
            onClick={() => selectSamples([sample])}
          >
            -->
          </button>
          <div className="col-6">
            <CheckBoxField
              onClick={e => onCheckBoxClick(e, formik, sample)}
              name={`checkedIds[${sample.id}]`}
            />
          </div>
        </div>
      )),
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
                  onSuccess={response => setAvailableSamples(response.data)}
                  path="sample"
                />
              </div>
              <div className="col-2" style={{ marginTop: "100px" }}>
                <button
                  className="btn btn-primary"
                  onClick={() => selectAllCheckedSamples(formikProps)}
                >
                  -->
                </button>
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
              rsql: `sample.version!=${randomNumber}`,
              stepTemplateId: stepTemplate.id
            }}
            include="sample,sample.group"
            path="stepResource"
          />
        </div>
      </div>
    </>
  );
}
