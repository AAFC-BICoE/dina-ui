import { Form, Formik, FormikActions } from "formik";
import { useState } from "react";
import {
  ColumnDefinition,
  FilterBuilderField,
  LoadingSpinner,
  QueryTable
} from "../..";
import { Sample, StepResource } from "../../../types/seqdb-api";
import { rsql } from "../../filter-builder/rsql";
import { useGroupedCheckBoxes } from "../../formik-connected/GroupedCheckBoxFields";
import { StepRendererProps } from "../StepRenderer";
import { PreLibraryPrepForm } from "./PreLibraryPrepForm";
import { usePreLibraryPrepControls } from "./usePreLibraryPrepControls";

export function PreLibraryPrepStep(props: StepRendererProps) {
  const { chain, chainStepTemplates, step } = props;

  const {
    deleteStepResources,
    plpFormSubmit,
    plpSrLoading,
    setVisibleSamples
  } = usePreLibraryPrepControls(props);

  const previousStep = chainStepTemplates[chainStepTemplates.indexOf(step) - 1];

  const [rsqlFilter, setRsqlFilter] = useState<string>("");

  const { CheckBoxField, setAvailableItems } = useGroupedCheckBoxes<Sample>({
    fieldName: "checkedIds"
  });

  function onFilterSubmit(values, { setSubmitting }: FormikActions<any>) {
    setRsqlFilter(rsql(values.filter));
    setSubmitting(false);
  }

  const SAMPLE_STEP_RESOURCE_COLUMNS: Array<ColumnDefinition<StepResource>> = [
    {
      Header: "Group",
      accessor: "sample.group.groupName"
    },
    "sample.name",
    "sample.version",
    {
      Cell: ({ original }) => {
        if (plpSrLoading || !original.sample) {
          return "Loading...";
        }

        const { shearingPrep } = original;

        if (shearingPrep) {
          return (
            <div style={{ backgroundColor: "rgb(222, 252, 222)" }}>Sheared</div>
          );
        }
        return <div>Not Sheared</div>;
      },
      Header: "Shearing",
      sortable: false
    },
    {
      Cell: ({ original }) => {
        if (plpSrLoading || !original.sample) {
          return "Loading...";
        }

        const { sizeSelectionPrep } = original;

        if (sizeSelectionPrep) {
          return (
            <div style={{ backgroundColor: "rgb(222, 252, 222)" }}>
              Size Selection Added
            </div>
          );
        }
        return <div>No Size Selection</div>;
      },
      Header: "Size Selection",
      sortable: false
    },
    {
      Cell: ({ original: sr }) => (
        <div style={{ textAlign: "center" }} key={sr.id}>
          <div className="d-block">
            <CheckBoxField resource={sr.sample} />
          </div>
        </div>
      ),
      Header: "Select",
      sortable: false
    }
  ];

  return (
    <>
      <h2>Shearing/Size Selection</h2>
      <strong>Filter samples:</strong>
      <Formik initialValues={{ filter: null }} onSubmit={onFilterSubmit}>
        <Form className="form-group">
          <FilterBuilderField
            filterAttributes={["sample.name"]}
            name="filter"
          />
          <button className="btn btn-primary" type="submit">
            Search
          </button>
        </Form>
      </Formik>
      <Formik
        initialValues={{ checkedIds: {}, preLibraryPrepType: "SHEARING" }}
        onSubmit={plpFormSubmit}
      >
        {formikProps => (
          <Form className="pre-library-prep-form">
            <div className="row form-group">
              <div className="col-6 selected-samples">
                <strong>Selected Samples</strong>
                <div className="float-right">
                  {formikProps.isSubmitting ? (
                    <LoadingSpinner loading={true} />
                  ) : (
                    <>
                      <button
                        className="btn btn-dark remove-shearing"
                        onClick={() =>
                          deleteStepResources("SHEARING", formikProps)
                        }
                        type="button"
                      >
                        Remove selected Shearing details
                      </button>
                      <button
                        className="btn btn-dark remove-size-selection"
                        onClick={() =>
                          deleteStepResources("SIZE_SELECTION", formikProps)
                        }
                        type="button"
                      >
                        Remove selected Size Selection details
                      </button>
                    </>
                  )}
                </div>
                <QueryTable
                  columns={SAMPLE_STEP_RESOURCE_COLUMNS}
                  defaultPageSize={100}
                  filter={{
                    "chain.chainId": chain.id,
                    "chainStepTemplate.chainStepTemplateId": previousStep.id,
                    rsql: rsqlFilter
                  }}
                  include="sample,sample.group"
                  onSuccess={res => {
                    setVisibleSamples(res.data);
                    setAvailableItems(res.data.map(sr => sr.sample));
                  }}
                  path="stepResource"
                />
              </div>
              <div className="col-6">
                <strong>Add New Shearing/Size Selection Details</strong>
                {/* Spacer div to align the table with the form. */}
                <div style={{ height: "22px" }} />
                <PreLibraryPrepForm />
              </div>
            </div>
          </Form>
        )}
      </Formik>
    </>
  );
}
