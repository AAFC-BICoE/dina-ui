import { FormikActions, FormikProps } from "formik";
import { toPairs } from "lodash";
import { useContext, useState } from "react";
import { PreLibraryPrep } from "types/seqdb-api/resources/workflow/PreLibraryPrep";
import { ApiClientContext, Operation, useQuery } from "../..";
import {
  Chain,
  ChainStepTemplate,
  StepResource
} from "../../../types/seqdb-api";
import { StepRendererProps } from "../StepRenderer";

export function usePreLibraryPrepControls({ chain, step }: StepRendererProps) {
  const { apiClient, doOperations, save } = useContext(ApiClientContext);

  const [visibleSamples, setVisibleSamples] = useState<StepResource[]>([]);
  const [randomNumber, setRandomNumber] = useState(Math.random());

  const visibleSampleIds = visibleSamples.length
    ? visibleSamples.map(sr => sr.sample.id).join(",")
    : 0;

  const { loading: plpSrLoading } = useQuery<StepResource[]>(
    {
      fields: { sample: "name,version" },
      filter: {
        "chain.chainId": chain.id,
        "chainStepTemplate.chainStepTemplateId": step.id,
        rsql: `sample.sampleId=in=(${visibleSampleIds}) and sample.name!=${randomNumber}`
      },
      include: "sample,preLibraryPrep",
      page: { limit: 1000 }, // Maximum page limit. There should only be 1 or 2 prelibrarypreps per sample.
      path: "stepResource"
    },
    {
      onSuccess: ({ data: plpSrs }) => {
        // Add client-side "shearingPrep" and "sizeSelectionPrep" properties to the sample stepResources.
        for (const sampleSr of visibleSamples) {
          const shearingSr = plpSrs.find(
            plpSr =>
              plpSr.sample.id === sampleSr.sample.id &&
              plpSr.value === "SHEARING"
          );

          const sizeSelectionSr = plpSrs.find(
            plpSr =>
              plpSr.sample.id === sampleSr.sample.id &&
              plpSr.value === "SIZE_SELECTION"
          );

          sampleSr.shearingPrep = shearingSr
            ? shearingSr.preLibraryPrep
            : undefined;
          sampleSr.sizeSelectionPrep = sizeSelectionSr
            ? sizeSelectionSr.preLibraryPrep
            : undefined;
        }
      }
    }
  );

  async function plpFormSubmit(
    values,
    { setFieldValue, setSubmitting }: FormikActions<any>
  ) {
    const { checkedIds, ...plpValues } = values;

    if (plpValues.protocol) {
      plpValues.protocol.type = "protocol";
    }
    if (plpValues.product) {
      plpValues.product.type = "product";
    }

    const checkedSampleIds = toPairs(checkedIds)
      .filter(pair => pair[1])
      .map(pair => pair[0]);

    try {
      // Find the existing PreLibraryPreps stepResources for these samples.
      // These should be edited instead of creating new ones.
      const existingStepResources: StepResource[] = checkedSampleIds.length
        ? (await apiClient.get("stepResource", {
            filter: {
              "chain.chainId": chain.id,
              "chainStepTemplate.chainStepTemplateId": step.id,
              "preLibraryPrep.preLibraryPrepType": plpValues.preLibraryPrepType,
              rsql: `sample.sampleId=in=(${checkedSampleIds})`
            },
            include: "sample,preLibraryPrep",
            page: { limit: 1000 } // Max page limit
          })).data
        : [];

      const plps = checkedSampleIds.map(checkedSampleId => {
        const existingStepResource = existingStepResources.find(
          sr => sr.sample.id === checkedSampleId
        );

        if (existingStepResource) {
          return {
            resource: {
              ...plpValues,
              id: existingStepResource.preLibraryPrep.id
            },
            type: "preLibraryPrep"
          };
        } else {
          return {
            resource: plpValues,
            type: "preLibraryPrep"
          };
        }
      });

      const savedPlps = (await save(plps)) as PreLibraryPrep[];

      const newStepResources = checkedSampleIds
        .map((sampleId, i) => ({
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
        }))
        // Don't create a new step resource if there is already one for this sample.
        .filter(
          newSr =>
            !existingStepResources
              .map(existingSr => existingSr.sample.id)
              .includes(newSr.sample.id)
        );

      await save(
        newStepResources.map(resource => ({
          resource,
          type: "stepResource"
        }))
      );
      setRandomNumber(Math.random());

      setFieldValue("checkedIds", {});
    } catch (err) {
      alert(err);
    }
    setSubmitting(false);
  }

  async function deleteStepResources(
    plpType: "SHEARING" | "SIZE_SELECTION",
    formikProps: FormikProps<any>
  ) {
    formikProps.setSubmitting(true);
    try {
      const { checkedIds } = formikProps.values;

      const checkedSampleIds = toPairs(checkedIds)
        .filter(pair => pair[1])
        .map(pair => pair[0]);

      // Find the existing PreLibraryPreps stepResources for these samples.
      // These should be edited instead of creating new ones.
      const stepResourcesToDelete: StepResource[] = checkedSampleIds.length
        ? (await apiClient.get("stepResource", {
            filter: {
              "chain.chainId": chain.id,
              "chainStepTemplate.chainStepTemplateId": step.id,
              "preLibraryPrep.preLibraryPrepType": plpType,
              rsql: `sample.sampleId=in=(${checkedSampleIds})`
            },
            include: "sample,preLibraryPrep",
            page: { limit: 1000 } // Max page limit
          })).data
        : [];

      const plpsToDelete = stepResourcesToDelete.map(sr => sr.preLibraryPrep);

      const plpOperations: Operation[] = plpsToDelete.map(plp => ({
        op: "DELETE",
        path: `preLibraryPrep/${plp.id}`
      }));

      const srOperations: Operation[] = stepResourcesToDelete.map(sr => ({
        op: "DELETE",
        path: `stepResource/${sr.id}`
      }));

      const operations = [...srOperations, ...plpOperations];

      await doOperations(operations);
      setRandomNumber(Math.random());
      formikProps.setFieldValue("checkedIds", {});
    } catch (err) {
      alert(err);
    }
    formikProps.setSubmitting(false);
  }

  return {
    deleteStepResources,
    plpFormSubmit,
    plpSrLoading,
    setVisibleSamples
  };
}
