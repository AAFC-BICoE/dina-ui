import {
  ColumnDefinition,
  DinaForm,
  FilterForm,
  FormikButton,
  QueryTable,
  rsql,
  useGroupedCheckBoxes
} from "common-ui";
import { FilterParam } from "kitsu";
import { noop } from "lodash";
import { useState } from "react";
import { SeqdbMessage } from "../../../../intl/seqdb-intl";
import { StepResource } from "../../../../types/seqdb-api";
import { StepRendererProps } from "../StepRenderer";
import { useSelectionControls } from "./useSelectionControls";

export function SampleSelection(props: StepRendererProps) {
  const { chain, step } = props;

  const [filter, setFilter] = useState<FilterParam>();

  const {
    deleteAllCheckedStepResources,
    lastSave,
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

  const SAMPLE_FILTER_ATTRIBUTES = ["name"];

  const SELECTABLE_SAMPLE_COLUMNS: ColumnDefinition<any>[] = [
    "name",
    "version",
    {
      Cell: ({ original: molecularSample }) => (
        <div className="row" key={molecularSample.id}>
          <FormikButton
            className="btn btn-primary btn-sm col-6 single-select-button"
            onClick={async (_, formik) => {
              await selectSamples([molecularSample]);
              formik.setFieldValue(
                `sampleIdsToSelect[${molecularSample.id}]`,
                undefined
              );
            }}
          >
            <SeqdbMessage id="selectButtonText" />
          </FormikButton>
          <div className="col-6">
            <SampleSelectCheckBox resource={molecularSample} />
          </div>
        </div>
      ),
      Header: SampleSelectCheckBoxHeader,
      sortable: false
    }
  ];

  const SELECTED_SAMPLE_COLUMNS: ColumnDefinition<any>[] = [
    {
      Header: "Name",
      accessor: "molecularSample.name"
    },
    {
      Header: "Version",
      accessor: "molecularSample.version"
    },
    {
      Cell: ({ original: sr }) => (
        <div className="row" key={sr.id}>
          <FormikButton
            className="btn btn-dark btn-sm col-6 single-deselect-button"
            onClick={async (_, formik) => {
              await deleteStepResources([sr]);
              formik.setFieldValue(
                `stepResourceIdsToDelete[${sr.id}]`,
                undefined
              );
            }}
          >
            <SeqdbMessage id="deselectButtonText" />
          </FormikButton>
          <div className="col-6">
            <SampleDeselectCheckBox resource={sr} />
          </div>
        </div>
      ),
      Header: SampleDeselectCheckBoxHeader,
      sortable: false
    }
  ];

  function onFilterSubmit(values) {
    const rsqlFilters: string[] = [];

    const filterBuilderRsql = rsql(values.filterBuilderModel);
    if (filterBuilderRsql) {
      rsqlFilters.push(filterBuilderRsql);
    }

    const filterParam: FilterParam = {
      rsql: rsqlFilters.join(" and ")
    };

    setFilter(filterParam);
  }

  return (
    <>
      <h2>
        <SeqdbMessage id="sampleSelectionTitle" />
      </h2>
      <FilterForm
        filterAttributes={SAMPLE_FILTER_ATTRIBUTES}
        id="sample-selection"
        onFilterFormSubmit={onFilterSubmit}
      />
      <div className="mb-3">
        <DinaForm
          initialValues={{ sampleIdsToSelect: {}, stepResourcesToDelete: {} }}
        >
          <div className="row">
            <div className="col-5 available-samples">
              <strong>
                <SeqdbMessage id="availableSamplesTitle" />
              </strong>
              <QueryTable
                columns={SELECTABLE_SAMPLE_COLUMNS}
                defaultPageSize={100}
                filter={filter}
                onSuccess={response => setAvailableSamples(response.data)}
                path="seqdb-api/molecularSample"
              />
            </div>
            <div className="col-2" style={{ marginTop: "100px" }}>
              <div className="row">
                <div className="col-6">
                  <FormikButton
                    className="btn btn-primary select-all-checked-button"
                    onClick={selectAllCheckedSamples}
                  >
                    <SeqdbMessage id="selectAllCheckedSamplesButtonText" />
                  </FormikButton>
                </div>
                <div className="col-6">
                  <FormikButton
                    className="btn btn-dark deselect-all-checked-button"
                    onClick={deleteAllCheckedStepResources}
                  >
                    <SeqdbMessage id="deselectAllCheckedSamplesButtonText" />
                  </FormikButton>
                </div>
              </div>
            </div>
            <div className="col-5 selected-samples">
              <strong>
                <SeqdbMessage id="selectedSamplesTitle" />
              </strong>
              <QueryTable<StepResource>
                columns={SELECTED_SAMPLE_COLUMNS}
                defaultPageSize={100}
                deps={[lastSave]}
                filter={{
                  "chain.uuid": chain.id,
                  "chainStepTemplate.uuid": step.id
                }}
                include="molecularSample"
                onSuccess={res => setStepResources(res.data)}
                path="seqdb-api/stepResource"
              />
            </div>
          </div>
        </DinaForm>
      </div>
    </>
  );
}
