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
import { SeqdbMessage, useSeqdbIntl } from "../../../intl/seqdb-intl";
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

  const { formatMessage } = useSeqdbIntl();

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
          return <SeqdbMessage id="loadingText" />;
        }

        const { shearingPrep } = original;

        if (shearingPrep) {
          return (
            <div style={{ backgroundColor: "rgb(222, 252, 222)" }}>
              <SeqdbMessage id="shearedStatus" />
            </div>
          );
        }
        return (
          <div>
            <SeqdbMessage id="notShearedStatus" />
          </div>
        );
      },
      Header: formatMessage("shearingLabel"),
      sortable: false
    },
    {
      Cell: ({ original }) => {
        if (plpSrLoading || !original.sample) {
          return <SeqdbMessage id="loadingText" />;
        }

        const { sizeSelectionPrep } = original;

        if (sizeSelectionPrep) {
          return (
            <div style={{ backgroundColor: "rgb(222, 252, 222)" }}>
              <SeqdbMessage id="sizeSelectedStatus" />
            </div>
          );
        }
        return (
          <div>
            <SeqdbMessage id="notSizeSelectedStatus" />
          </div>
        );
      },
      Header: formatMessage("sizeSelectionLabel"),
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
      <h2>
        <SeqdbMessage id="plpStepTitle" />
      </h2>
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
                  <strong>
                    <SeqdbMessage id="selectedSamplesTitle" />
                  </strong>
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
                          <SeqdbMessage id="removeShearingDetailsButtonText" />
                        </button>
                        <button
                          className="btn btn-dark remove-size-selection"
                          onClick={() =>
                            deleteStepResources("SIZE_SELECTION", formikProps)
                          }
                          type="button"
                        >
                          <SeqdbMessage id="removeSizeSelectionDetailsButtonText" />
                        </button>
                      </>
                    )}
                  </div>
                  <QueryTable
                    columns={SAMPLE_STEP_RESOURCE_COLUMNS}
                    defaultPageSize={100}
                    filter={{
                      "chain.chainId": chain.id as string,
                      "chainStepTemplate.chainStepTemplateId": previousStep.id as string,
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
                    <strong>
                      <SeqdbMessage id="plpDetailsFormTitle" />
                    </strong>
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
