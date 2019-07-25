import { FormikContext, FormikProps } from "formik";
import { toPairs } from "lodash";
import { useContext, useState } from "react";
import { ApiClientContext } from "..";
import {
  Chain,
  ChainStepTemplate,
  Sample,
  StepResource
} from "../../types/seqdb-api";
import { serialize } from "../../util/serialize";
import { HttpMethod } from "../api-client/jsonapi-types";
import { StepRendererProps } from "../workflow/StepRenderer";

export function useSelectionControls({ chain, step }: StepRendererProps) {
  const { doOperations } = useContext(ApiClientContext);

  // Random number to be changed every time a sample is selected.
  // This number is passed into the Query component's query, which re-fetches
  // the data when any part of the query changes.
  const [randomNumber, setRandomNumber] = useState<number>(Math.random());

  const [availableSamples, setAvailableSamples] = useState<Sample[]>([]);
  const [lastCheckedSample, setLastCheckedSample] = useState<Sample>();

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

    const serialized = await Promise.all(
      newStepResources.map(newStepResource =>
        serialize({
          resource: newStepResource,
          type: "stepResource"
        })
      )
    );

    let tempId = -100;
    for (const s of serialized) {
      s.id = tempId--;
    }

    try {
      setLoading(true);
      await doOperations(
        serialized.map(value => ({
          op: "POST" as HttpMethod,
          path: "stepResource",
          value
        }))
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

  function onCheckBoxClick(
    e: MouseEvent,
    { setFieldValue }: FormikContext<any>,
    checkedSample: Sample
  ) {
    if (lastCheckedSample && e.shiftKey) {
      const checked: boolean = (e.target as any).checked;

      const currentIndex = availableSamples.indexOf(checkedSample);
      const lastIndex = availableSamples.indexOf(lastCheckedSample);

      const [lowIndex, highIndex] = [currentIndex, lastIndex].sort(
        (a, b) => a - b
      );

      const samplesToToggle = availableSamples.slice(lowIndex, highIndex + 1);

      for (const sample of samplesToToggle) {
        setFieldValue(`checkedIds[${sample.id}]`, checked);
      }
    }
    setLastCheckedSample(checkedSample);
  }

  return {
    loading,
    onCheckBoxClick,
    randomNumber,
    removeSample,
    selectAllCheckedSamples,
    selectSamples,
    setAvailableSamples
  };
}
