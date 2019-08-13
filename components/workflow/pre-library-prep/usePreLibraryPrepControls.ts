import { FormikActions } from "formik";
import { toPairs } from "lodash";
import { useContext, useState } from "react";
import { PreLibraryPrep } from "types/seqdb-api/resources/workflow/PreLibraryPrep";
import { ApiClientContext, useQuery } from "../..";
import {
  Chain,
  ChainStepTemplate,
  StepResource
} from "../../../types/seqdb-api";
import { StepRendererProps } from "../StepRenderer";

export function usePreLibraryPrepControls({ chain, step }: StepRendererProps) {
  const { save } = useContext(ApiClientContext);

  const [visibleSamples, setVisibleSamples] = useState<StepResource[]>([]);
  const [, setLoading] = useState(false);
  const [randomNumber, setRandomNumber] = useState(Math.random());

  const visibleSampleIds = visibleSamples.length
    ? visibleSamples.map(sr => sr.sample.id).join(",")
    : 0;

  const { loading: plpSrLoading, response: plpSrResponse } = useQuery<
    StepResource[]
  >({
    fields: { sample: "name,version" },
    filter: {
      "chain.chainId": chain.id,
      "chainStepTemplate.chainStepTemplateId": step.id,
      rsql: `sample.sampleId=in=(${visibleSampleIds}) and sample.name!=${randomNumber}`
    },
    include: "sample,preLibraryPrep",
    page: { limit: 1000 }, // Maximum page limit. There should only be 1 or 2 prelibrarypreps per sample.
    path: "stepResource"
  });

  async function plpFormSubmit(
    values,
    { setFieldValue, setSubmitting }: FormikActions<any>
  ) {
    const { checkedIds, ...plpValues } = values;

    const selectedSampleIds = toPairs(checkedIds)
      .filter(pair => pair[1])
      .map(pair => pair[0]);

    try {
      setLoading(true);

      const plps = selectedSampleIds.map(() => ({
        resource: plpValues,
        type: "preLibraryPrep"
      }));

      const savedPlps = (await save(plps)) as PreLibraryPrep[];

      const stepResources = selectedSampleIds.map((sampleId, i) => ({
        chain: { id: chain.id, type: chain.type } as Chain,
        chainStepTemplate: {
          id: step.id,
          type: step.type
        } as ChainStepTemplate,
        preLibraryPrep: {
          id: String(savedPlps[i].id),
          type: "preLibraryPrep"
        } as PreLibraryPrep,
        sample: { id: sampleId, type: "sample" },
        type: "INPUT",
        value: savedPlps[i].preLibraryPrepType
      }));

      await save(
        stepResources.map(resource => ({
          resource,
          type: "stepResource"
        }))
      );

      setRandomNumber(Math.random());

      for (const id of selectedSampleIds) {
        setFieldValue(`checkedIds[${id}]`, false);
      }
    } catch (err) {
      alert(err);
    }
    setSubmitting(false);
    setLoading(false);
  }

  return {
    plpFormSubmit,
    plpSrLoading,
    plpSrResponse,
    setVisibleSamples
  };
}
