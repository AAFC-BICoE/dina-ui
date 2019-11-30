import { ApiClientContext, HttpMethod } from "common-ui";
import { FormikActions } from "formik";
import { toPairs } from "lodash";
import { useContext, useState } from "react";
import {
  Chain,
  ChainStepTemplate,
  Sample,
  StepResource
} from "../../../types/seqdb-api";
import { StepRendererProps } from "../StepRenderer";

export function useSelectionControls({ chain, step }: StepRendererProps) {
  const { doOperations, save } = useContext(ApiClientContext);

  // Keep track of the last save operation, so the data is re-fetched immediately after saving.
  const [lastSave, setLastSave] = useState<number>();

  async function selectSamples(samples: Sample[]) {
    const newStepResources: StepResource[] = samples.map(sample => ({
      chain: { id: chain.id, type: chain.type } as Chain,
      chainStepTemplate: {
        id: step.id,
        type: "chainStepTemplate"
      } as ChainStepTemplate,
      sample,
      type: "stepResource",
      value: "SAMPLE"
    }));

    await save(
      newStepResources.map(sr => ({ resource: sr, type: "stepResource" }))
    );

    setLastSave(Date.now());
  }

  async function selectAllCheckedSamples(
    formValues,
    formik: FormikActions<any>
  ) {
    const { sampleIdsToSelect } = formValues;
    const ids = toPairs(sampleIdsToSelect)
      .filter(pair => pair[1])
      .map(pair => pair[0]);

    const samples = ids.map(id => ({
      id,
      type: "sample"
    })) as Sample[];

    await selectSamples(samples);

    formik.setFieldValue("sampleIdsToSelect", {});
  }

  async function deleteStepResources(stepResources: StepResource[]) {
    const operations = stepResources.map(sr => ({
      op: "DELETE" as HttpMethod,
      path: `stepResource/${sr.id}`,
      value: {
        id: sr.id as string,
        type: "stepResource"
      }
    }));

    await doOperations(operations);

    setLastSave(Date.now());
  }

  async function deleteAllCheckedStepResources(
    formValues,
    formik: FormikActions<any>
  ) {
    const { stepResourceIdsToDelete } = formValues;

    const ids = toPairs(stepResourceIdsToDelete)
      .filter(pair => pair[1])
      .map(pair => pair[0]);

    const stepResources = ids.map(id => ({
      id,
      type: "stepResource"
    })) as StepResource[];

    await deleteStepResources(stepResources);

    formik.setFieldValue("stepResourceIdsToDelete", {});
  }

  return {
    deleteAllCheckedStepResources,
    deleteStepResources,
    lastSave,
    selectAllCheckedSamples,
    selectSamples
  };
}
