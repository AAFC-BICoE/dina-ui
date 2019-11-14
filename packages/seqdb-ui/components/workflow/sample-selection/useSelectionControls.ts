import { ApiClientContext, HttpMethod } from "common-ui";
import { FormikProps } from "formik";
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
  const [loading, setLoading] = useState(false);

  async function selectSamples(samples: Sample[]) {
    const newStepResources: StepResource[] = samples.map(sample => ({
      chain: { id: chain.id, type: chain.type } as Chain,
      chainStepTemplate: {
        id: step.id,
        type: "chainStepTemplate"
      } as ChainStepTemplate,
      sample,
      type: "INPUT",
      value: "SAMPLE"
    }));

    try {
      setLoading(true);
      await save(
        newStepResources.map(sr => ({ resource: sr, type: "stepResource" }))
      );

      setLastSave(Date.now());
    } catch (err) {
      alert(err);
    }
    setLoading(false);
  }

  async function selectAllCheckedSamples(formikProps: FormikProps<any>) {
    const { sampleIdsToSelect } = formikProps.values;
    const ids = toPairs(sampleIdsToSelect)
      .filter(pair => pair[1])
      .map(pair => pair[0]);

    const samples = ids.map(id => ({
      id,
      type: "sample"
    })) as Sample[];

    await selectSamples(samples);

    formikProps.setFieldValue("sampleIdsToSelect", {});
  }

  async function deleteStepResources(stepResources: StepResource[]) {
    try {
      setLoading(true);
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
    } catch (err) {
      alert(err);
    }
    setLoading(false);
  }

  async function deleteAllCheckedStepResources(formikProps: FormikProps<any>) {
    try {
      const { stepResourceIdsToDelete } = formikProps.values;

      const ids = toPairs(stepResourceIdsToDelete)
        .filter(pair => pair[1])
        .map(pair => pair[0]);

      const stepResources = ids.map(id => ({
        id,
        type: "stepResource"
      })) as StepResource[];

      await deleteStepResources(stepResources);

      formikProps.setFieldValue("stepResourceIdsToDelete", {});
    } catch (err) {
      alert(err);
    }
    setLoading(false);
  }

  return {
    deleteAllCheckedStepResources,
    deleteStepResources,
    lastSave,
    loading,
    selectAllCheckedSamples,
    selectSamples
  };
}
