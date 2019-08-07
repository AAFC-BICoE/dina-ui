import { FormikProps } from "formik";
import { toPairs } from "lodash";
import { useContext, useState } from "react";
import { ApiClientContext } from "..";
import {
  Chain,
  ChainStepTemplate,
  Sample,
  StepResource
} from "../../types/seqdb-api";
import { StepRendererProps } from "../workflow/StepRenderer";

export function useSelectionControls({ chain, step }: StepRendererProps) {
  const { doOperations, save } = useContext(ApiClientContext);

  // Random number to be changed every time a sample is selected.
  // This number is passed into the Query component's query, which re-fetches
  // the data when any part of the query changes.
  const [randomNumber, setRandomNumber] = useState<number>(Math.random());

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

      setRandomNumber(Math.random());
    } catch (err) {
      alert(err);
    }
    setLoading(false);
  }

  async function selectAllCheckedSamples(formikProps: FormikProps<any>) {
    const { checkedIds } = formikProps.values;
    const ids = toPairs(checkedIds)
      .filter(pair => pair[1])
      .map(pair => pair[0]);

    const samples: Sample[] = ids.map(id => ({
      id,
      type: "sample"
    })) as Sample[];

    await selectSamples(samples);

    for (const id of ids) {
      formikProps.setFieldValue(`checkedIds[${id}]`, false);
    }
  }

  async function removeSample(stepResource: StepResource) {
    try {
      setLoading(true);
      await doOperations([
        {
          op: "DELETE",
          path: `stepResource/${stepResource.id}`,
          value: {
            id: stepResource.id,
            type: "stepResource"
          }
        }
      ]);

      setRandomNumber(Math.random());
    } catch (err) {
      alert(err);
    }
    setLoading(false);
  }

  return {
    loading,
    randomNumber,
    removeSample,
    selectAllCheckedSamples,
    selectSamples
  };
}
