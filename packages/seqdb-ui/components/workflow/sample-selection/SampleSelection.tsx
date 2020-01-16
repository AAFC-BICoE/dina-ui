import {
  ColumnDefinition,
  ErrorViewer,
  filterBy,
  FilterForm,
  FormikButton,
  QueryTable,
  ResourceSelectField,
  rsql,
  useGroupedCheckBoxes
} from "common-ui";
import { Formik } from "formik";
import { FilterParam } from "kitsu";
import { noop } from "lodash";
import { useState } from "react";
import { SeqdbMessage } from "../../../intl/seqdb-intl";
import { Group, StepResource } from "../../../types/seqdb-api";
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

  const SAMPLE_FILTER_ATTRIBUTES = [
    "name",
    {
      allowRange: true,
      label: "Specimen Number List/Range",
      name: "specimenReplicate.specimen.number"
    }
  ];

  const SELECTABLE_SAMPLE_COLUMNS: Array<ColumnDefinition<any>> = [
    "group.groupName",
    "name",
    "version",
    {
      Cell: ({ original: sample }) => (
        <div className="row" key={sample.id}>
          <FormikButton
            className="btn btn-primary btn-sm col-6 single-select-button"
            onClick={async (_, formik) => {
              await selectSamples([sample]);
              formik.setFieldValue(
                `sampleIdsToSelect[${sample.id}]`,
                undefined
              );
            }}
          >
            <SeqdbMessage id="selectButtonText" />
          </FormikButton>
          <div className="col-6">
            <SampleSelectCheckBox resource={sample} />
          </div>
        </div>
      ),
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
      <h2>
        <SeqdbMessage id="sampleSelectionTitle" />
      </h2>
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
      <Formik
        initialValues={{ sampleIdsToSelect: {}, stepResourcesToDelete: {} }}
        onSubmit={noop}
      >
        <div className="form-group">
          <ErrorViewer />
          <div className="row">
            <div className="col-5 available-samples">
              <strong>
                <SeqdbMessage id="availableSamplesTitle" />
              </strong>
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
                  "chain.chainId": chain.id,
                  "chainStepTemplate.chainStepTemplateId": step.id
                }}
                include="sample,sample.group"
                onSuccess={res => setStepResources(res.data)}
                path="stepResource"
              />
            </div>
          </div>
        </div>
      </Formik>
    </>
  );
}
