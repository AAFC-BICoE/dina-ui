import { ApiClientContext, Operation, safeSubmit, useQuery } from "common-ui";
import { FormikProps } from "formik";
import { toPairs } from "lodash";
import { useContext, useState } from "react";
import { PreLibraryPrep } from "../../../types/seqdb-api/resources/workflow/PreLibraryPrep";
import {
  Chain,
  ChainStepTemplate,
  Sample,
  StepResource
} from "../../../types/seqdb-api";
import { StepRendererProps } from "../StepRenderer";

export function usePreLibraryPrepControls({ chain, step }: StepRendererProps) {
  const { apiClient, doOperations, save } = useContext(ApiClientContext);

  const [visibleSamples, setVisibleSamples] = useState<StepResource[]>([]);

  // Keep track of the last save operation, so the data is re-fetched immediately after saving.
  const [lastSave, setLastSave] = useState<number>();

  const visibleSampleIds = visibleSamples.length
    ? visibleSamples.map(sr => (sr.sample as Sample).id).join(",")
    : 0;

  const { loading: plpSrLoading } = useQuery<StepResource[]>(
    {
      fields: {
        product: "name",
        protocol: "name",
        sample: "name,version"
      },
      filter: {
        "chain.chainId": chain.id,
        "chainStepTemplate.chainStepTemplateId": step.id,
        rsql: `sample.sampleId=in=(${visibleSampleIds})`
      },
      include:
        "sample,preLibraryPrep,preLibraryPrep.protocol,preLibraryPrep.product",
      page: { limit: 1000 }, // Maximum page limit. There should only be 1 or 2 prelibrarypreps per sample.
      path: "seqdb-api/stepResource"
    },
    {
      deps: [lastSave],
      onSuccess: ({ data: plpSrs }) => {
        // Add client-side "shearingPrep" and "sizeSelectionPrep" properties to the sample stepResources.
        for (const sampleSr of visibleSamples) {
          const shearingSr = plpSrs.find(
            plpSr =>
              plpSr.sample &&
              plpSr.sample.id === (sampleSr.sample as Sample).id &&
              plpSr.value === "SHEARING"
          );

          const sizeSelectionSr = plpSrs.find(
            plpSr =>
              plpSr.sample &&
              plpSr.sample.id === (sampleSr.sample as Sample).id &&
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

  const plpFormSubmit = safeSubmit(async (values, { setFieldValue }) => {
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

    // Find the existing PreLibraryPreps stepResources for these samples.
    // These should be edited instead of creating new ones.
    const existingStepResources = checkedSampleIds.length
      ? (
          await apiClient.get<StepResource[]>("seqdb-api/stepResource", {
            filter: {
              "chain.chainId": chain.id,
              "chainStepTemplate.chainStepTemplateId": step.id,
              "preLibraryPrep.preLibraryPrepType": plpValues.preLibraryPrepType,
              rsql: `sample.sampleId=in=(${checkedSampleIds})`
            },
            include: "sample,preLibraryPrep",
            page: { limit: 1000 } // Max page limit
          })
        ).data
      : [];

    const plps = checkedSampleIds.map(checkedSampleId => {
      const existingStepResource = existingStepResources.find(
        sr => (sr.sample as Sample).id === checkedSampleId
      );

      if (existingStepResource) {
        return {
          resource: {
            ...plpValues,
            id: (existingStepResource.preLibraryPrep as PreLibraryPrep).id
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

    const savedPlps = (await save(plps, {
      apiBaseUrl: "/seqdb-api"
    })) as PreLibraryPrep[];

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
        type: "stepResource",
        value: savedPlps[i].preLibraryPrepType
      }))
      // Don't create a new step resource if there is already one for this sample.
      .filter(
        newSr =>
          !existingStepResources
            // Assume the Sample is present because the query filters for only StepResources with linked Samples.
            .map(existingSr => (existingSr.sample as Sample).id)
            .includes(newSr.sample.id)
      );

    await save(
      newStepResources.map(resource => ({
        resource,
        type: "stepResource"
      })),
      { apiBaseUrl: "/seqdb-api" }
    );
    setLastSave(Date.now());

    setFieldValue("checkedIds", {});
  });

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
      const stepResourcesToDelete = checkedSampleIds.length
        ? (
            await apiClient.get<StepResource[]>("seqdb-api/stepResource", {
              filter: {
                "chain.chainId": chain.id,
                "chainStepTemplate.chainStepTemplateId": step.id,
                "preLibraryPrep.preLibraryPrepType": plpType,
                rsql: `sample.sampleId=in=(${checkedSampleIds})`
              },
              include: "sample,preLibraryPrep",
              page: { limit: 1000 } // Max page limit
            })
          ).data
        : [];

      const plpsToDelete = stepResourcesToDelete.map(
        sr => sr.preLibraryPrep as PreLibraryPrep
      );

      const plpOperations: Operation[] = plpsToDelete.map(plp => ({
        op: "DELETE",
        path: `preLibraryPrep/${plp.id}`
      }));

      const srOperations: Operation[] = stepResourcesToDelete.map(sr => ({
        op: "DELETE",
        path: `stepResource/${sr.id}`
      }));

      const operations = [...srOperations, ...plpOperations];

      await doOperations(operations, { apiBaseUrl: "/seqdb-api" });
      setLastSave(Date.now());
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
