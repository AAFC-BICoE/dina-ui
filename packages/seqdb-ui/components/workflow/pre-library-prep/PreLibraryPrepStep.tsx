import {
  ColumnDefinition,
  LoadingSpinner,
  QueryTable,
  useGroupedCheckBoxes
} from "common-ui";
import { Formik } from "formik";
import { noop } from "lodash";
import { useState } from "react";
import titleCase from "title-case";
import { Sample, StepResource } from "../../../types/seqdb-api";
import { rsql } from "../../filter-builder/rsql";
import { FilterForm } from "../../list-page-layout/FilterForm";
import { StepRendererProps } from "../StepRenderer";
import {
  PreLibPrepViewMode,
  PreLibPrepViewModeSelector
} from "./PreLibPrepViewModeSelector";
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

  const [viewMode, setViewMode] = useState<PreLibPrepViewMode>("EDIT");

  const [rsqlFilter, setRsqlFilter] = useState<string>("");

  const {
    CheckBoxHeader,
    CheckBoxField,
    setAvailableItems
  } = useGroupedCheckBoxes<Sample>({
    fieldName: "checkedIds"
  });

  function onFilterSubmit(values) {
    setRsqlFilter(rsql(values.filterBuilderModel));
  }

  const BRIEF_PLP_DETAILS_COLUMNS: Array<ColumnDefinition<StepResource>> = [
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
    }
  ];

  const SAMPLE_STEP_RESOURCE_COLUMNS: Array<ColumnDefinition<StepResource>> = [
    {
      Header: "Group",
      accessor: "sample.group.groupName"
    },
    "sample.name",
    "sample.version",
    ...(viewMode === "EDIT"
      ? BRIEF_PLP_DETAILS_COLUMNS
      : plpDetailsColumns(viewMode)),
    {
      Cell: ({ original: sr }) => (
        <div style={{ textAlign: "center" }} key={sr.id}>
          <div className="d-block">
            <CheckBoxField resource={sr.sample} />
          </div>
        </div>
      ),
      Header: CheckBoxHeader,
      sortable: false
    }
  ];

  return (
    <>
      <h2>Shearing/Size Selection</h2>
      <FilterForm
        filterAttributes={["sample.name"]}
        id="pre-library-prep-step"
        onFilterFormSubmit={onFilterSubmit}
      />
      <Formik initialValues={{ checkedIds: {} }} onSubmit={noop}>
        {formikProps => {
          async function onInnerFormSubmit(plpValues) {
            await plpFormSubmit(
              { ...formikProps.values, ...plpValues },
              formikProps
            );
          }

          return (
            <>
              <PreLibPrepViewModeSelector
                onChange={setViewMode}
                viewMode={viewMode}
              />
              <div className="row form-group">
                <div
                  className={`col-${
                    viewMode === "EDIT" ? 6 : 12
                  } selected-samples`}
                >
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
                    loading={formikProps.isSubmitting}
                    onSuccess={res => {
                      setVisibleSamples(res.data);
                      setAvailableItems(
                        res.data.map(sr => sr.sample as Sample)
                      );
                    }}
                    path="stepResource"
                  />
                </div>
                {viewMode === "EDIT" && (
                  <div className="col-6">
                    <strong>Add New Shearing/Size Selection Details</strong>
                    {/* Spacer div to align the table with the form. */}
                    <div style={{ height: "22px" }} />
                    <PreLibraryPrepForm onSubmit={onInnerFormSubmit} />
                  </div>
                )}
              </div>
            </>
          );
        }}
      </Formik>
    </>
  );
}

function plpDetailsColumns(mode: PreLibPrepViewMode) {
  const prefix =
    mode === "SHEARING_DETAILS" ? "shearingPrep" : "sizeSelectionPrep";

  return [
    "inputAmount",
    "concentration",
    "targetDpSize",
    "averageFragmentSize",
    "quality",
    "protocol.name",
    "product.name",
    "notes"
  ].map(attr => ({
    Header: titleCase(attr),
    accessor: `${prefix}.${attr}`,
    sortable: false
  }));
}
