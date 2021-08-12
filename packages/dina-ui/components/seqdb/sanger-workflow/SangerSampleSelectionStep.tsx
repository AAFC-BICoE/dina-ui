import {
  ColumnDefinition,
  DinaForm,
  filterBy,
  FormikButton,
  QueryTable,
  SubmitButton,
  useAccount,
  useApiClient,
  useGroupedCheckBoxes
} from "common-ui";
import { Field, FormikContextType } from "formik";
import { InputResource, KitsuResourceLink } from "kitsu";
import { pick, toPairs } from "lodash";
import Link from "next/link";
import { useState } from "react";
import { FiChevronsLeft, FiChevronsRight } from "react-icons/fi";
import { SeqdbMessage } from "../../../intl/seqdb-intl";
import { PcrBatch, PcrBatchItem } from "../../../types/seqdb-api";

export interface SangerSampleSelectionStepProps {
  pcrBatchId: string;
}

export function SangerSampleSelectionStep({
  pcrBatchId
}: SangerSampleSelectionStepProps) {
  const { apiClient, save } = useApiClient();
  const { username } = useAccount();

  const [searchValue, setSearchValue] = useState("");

  // Keep track of the last save operation, so the data is re-fetched immediately after saving.
  const [lastSave, setLastSave] = useState<number>();

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
    setAvailableItems: setRemoveableSamples
  } = useGroupedCheckBoxes({
    fieldName: "pcrBatchItemIdsToRemove"
  });

  const SELECTABLE_SAMPLE_COLUMNS: ColumnDefinition<any>[] = [
    {
      Cell: ({ original: { id, name } }) => (
        <Link href={`/seqdb/molecular-sample/view?id=${id}`}>{name}</Link>
      ),
      accessor: "name",
      sortable: false
    },
    {
      Cell: ({ original: molecularSample }) => (
        <div key={molecularSample.id}>
          <SampleSelectCheckBox resource={molecularSample} />
        </div>
      ),
      Header: SampleSelectCheckBoxHeader,
      sortable: false
    }
  ];

  const PCRBATCH_ITEM_COLUMNS: ColumnDefinition<any>[] = [
    {
      accessor: "id",
      sortable: false
    },
    {
      Cell: ({ original: pcrBatchItem }) => (
        <div key={pcrBatchItem.id}>
          <SampleDeselectCheckBox resource={pcrBatchItem} />
        </div>
      ),
      Header: SampleDeselectCheckBoxHeader,
      sortable: false
    }
  ];

  async function selectSamples(sampleLinks: KitsuResourceLink[]) {
    const { data: pcrBatch } = await apiClient.get<PcrBatch>(
      `seqdb-api/pcr-batch/${pcrBatchId}`,
      {}
    );

    const newPcrBatchItems = sampleLinks.map<InputResource<PcrBatchItem>>(
      sampleLink => ({
        sample: sampleLink,
        pcrBatch: pick(pcrBatch, "id", "type"),
        group: pcrBatch.group,
        createdBy: username,
        type: "pcr-batch-item"
      })
    );

    await save(
      newPcrBatchItems.map(item => ({
        resource: item,
        type: "pcr-batch-item"
      })),
      { apiBaseUrl: "/seqdb-api" }
    );

    setLastSave(Date.now());
  }

  async function selectAllCheckedSamples(
    formValues,
    formik: FormikContextType<any>
  ) {
    const { sampleIdsToSelect } = formValues;
    const ids = toPairs(sampleIdsToSelect)
      .filter(pair => pair[1])
      .map(pair => pair[0]);

    const samples = ids.map(id => ({
      id,
      type: "molecular-sample"
    }));

    await selectSamples(samples);

    formik.setFieldValue("sampleIdsToSelect", {});
  }

  return (
    <div>
      <h2>
        <SeqdbMessage id="sampleSelectionTitle" />
      </h2>
      <div className="alert alert-warning d-inline-block">
        <SeqdbMessage id="sampleSelectionInstructions" />
      </div>
      <div className="mb-3">
        <DinaForm
          initialValues={{ inputValue: "" }}
          onSubmit={({ submittedValues: { inputValue } }) =>
            setSearchValue(inputValue)
          }
        >
          <div className="input-group" style={{ width: "30rem" }}>
            <Field
              autoComplete="off"
              name="inputValue"
              className="form-control"
            />
            <SubmitButton className="btn btn-primary">
              <SeqdbMessage id="search" />
            </SubmitButton>
            <FormikButton
              className="btn btn-dark"
              onClick={(_, form) => {
                form.resetForm();
                form.submitForm();
              }}
            >
              <SeqdbMessage id="resetButtonText" />
            </FormikButton>
          </div>
        </DinaForm>
      </div>
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
                filter={
                  searchValue ? filterBy(["name"])(searchValue) : undefined
                }
                defaultSort={[
                  { id: "name", desc: false },
                  { id: "version", desc: false }
                ]}
                reactTableProps={{ sortable: false }}
                onSuccess={response => setAvailableSamples(response.data)}
                path="seqdb-api/molecular-sample"
              />
            </div>
            <div className="col-2" style={{ marginTop: "100px" }}>
              <div>
                <FormikButton
                  className="btn btn-primary w-100 mb-5 select-all-checked-button"
                  onClick={selectAllCheckedSamples}
                >
                  <FiChevronsRight />
                </FormikButton>
              </div>
              <div>
                <FormikButton
                  className="btn btn-dark w-100 mb-5 deselect-all-checked-button"
                  onClick={() => undefined} // deleteAllCheckedStepResources}
                >
                  <FiChevronsLeft />
                </FormikButton>
              </div>
            </div>
            <div className="col-5 available-samples">
              <strong>
                <SeqdbMessage id="selectedSamplesTitle" />
              </strong>
              <QueryTable
                columns={PCRBATCH_ITEM_COLUMNS}
                defaultPageSize={100}
                filter={filterBy([], {
                  extraFilters: [
                    {
                      selector: "pcrBatch.uuid",
                      comparison: "==",
                      arguments: pcrBatchId
                    }
                  ]
                })("")}
                defaultSort={[
                  { id: "sample.name", desc: false },
                  { id: "sample.version", desc: false }
                ]}
                reactTableProps={{ sortable: false }}
                onSuccess={response => setAvailableSamples(response.data)}
                path="seqdb-api/pcr-batch-item"
                deps={[lastSave]}
              />
            </div>
          </div>
        </DinaForm>
      </div>
    </div>
  );
}
